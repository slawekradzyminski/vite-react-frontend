# Build stage
FROM --platform=$BUILDPLATFORM node:25.9.0-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS build

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
FROM nginx:1.31.3-trixie@sha256:8541484afbc9c8a5a8a99b379568ebbc957f658583ec9448fc43104229c03cf8

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public /usr/share/nginx/html
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} + \
  && find /usr/share/nginx/html -type f -exec chmod 644 {} +

EXPOSE 80
