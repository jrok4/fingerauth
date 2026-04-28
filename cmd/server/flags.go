package main

import (
	"flag"
	"time"
    "strings"
    "strconv"
)

type Config struct {
    ListenAddr   string
    CertFilename string
    KeyFilename  string

    PostgresDSN  string

    IpDataApiKey           string
    IpDataFIFOLen          uint
    MaxHTTP2PriorityFrames uint
    EnableKubernetesProbe  bool

    TimeoutHTTPIdle     time.Duration
    TimeoutHTTPRead     time.Duration
    TimeoutHTTPWrite    time.Duration
    TimeoutTLSHandshake time.Duration

    EnableMetrics           bool
    MetricsListenAddr       string
    DurationMetricBuckets []float64

    VerboseLogs bool
}

func DefaultConfig() *Config {
    return &Config{
        ListenAddr:             envWithDefault("LISTEN_ADDR", ":443"),
        CertFilename:           envWithDefault("CERT_FILENAME", "tls.crt"),
        KeyFilename:            envWithDefault("CERTKEY_FILENAME", "tls.key"),
        PostgresDSN:            envWithDefault("POSTGRES_DSN", ""),
        IpDataApiKey:           envWithDefault("IPDATA_API_KEY", ""),
        IpDataFIFOLen:          envWithDefaultUint("IPDATA_FIFO_LEN", 1024),
        MaxHTTP2PriorityFrames: envWithDefaultUint("MAX_H2_PRIORITY_FRAMES", 10000),
        EnableKubernetesProbe:  envWithDefaultBool("ENABLE_KUBERNETES_PROBE", true),
        TimeoutHTTPIdle:        parseDuration(envWithDefault("TIMEOUT_HTTP_IDLE", "180s"), "http idle timeout"),
        TimeoutHTTPRead:        parseDuration(envWithDefault("TIMEOUT_HTTP_READ", "60s"), "http read timeout"),
        TimeoutHTTPWrite:       parseDuration(envWithDefault("TIMEOUT_HTTP_WRITE", "60s"), "http write timeout"),
        TimeoutTLSHandshake:    parseDuration(envWithDefault("TIMEOUT_TLS_HANDSHAKE", "10s"), "tls handshake timeout"),
        EnableMetrics:          envWithDefaultBool("ENABLE_METRICS", false),
        MetricsListenAddr:      envWithDefault("METRICS_LISTEN_ADDR", ":444"),
        DurationMetricBuckets:  parseDurationMetricBuckets(envWithDefault("DURATION_METRIC_BUCKETS", ".00001, .00002, .00005, .0001, .0002, .0005, .001, .005, .01")),
        VerboseLogs:            envWithDefaultBool("VERBOSE", false),
    }
}

func (c *Config) RegisterFlags() {
    flag.StringVar(&c.ListenAddr, "listen-addr", c.ListenAddr,
        "Listening address (env: LISTEN_ADDR)")
    flag.StringVar(&c.CertFilename, "cert-filename", c.CertFilename,
        "TLS certificate filename (env: CERT_FILENAME)")
    flag.StringVar(&c.KeyFilename, "certkey-filename", c.KeyFilename,
        "TLS certificate key filename (env: CERTKEY_FILENAME)")
    flag.StringVar(&c.PostgresDSN, "postgres-dsn", c.PostgresDSN,
        "PostgreSQL connection string (env: POSTGRES_DSN)")
    flag.StringVar(&c.IpDataApiKey, "ipdata-apikey", c.IpDataApiKey,
        "API key for ipdata.co geolocation service (env: IPDATA_API_KEY)")
    flag.UintVar(&c.IpDataFIFOLen, "ipdata-fifo-len", c.IpDataFIFOLen,
        "Max number of cached IP data entries (env: IPDATA_FIFO_LEN)")
    flag.UintVar(&c.MaxHTTP2PriorityFrames, "max-h2-priority-frames", c.MaxHTTP2PriorityFrames,
        "Max number of HTTP2 priority frames (env: MAX_H2_PRIORITY_FRAMES)")
    flag.BoolVar(&c.EnableKubernetesProbe, "enable-kubernetes-probe", c.EnableKubernetesProbe,
        "Enable kubernetes liveness/readiness probe support (env: ENABLE_KUBERNETES_PROBE)")
    flag.StringVar(&c.MetricsListenAddr, "metrics-listen-addr", c.MetricsListenAddr,
        "Listening address of Prometheus metrics (env: METRICS_LISTEN_ADDR)")
    flag.BoolVar(&c.VerboseLogs, "verbose", c.VerboseLogs,
        "Enable verbose logs (env: VERBOSE)")
}

func parseFlags() {
	flag.Parse()
}

func parseDuration(s string, name string) time.Duration {
    dur, err := time.ParseDuration(s)
    if err != nil {
        KeenEyeServerLog.Fatalf("invalid %s %q: %s", name, s, err)
    }
    return dur
}

func parseDurationMetricBuckets(durationMetricBuckets string) []float64 {
    bucketStrings := strings.Split(durationMetricBuckets, ",")
    buckets := []float64{}

    for _, bucket := range bucketStrings {
        parsedBucket, err := strconv.ParseFloat(strings.Trim(bucket, " "), 64)
        if err != nil {
            KeenEyeServerLog.Fatalf(`invalid duration metric bucket "%s": %s`, bucket, err)
        }
        buckets = append(buckets, parsedBucket)
    }

    return buckets
}