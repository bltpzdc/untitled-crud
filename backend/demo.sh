#!/bin/bash

# to demonstrate: run this script after running "docker compose up [-d]" in the root of the repository


BASE_URL="http://localhost:1337/backend"
SAMPLE_ZIP="/home/metametamoon/workspace/untitled-crud/backend/data/sample-run-extracted/sample-run-extracted.zip"

if [ ! -f "$SAMPLE_ZIP" ]; then
    echo "file $SAMPLE_ZIP does not exist!"
    exit
fi

echo "--- Step 1: Uploading fuzzer run archive via POST to $BASE_URL/v1/runs ---"
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/runs" \
  -F "file=@$SAMPLE_ZIP")

echo "Server response for upload:"
echo "$UPLOAD_RESPONSE" | jq .

RUN_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.id')
echo "Extracted RunId for subsequent queries: $RUN_ID"

echo "Requesting full run details for ID $RUN_ID"
curl -s "$BASE_URL/runs/metadata/$RUN_ID" | jq .

echo "Search for runs between 2025-08-01 and 2025-10-01"
curl -s "$BASE_URL/runs/search?fromdate=2025-08-01&todate=2025-10-01" | jq .

echo "Executing search for runs in the year 2024 (expecting [])"
curl -s "$BASE_URL/runs/search?fromdate=2024-01-01&todate=2024-12-31" | jq .

echo "Retrieving list of all fuzzer run metadatas"
curl -s "$BASE_URL/runs/metadatas" | jq .
