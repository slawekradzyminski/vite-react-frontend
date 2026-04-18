#!/bin/bash

set -e

echo "Waiting for Keycloak to be ready at http://localhost:8082/realms/awesome-testing/.well-known/openid-configuration"

for i in {1..60}; do
  if curl -fsS http://localhost:8082/realms/awesome-testing/.well-known/openid-configuration > /dev/null; then
    echo "Keycloak is ready"
    exit 0
  fi

  echo "Keycloak not ready yet... attempt $i/60"
  sleep 2
done

echo "Keycloak failed to become ready"
docker compose logs keycloak
exit 1
