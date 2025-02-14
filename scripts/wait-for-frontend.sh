#!/bin/bash

timeout=120  # 2 minutes in seconds
interval=5   # Check every 5 seconds
elapsed=0

echo "Waiting for frontend to be ready at http://localhost:8081"

while [ $elapsed -lt $timeout ]; do
  if curl -s --head http://localhost:8081 | grep "200\|304" > /dev/null; then
    echo "Frontend is ready!"
    exit 0
  fi
  
  echo "Frontend not ready yet... waiting $interval seconds"
  sleep $interval
  elapsed=$((elapsed + interval))
done

echo "Frontend failed to respond within $timeout seconds"
exit 1
