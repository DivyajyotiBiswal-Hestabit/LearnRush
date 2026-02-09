#!/bin/bash

SERVER="192.168.2.24"
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/health.log"

mkdir -p "$LOG_DIR"

while true; do
  if ! ping -c 1 -W 2 "$SERVER" > /dev/null 2>&1; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ Ping failed for $SERVER" >> "$LOG_FILE"
  fi
  sleep 10
done
