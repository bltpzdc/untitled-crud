#!/bin/bash
sudo docker compose up -d
go test ./... -count=1
sudo docker compose down
