package httputil

import (
    "net/http"
    "strings"

    "fingerauth/pkg/store"
)

func ExtractFingerprint(r *http.Request) store.Fingerprint {
	return store.Fingerprint{
		JA3:       r.Header.Get("X-JA3-FP"),
		JA4:       r.Header.Get("X-JA4-FP"),
		PeetPrint: r.Header.Get("X-PeetPrint-FP"),
		UserAgent: r.Header.Get("User-Agent"),
		IP:        ExtractClientIP(r),
	}
}

func ExtractClientIP(r *http.Request) string {
	// Prefer X-Forwarded-For from fingerproxy
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	// Fallback to RemoteAddr
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}
	return ip
}