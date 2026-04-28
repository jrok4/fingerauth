package handler

import "fingerauth/pkg/sentinel/js_fingerprint"

type authRequest struct {
    Username          string `json:"username"`
    Password          string `json:"password"`
    RememberMe        bool   `json:"rememberMe"`
    Theme             string `json:"theme"`
    ClientFingerprint *js_fingerprint.ClientFingerprint `json:"clientFingerprint"`
}

type registerRequest struct {
    FullName          string `json:"fullName"`
    Username          string `json:"username"`
    Password          string `json:"password"`
    Theme             string `json:"theme"`
    ClientFingerprint *js_fingerprint.ClientFingerprint `json:"clientFingerprint"`
}

type BanInfo struct {
    Reason   string  `json:"reason"`
    Expires  *string `json:"expires"`
    BannedAt string  `json:"bannedAt"`
}

type BanResponse struct {
    Ban BanInfo `json:"ban"`
}