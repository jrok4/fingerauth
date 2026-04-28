package handler

import (
	"time"
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"

	"fingerauth/internal/httputil"
	"fingerauth/pkg/sentinel/ipdata"
	"fingerauth/pkg/sentinel/scoring"
	"fingerauth/pkg/store"
)

type Handler struct {
	store  store.Store
	ip     *ipdata.Client
	scorer *scoring.Engine
}

func New(s store.Store, ip *ipdata.Client, scorer *scoring.Engine) *Handler {
	return &Handler{store: s, ip: ip, scorer: scorer}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.Theme == "Emerald" && !req.ClientFingerprint.IsValid() {
		writeJSON(w, http.StatusForbidden, BanResponse{
			Ban: BanInfo{
				Reason:   "The source code is corrupted",
				Expires:  nil,
				BannedAt: time.Now().UTC().Format(time.RFC3339),
			},
		})
		return
	}

	if req.Username == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "username and password required"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	user := store.User{
		Username:     req.Username,
		PasswordHash: string(hash),
	}

	if err := h.store.CreateUser(user); err != nil {
		if err == store.ErrUserExists {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "user already exists"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	fp := httputil.ExtractFingerprint(r)
	fp.Client = req.ClientFingerprint
	_ = h.store.AddFingerprint(req.Username, &fp)

	writeJSON(w, http.StatusCreated, map[string]string{
		"message":  "user registered",
		"username": req.Username,
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.Theme == "Emerald" && !req.ClientFingerprint.IsValid() {
		writeJSON(w, http.StatusForbidden, BanResponse{
			Ban: BanInfo{
				Reason:   "The source code is corrupted",
				Expires:  nil,
				BannedAt: time.Now().UTC().Format(time.RFC3339),
			},
		})
		return
	}

	user, err := h.store.GetUser(req.Username)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	fp := httputil.ExtractFingerprint(r)
	fp.Client = req.ClientFingerprint
	// _ = h.store.AddFingerprint(req.Username, &fp)
	ipInfo, _ := h.ip.Lookup(fp.IP)

	result := h.scorer.Evaluate(user.Fingerprints, fp, ipInfo)

	if req.Theme == "Emerald" && result.Verdict == "ban" {
		writeJSON(w, http.StatusForbidden, BanResponse{
			Ban: BanInfo{
				Reason:   "Fraud Detection System",
				Expires:  nil,
				BannedAt: time.Now().UTC().Format(time.RFC3339),
			},
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":     "login evaluated",
		"username":    req.Username,
		"score":       result.Score,
		"verdict":     result.Verdict,
		"reasons":     result.Reasons,
		"fingerprint": fp,
		"ip_info":     ipInfo,
	})
}

func (h *Handler) DebugFingerprint(w http.ResponseWriter, r *http.Request) {
	fp := httputil.ExtractFingerprint(r)
	ipInfo, _ := h.ip.Lookup(fp.IP)

	entry, found, err := h.store.CheckJA3Blacklist(fp.JA3)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"fingerprint":   fp,
			"ip_info":       ipInfo,
			"ja3_blacklist": nil,
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"fingerprint": fp,
		"ip_info":     ipInfo,
		"ja3_blacklist": map[string]interface{}{
			"found":  found,
			"reason": entry.Reason,
		},
	})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}