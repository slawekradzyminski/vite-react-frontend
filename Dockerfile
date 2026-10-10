# Build stage
FROM --platform=$BUILDPLATFORM node:24.21.0-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# The model remains user-editable in the UI. This controls only the initial
# value baked into the static frontend bundle.
ARG VITE_DEFAULT_OLLAMA_MODEL=hf.co/prism-ml/Bonsai-27B-gguf:Q1_0
ENV VITE_DEFAULT_OLLAMA_MODEL=${VITE_DEFAULT_OLLAMA_MODEL}

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.31.6-trixie@sha256:60f0d4e986561e08804f75c211dcaf7fc5455699eada29f42cbe8a0a7253dd86

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public /usr/share/nginx/html
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} + \
  && find /usr/share/nginx/html -type f -exec chmod 644 {} +

EXPOSE 80
