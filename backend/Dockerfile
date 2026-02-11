FROM golang:1.25.4-alpine3.22 AS build

WORKDIR /app/
COPY . /app/

WORKDIR /app/cmd/server
RUN go build -o /app/diffuzzer .

WORKDIR /app
RUN go install github.com/swaggo/swag/cmd/swag@latest && \
    export PATH=$(go env GOPATH)/bin:$PATH && \
    swag init -g cmd/server/Main.go -o /app/docs --parseDependency --parseInternal

FROM scratch

COPY --from=build /app/diffuzzer /diffuzzer
COPY --from=build /app/docs /docs

CMD ["/diffuzzer"]
