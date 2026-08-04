#!/bin/bash

SCREEN_YMD=$1

if [ -z "$SCREEN_YMD" ]; then
  echo "사용법: ./run.sh 20260727"
  exit 1
fi

DAY=$DAY docker compose -p cgv-${SCREEN_YMD} up -d