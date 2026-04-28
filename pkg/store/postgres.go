package store

import (
	"encoding/json"
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"fingerauth/pkg/sentinel/js_fingerprint"
)

type PostgresStore struct {
	pool *pgxpool.Pool
}

func NewPostgresStore(ctx context.Context, dsn string) (*PostgresStore, error) {
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}

	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return &PostgresStore{pool: pool}, nil
}

func (s *PostgresStore) Close() {
	s.pool.Close()
}

func (s *PostgresStore) CreateUser(user User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := s.pool.Exec(ctx,
		"INSERT INTO users (username, password_hash) VALUES ($1, $2)",
		user.Username, user.PasswordHash,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrUserExists
		}
		return err
	}

	return nil
}

func (s *PostgresStore) GetUser(username string) (User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	user := User{Username: username}

	err := s.pool.QueryRow(ctx,
		"SELECT password_hash FROM users WHERE username = $1",
		username,
	).Scan(&user.PasswordHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, ErrUserNotFound
		}
		return User{}, err
	}

	rows, err := s.pool.Query(ctx,
		`SELECT ja3, ja4, peet_print, user_agent, ip, client_hash, client_raw, created_at
		 FROM fingerprints WHERE username = $1 ORDER BY created_at DESC`,
		username,
	)
	if err != nil {
		return User{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var fp Fingerprint
		var clientHash *string
		var clientRaw []byte

		if err := rows.Scan(
			&fp.JA3, &fp.JA4, &fp.PeetPrint, &fp.UserAgent, &fp.IP,
			&clientHash, &clientRaw, &fp.CreatedAt,
		); err != nil {
			return User{}, err
		}

		if clientRaw != nil {
			var client js_fingerprint.ClientFingerprint
			if err := json.Unmarshal(clientRaw, &client); err == nil {
				fp.Client = &client
			}
		}

		user.Fingerprints = append(user.Fingerprints, fp)
	}

	if err := rows.Err(); err != nil {
		return User{}, err
	}

	return user, nil
}

func (s *PostgresStore) AddFingerprint(username string, fp *Fingerprint) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var exists bool
	err := s.pool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)",
		username,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return ErrUserNotFound
	}

	var clientHash *string
	var clientRaw []byte

	if fp.Client != nil {
		clientHash = fp.Client.Hash
		clientRaw, _ = json.Marshal(fp.Client)
	}

	return s.pool.QueryRow(ctx,
		`INSERT INTO fingerprints (username, ja3, ja4, peet_print, user_agent, ip, client_hash, client_raw)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING created_at`,
		username, fp.JA3, fp.JA4, fp.PeetPrint, fp.UserAgent, fp.IP, clientHash, clientRaw,
	).Scan(&fp.CreatedAt)
}

func (s *PostgresStore) CheckJA3Blacklist(hash string) (BlacklistedJA3, bool, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    var entry BlacklistedJA3
    err := s.pool.QueryRow(ctx,
        "SELECT hash, reason FROM blacklisted_ja3 WHERE hash = $1",
        hash,
    ).Scan(&entry.Hash, &entry.Reason)

    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return BlacklistedJA3{}, false, nil
        }
        return BlacklistedJA3{}, false, err
    }

    return entry, true, nil
}
