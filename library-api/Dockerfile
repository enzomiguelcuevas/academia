FROM golang:1.25-alpine AS build

WORKDIR /app

RUN apk add --no-cache ca-certificates git

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/api ./cmd/api/main.go

FROM alpine:3.20

WORKDIR /app
RUN apk add --no-cache ca-certificates

COPY --from=build /bin/api /app/api

EXPOSE 3000

CMD ["/app/api"]
