#!/bin/bash

DAY=$1

if [ -z "$DAY" ]; then
  echo "사용법: ./run.sh 0727"
  exit 1
fi

DAY=$DAY docker compose -p cgv-${DAY} up -d