# FingerAuth

A multi-layer authentication prototype that detects malicious bots and account compromise attempts using IP intelligence, TLS fingerprinting, and client-side fingerprinting combined into a risk-scoring engine.

---

## Overview

FingerAuth evaluates each authentication request across three independent layers and produces a transparent, rule-based risk score:

- **Network layer** — IP reputation, geolocation, proxy/VPN/Tor detection via ipdata.co
- **Transport layer** — JA3, JA4, PeetPrint, and HTTP/2 fingerprints captured at TLS handshake
- **Client layer** — Canvas, WebGL, AudioContext, fonts, plugins, automation signals, and consistency checks collected in-browser

Each request starts at a baseline score of 100 and is reduced based on anomalies detected across the layers. Scores below 50 result in a `ban` verdict.

---

## Architecture

```
Client ──TLS──► Ingress (ClientHello capture)
                    │
                    ▼
           Header Injectors (JA3 / JA4 / PeetPrint / HTTP2)
                    │
                    ▼
           Screening (IP enrichment + JA3 blacklist)
                    │
                    ▼
           Auth Handler (register / login)
                    │
                    ▼
           Scoring Engine ──► PostgreSQL (history)
                    │
                    ▼
                Verdict
```

---

## Stack

- **Language:** Go
- **Database:** PostgreSQL (with JSONB for client fingerprints)
- **TLS server:** Custom build on top of fingerproxy
- **Frontend:** React + TypeScript (Vite, embedded into binary)
- **Metrics:** Prometheus
- **External:** ipdata.co (IP enrichment, cached via FIFO)

---

## Project Layout

```
.
├── main.go, flags.go, env.go, embed.go
├── internal/
│   ├── handler/        # register, login, debug endpoints
│   └── httputil/       # request fingerprint extraction
├── pkg/
│   ├── sentinel/
│   │   ├── fingerprint/   # JA3, JA4, PeetPrint, HTTP/2
│   │   ├── ja3, ja4, peetprint
│   │   ├── ipdata/        # ipdata.co client + cache
│   │   ├── js_fingerprint/# client fingerprint schema
│   │   └── scoring/       # rule-based risk engine
│   ├── store/             # Postgres + in-memory store
│   ├── fifocache/         # generic FIFO cache
│   └── server/            # TLS server wiring
└── frontend/              # React/TS client
```

---

## Configuration

Configurable via environment variables or CLI flags:

| Variable | Default | Description |
|---|---|---|
| `LISTEN_ADDR` | `:443` | Server listen address |
| `CERT_FILENAME` / `CERTKEY_FILENAME` | `tls.crt` / `tls.key` | TLS cert paths |
| `POSTGRES_DSN` | — | PostgreSQL connection string |
| `IPDATA_API_KEY` | — | ipdata.co API key |
| `IPDATA_FIFO_LEN` | `1024` | IP cache size |
| `ENABLE_METRICS` | `false` | Expose Prometheus metrics |
| `METRICS_LISTEN_ADDR` | `:444` | Metrics endpoint |
| `VERBOSE` | `false` | Verbose logs |

---

## Build & Run

```bash
# Build frontend
cd frontend && npm install && npm run build && cd ..

# Build server
go build -o fingerauth .

# Run
POSTGRES_DSN="postgres://user:pass@localhost/fingerauth" \
IPDATA_API_KEY="your-key" \
./fingerauth
```

---

## API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create user, store baseline fingerprint |
| `POST` | `/api/auth/login` | Verify password and evaluate risk score |
| `GET` | `/api/debug/fingerprint` | Inspect current request fingerprint |

---

## Scoring Summary

| Category | Range of deductions |
|---|---|
| Automation indicators | −25 |
| Client consistency failures | −5 each |
| Cross-layer mismatches (UA, timezone) | −5 to −10 |
| Network location changes | −3 to −10 |
| Unseen TLS fingerprints (JA3/JA4/PeetPrint) | −5 to −15 |
| Unseen client fingerprint and device attributes | −3 to −10 |

Final score is clamped to `[0, 100]`. Verdict is `allow` if `score ≥ 50`, otherwise `ban`.

---
