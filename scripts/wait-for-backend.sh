#!/bin/bash

timeout=120  # 2 minutes in seconds
interval=5   # Check every 5 seconds
elapsed=0

echo "Waiting for backend to be ready at http://localhost:4001/v3/api-docs"

while [ $elapsed -lt $timeout ]; do
  if curl -s --head http://localhost:4001/v3/api-docs | grep "200" > /dev/null; then
    echo "Backend is ready!"
    exit 0
  fi
  
  echo "Backend not ready yet... waiting $interval seconds"
  sleep $interval
  elapsed=$((elapsed + interval))
done

echo "Backend failed to respond within $timeout seconds"
exit 1 