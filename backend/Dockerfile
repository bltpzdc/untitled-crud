FROM golang:1.25.4-alpine3.22 AS build

WORKDIR /app/
COPY . /app/

WORKDIR /app/cmd/server
RUN go build -o /app/diffuzzer .

RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN export PATH=$(go env GOPATH)/bin:$PATH
RUN cd ../../ && swag init -g cmd/server/Main.go -o /app/docs

FROM scratch

COPY --from=build /app/diffuzzer /diffuzzer
COPY --from=build /app/docs /docs

CMD ["/diffuzzer"]
