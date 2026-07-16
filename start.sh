#!/bin/sh

set -e

echo "Starting Xvfb..."

export DISPLAY=:99

Xvfb :99 \
  -screen 0 1280x900x24 \
  -ac \
  +extension RANDR &

XVFB_PID=$!

# X 서버가 뜰 때까지 잠깐 대기
sleep 2

echo "Starting node..."

exec node index.js