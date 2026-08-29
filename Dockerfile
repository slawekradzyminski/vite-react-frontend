# Build stage
FROM --platform=$BUILDPLATFORM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS build

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
FROM nginx:1.31.4-trixie@sha256:0d4374c710a9649200e84f8ef8dbdd4fa76c0c107839cd50f1e42a63916b0f2e

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public /usr/share/nginx/html
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} + \
  && find /usr/share/nginx/html -type f -exec chmod 644 {} +

EXPOSE 80
