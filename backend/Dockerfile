FROM golang:1.25.4-alpine3.22 AS build

WORKDIR /app/
COPY . /app/

WORKDIR /app/cmd/server
RUN go build -o /app/diffuzzer .

FROM scratch

COPY --from=build /app/diffuzzer /diffuzzer

CMD ["/diffuzzer"]
