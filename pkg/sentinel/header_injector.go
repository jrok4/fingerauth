package sentinel

import "net/http"

type HeaderInjector interface {
	GetHeaderName() string

	GetHeaderValue(req *http.Request) (string, error)
}