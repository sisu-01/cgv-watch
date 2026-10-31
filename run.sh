#!/bin/bash

SERVICE=${1:-}
SCREEN_YMD=$2
IS_DEV=${3:-false}

if [ -z "$SCREEN_YMD" ]; then
  echo "사용법: ./run.sh [server|publisher|subscriber] YYYYMMDD [true|false]"
  exit 1
fi

if [ -z "$SERVICE" ]; then
  SCREEN_YMD=$SCREEN_YMD IS_DEV=$IS_DEV \
    docker compose -p cgv-${SCREEN_YMD} up -d
else
  SCREEN_YMD=$SCREEN_YMD IS_DEV=$IS_DEV \
    docker compose -p cgv-${SCREEN_YMD} up -d "$SERVICE"
fi