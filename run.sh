#!/bin/bash

SCREEN_YMD=$1
IS_DEV=${2:-false}

if [ -z "$SCREEN_YMD" ]; then
  echo "사용법: ./run.sh 20260727 [true|false]"
  exit 1
fi

SCREEN_YMD=$SCREEN_YMD \
IS_DEV=$IS_DEV \
docker compose -p cgv-${SCREEN_YMD} up -d