#!/bin/bash

set -e

docker compose down || { echo "Failed to bring down docker compose"; exit 1; }
docker compose up -d --build || { echo "Failed to start docker compose"; exit 1; }
cd data_processing/ || { echo "Failed to change directory"; exit 1; }
./populate_db.sh || { echo "Failed to run populate_db.sh"; exit 1; }