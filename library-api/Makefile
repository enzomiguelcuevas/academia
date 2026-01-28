APP_NAME=library-api
MAIN=./cmd/api/main.go

.PHONY: dev build run tidy

dev:
	go run $(MAIN)

run:
	go run $(MAIN)

build:
	go build -o bin/$(APP_NAME) $(MAIN)

tidy:
	go mod tidy
