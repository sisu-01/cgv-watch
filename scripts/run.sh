#!/bin/bash

SCREEN_YMD=$1
SERVICE=${2:-}
CLIENT_NUMBER=${3:-1}
IS_DEV=${4:-false}

if [ -z "$SCREEN_YMD" ]; then
  echo "사용법: ./run.sh [server|publisher|subscriber] YYYYMMDD [true|false]"
  exit 1
fi

if [ -z "$SERVICE" ]; then
  SCREEN_YMD="$SCREEN_YMD" \
  IS_DEV="$IS_DEV" \
    docker compose -p cgv-${SCREEN_YMD} up -d cgv-watch
else
  SCREEN_YMD=$SCREEN_YMD IS_DEV=$IS_DEV \
  CLIENT_NUMBER="$CLIENT_NUMBER" \
    docker compose -p cgv-${SCREEN_YMD} up -d "$SERVICE"
fi