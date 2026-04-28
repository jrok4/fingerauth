package sentinel


import (
	"net/http"
	"strings"
	"log"
)

const (
	ProbeStatusCode   = http.StatusOK
	ProbeResponse     = "OK"
	BlockedStatusCode = http.StatusMethodNotAllowed
	BlockedResponse   = "Not Allowed"
	FailedStatusCode  = http.StatusInternalServerError
	FailedResponse    = "Internal Server Error"
)

type HTTPHandler struct {
	next http.Handler

	logger *log.Logger

	HeaderInjectors []HeaderInjector
	IsProbeRequest func(*http.Request) bool
	EvaluateRequest func(r *http.Request) (decline bool, reason string, err error)
}

func NewHTTPHandler(next http.Handler, logger *log.Logger, headerInjectors []HeaderInjector) *HTTPHandler {
	return &HTTPHandler{
		next:   next,
		logger: logger,
		HeaderInjectors: headerInjectors,
	}
}

func (f *HTTPHandler) logf(format string, args ...any) {
	if f.logger != nil {
		f.logger.Printf(format, args...)
	}
}

func (f *HTTPHandler) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	if f.IsProbeRequest != nil && f.IsProbeRequest(req) {
		w.WriteHeader(ProbeStatusCode)
		w.Write([]byte(ProbeResponse))
		return
	}

	for _, hj := range f.HeaderInjectors {
		k := hj.GetHeaderName()
		if v, err := hj.GetHeaderValue(req); err != nil {
			f.logf("get header %s value for %s failed: %s", k, req.RemoteAddr, err)
		} else if v != "" {
			req.Header.Set(k, v)
		}
	}

	if f.EvaluateRequest != nil {
		decline, reason, err := f.EvaluateRequest(req)
		if err != nil {
			f.logf("evaluate request from %s failed: %s", req.RemoteAddr, err)
			w.WriteHeader(FailedStatusCode)
			w.Write([]byte(FailedResponse))
			return
		}
		if decline {
			f.logf("blocked %s: %s", req.RemoteAddr, reason)
			w.WriteHeader(BlockedStatusCode)
			w.Write([]byte(BlockedResponse))
			return
		}
	}

	f.next.ServeHTTP(w, req)
}

func IsKubernetesProbeRequest(r *http.Request) bool {
	return strings.HasPrefix(r.UserAgent(), "kube-probe/")
}