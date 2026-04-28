package store

import (
	"time"
	"errors"

	"fingerauth/pkg/sentinel/js_fingerprint"
)

var ErrUserExists = errors.New("user already exists")
var ErrUserNotFound = errors.New("user not found")

type Fingerprint struct {
	// server-side (TLS + request)
	JA3       string `json:"ja3"`
	JA4       string `json:"ja4"`
	PeetPrint string `json:"peet_print"`
	UserAgent string `json:"user_agent"`
	IP        string `json:"ip"`

	// client-side (JavaScript fingerprint)
	Client *js_fingerprint.ClientFingerprint `json:"client,omitempty"`
	
	CreatedAt time.Time `json:"createdAt"`
}

type User struct {
	Username     string        `json:"username"`
	PasswordHash string        `json:"-"`
	Fingerprints []Fingerprint `json:"fingerprints"`
}

type BlacklistedJA3 struct {
    Hash    string `json:"hash"`
    Reason  string `json:"reason"`
}

type Store interface {
	CreateUser(user User) error
	GetUser(username string) (User, error)
	AddFingerprint(username string, fp *Fingerprint) error
	CheckJA3Blacklist(hash string) (BlacklistedJA3, bool, error)
}