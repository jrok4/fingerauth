package server


import (
	"context"
	"crypto/tls"
	"net/http"
	"log"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/wi1dcard/fingerproxy/pkg/certwatcher"
	"github.com/wi1dcard/fingerproxy/pkg/proxyserver"

	fp "fingerauth/pkg/sentinel/fingerprint"
)

const logFlags = log.LstdFlags | log.Lshortfile | log.Lmsgprefix

type KeenEyeServerOpts struct {
	HTTPServerLog       *log.Logger
	FingerprintLog      *log.Logger
	CertWatcherLog      *log.Logger
	KeenEyeServerLog    *log.Logger
	SentinelLog			*log.Logger
	VerboseLogs    bool

	CertFilename string
	KeyFilename  string

	TimeoutHTTPIdle     time.Duration
	TimeoutHTTPRead     time.Duration
	TimeoutHTTPWrite    time.Duration
	TimeoutTLSHandshake time.Duration

	MaxHTTP2PriorityFrames uint

	PrometheusRegistry  *prometheus.Registry
	DurationMetricBuckets []float64
}

type KeenEyeServer struct {
	Server *proxyserver.Server
	opts   KeenEyeServerOpts
}

func defaultTLSConfig(cw *certwatcher.CertWatcher) *tls.Config {
	return &tls.Config{
		NextProtos:     []string{"h2", "http/1.1"},
		MinVersion:     tls.VersionTLS12,
		MaxVersion:     tls.VersionTLS13,
		GetCertificate: cw.GetCertificate,
	}
}

func (opts *KeenEyeServerOpts) InitFingerprint() {
	fp.Logger = opts.FingerprintLog
	fp.VerboseLogs = opts.VerboseLogs
	fp.RegisterDurationMetric(opts.PrometheusRegistry, opts.DurationMetricBuckets, "")
}

func (opts *KeenEyeServerOpts) initCertWatcher() *certwatcher.CertWatcher {
	certwatcher.Logger = opts.CertWatcherLog
	certwatcher.VerboseLogs = opts.VerboseLogs
	cw, err := certwatcher.New(opts.CertFilename, opts.KeyFilename)
	if err != nil {
		opts.KeenEyeServerLog.Fatalf(`invalid cert filename "%s" or certkey filename "%s": %s`, opts.CertFilename, opts.KeyFilename, err)
	}
	return cw
}

func NewKeenEyeServer(ctx context.Context, handler http.Handler, opts KeenEyeServerOpts) *KeenEyeServer {
	cw := opts.initCertWatcher()
	tlsConfig := defaultTLSConfig(cw)

	srv := proxyserver.NewServer(ctx, handler, tlsConfig)

	srv.VerboseLogs = opts.VerboseLogs
	srv.ErrorLog = opts.KeenEyeServerLog
	srv.HTTPServer.ErrorLog = opts.HTTPServerLog

	srv.MetricsRegistry = opts.PrometheusRegistry

	srv.HTTPServer.IdleTimeout = opts.TimeoutHTTPIdle
	srv.HTTPServer.ReadTimeout = opts.TimeoutHTTPRead
	srv.HTTPServer.WriteTimeout = opts.TimeoutHTTPWrite
	srv.TLSHandshakeTimeout = opts.TimeoutTLSHandshake

	return &KeenEyeServer{
		Server: srv,
		opts:   opts,
	}
}

func (s *KeenEyeServer) ListenAndServe(listenAddr string) error {
	s.opts.KeenEyeServerLog.Printf("server listening on %s", listenAddr)
	err := s.Server.ListenAndServe(listenAddr)
	s.opts.KeenEyeServerLog.Print(err)
	return err
}
