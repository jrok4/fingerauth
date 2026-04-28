.PHONY: all frontend backend dev-api dev-ui clean

all: backend

frontend:
	cd frontend && npm ci && npm run build

backend: frontend
	go build -o fingerauth ./cmd/server

release:
	CGO_ENABLED=0 go build -ldflags="-s -w" -trimpath -o fingerauth ./cmd/server

dev-api:
	go run ./cmd/server

dev-ui:
	cd frontend && npm run dev

clean:
	rm -f fingerauth
	rm -rf frontend/build