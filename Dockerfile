FROM golang:1.24 AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo -o app ./

# FROM alpine:latest
# RUN apk --no-cache add ca-certificates

FROM alpine:latest
COPY --from=builder /app ./

ENTRYPOINT ["./app"]