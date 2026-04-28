package store

import (
	"sync"
	"time"
)

type MemoryStore struct {
	mu    sync.RWMutex
	users map[string]User
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		users: make(map[string]User),
	}
}

func (m *MemoryStore) CreateUser(user User) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.users[user.Username]; exists {
		return ErrUserExists
	}
	m.users[user.Username] = user
	return nil
}

func (m *MemoryStore) GetUser(username string) (User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	user, exists := m.users[username]
	if !exists {
		return User{}, ErrUserNotFound
	}
	return user, nil
}

func (m *MemoryStore) AddFingerprint(username string, fp *Fingerprint) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	user, exists := m.users[username]
	if !exists {
		return ErrUserNotFound
	}

	fp.CreatedAt = time.Now().UTC()
	user.Fingerprints = append(user.Fingerprints, *fp)
	m.users[username] = user
	return nil
}

func (m *MemoryStore) CheckJA3Blacklist(hash string) (BlacklistedJA3, bool, error) {
	return BlacklistedJA3{}, false, nil
}