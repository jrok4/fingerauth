package main

import (
	"fmt"
	"io/fs"
	"log"
	"os"
	"os/signal"
	"net/http"
	"strings"
	"context"
	"syscall"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	fingerauth "fingerauth"
	"fingerauth/pkg/sentinel"
	fp "fingerauth/pkg/sentinel/fingerprint"
	"fingerauth/internal/httputil"
	"fingerauth/internal/handler"
	"fingerauth/pkg/sentinel/ipdata"
	"fingerauth/pkg/sentinel/scoring"
	"fingerauth/pkg/store"
	"fingerauth/pkg/server"
)

const logFlags = log.LstdFlags | log.Lshortfile | log.Lmsgprefix

var (
	KeenEyeServerLog = log.New(os.Stderr, "[KeenEyeServer] ", logFlags)
	HTTPServerLog    = log.New(os.Stderr, "[http] ", logFlags)
	PrometheusLog    = log.New(os.Stderr, "[metrics] ", logFlags)
	CertWatcherLog   = log.New(os.Stderr, "[certwatcher] ", logFlags)
	FingerprintLog   = log.New(os.Stderr, "[fingerprint] ", logFlags)
	SentinelLog      = log.New(os.Stderr, "[sentinel] ", logFlags)

	PrometheusRegistry  *prometheus.Registry
)

func DefaultHeaderInjectors(maxHTTP2PriorityFrames uint) []sentinel.HeaderInjector {
	h2fp := &fp.HTTP2FingerprintParam{
		MaxPriorityFrames: maxHTTP2PriorityFrames,
	}
	return []sentinel.HeaderInjector {
		fp.NewFingerprintHeaderInjector("X-JA3-FP", fp.JA3SortedFP),
		fp.NewFingerprintHeaderInjector("X-JA4-FP", fp.JA4FP),
		fp.NewFingerprintHeaderInjector("X-HTTP2-FP", h2fp.HTTP2FP),
		fp.NewFingerprintHeaderInjector("X-PeetPrint-FP", fp.PeetPrintFP),
	}
}

func evaluateRequest(store store.Store, ip *ipdata.Client) func(r *http.Request) (bool, string, error) {
    return func(r *http.Request) (decline bool, reason string, err error) {
        fp := httputil.ExtractFingerprint(r)
        ipInfo, err := ip.Lookup(fp.IP)
        if err != nil {
            return false, "", fmt.Errorf("ip lookup failed: %w", err)
        }

        entry, found, err := store.CheckJA3Blacklist(fp.JA3)
        if err != nil {
            return false, "", fmt.Errorf("ja3 blacklist check failed: %w", err)
        }

        var reasons []string

        if found {
            reasons = append(reasons, "blacklisted JA3: "+entry.Reason)
        }

        t := ipInfo.Threat
        if t.IsTor {
            reasons = append(reasons, "tor exit node")
        }
        if t.IsVPN {
            reasons = append(reasons, "vpn detected")
        }
        if t.IsDatacenter {
            reasons = append(reasons, "datacenter IP")
        }
        if t.IsKnownAttacker {
            reasons = append(reasons, "known attacker")
        }
        if t.IsKnownAbuser {
            reasons = append(reasons, "known abuser")
        }
        if t.IsThreat {
            reasons = append(reasons, "threat detected")
        }
        if len(t.Blocklists) > 0 {
            reasons = append(reasons, "blocklist: "+strings.Join(blocklistNames(t.Blocklists), ", "))
        }

        if len(reasons) > 0 {
            return true, strings.Join(reasons, "; "), nil
        }

        return false, "", nil
    }
}

func blocklistNames(blocklists []ipdata.Blocklist) []string {
    names := make([]string, len(blocklists))
    for i, b := range blocklists {
        names[i] = b.Name
    }
    return names
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg := DefaultConfig()
	cfg.RegisterFlags()
	parseFlags()

	pgStore, err := store.NewPostgresStore(ctx, cfg.PostgresDSN)
	if err != nil {
		log.Fatal(err)
	}
	defer pgStore.Close()

	
	ipClient := ipdata.NewClient(cfg.IpDataApiKey, cfg.IpDataFIFOLen)
	scorer := scoring.NewEngine()
	h := handler.New(pgStore, ipClient, scorer)

	mux := http.NewServeMux()

	// API
	mux.HandleFunc("GET /api/debug/fingerprint", h.DebugFingerprint)
	mux.HandleFunc("POST /api/auth/register", h.Register)
	mux.HandleFunc("POST /api/auth/login", h.Login)

	// Embedded React frontend
	frontendFiles, err := fs.Sub(fingerauth.FrontendFS, "frontend/build")
	if err != nil {
		log.Fatal("embedded frontend not found:", err)
	}

	fileServer := http.FileServer(http.FS(frontendFiles))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		if f, err := frontendFiles.Open(path); err == nil {
			f.Close()
			fileServer.ServeHTTP(w, r)
			return
		}

		// SPA fallback
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})

	if cfg.EnableMetrics {
		PrometheusRegistry = prometheus.NewRegistry()

		PrometheusLog.Printf("server listening on %s", cfg.MetricsListenAddr)
		go http.ListenAndServe(
			cfg.MetricsListenAddr,
			promhttp.HandlerFor(PrometheusRegistry, promhttp.HandlerOpts{
				ErrorLog: PrometheusLog,
			}),
		)
	}

	opts := server.KeenEyeServerOpts{
		HTTPServerLog:       HTTPServerLog,
		FingerprintLog:      FingerprintLog,
		CertWatcherLog:      CertWatcherLog,
		KeenEyeServerLog:    KeenEyeServerLog,
		SentinelLog:		 SentinelLog,
		VerboseLogs:         cfg.VerboseLogs,

		CertFilename: cfg.CertFilename,
		KeyFilename:  cfg.KeyFilename,

		TimeoutHTTPIdle:     cfg.TimeoutHTTPIdle,
		TimeoutHTTPRead:     cfg.TimeoutHTTPRead,
		TimeoutHTTPWrite:    cfg.TimeoutHTTPWrite,
		TimeoutTLSHandshake: cfg.TimeoutTLSHandshake,

		MaxHTTP2PriorityFrames: cfg.MaxHTTP2PriorityFrames,

		PrometheusRegistry: PrometheusRegistry,
		DurationMetricBuckets: cfg.DurationMetricBuckets,
	}

	opts.InitFingerprint()
	guard := sentinel.NewHTTPHandler(mux, opts.SentinelLog, DefaultHeaderInjectors(opts.MaxHTTP2PriorityFrames))
	guard.EvaluateRequest = evaluateRequest(pgStore, ipClient)
	guard.IsProbeRequest = sentinel.IsKubernetesProbeRequest

	srv := server.NewKeenEyeServer(ctx, guard, opts)
	srv.ListenAndServe(cfg.ListenAddr)

}