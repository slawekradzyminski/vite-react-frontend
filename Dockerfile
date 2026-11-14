# Build stage
FROM --platform=$BUILDPLATFORM node:24.22.2-alpine@sha256:a34ab6d7f6f4813f4d0c5469d74685604b962fbdbf5793a7bc7b4998ecb867c8 AS build

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

# Warehouse, returns and purchasing screens need warehouse-service. Baked in at build time;
# pass false for a deployment without it. An empty warehouse URL means the API origin.
ARG VITE_WAREHOUSE_ENABLED=true
ENV VITE_WAREHOUSE_ENABLED=${VITE_WAREHOUSE_ENABLED}
ARG VITE_WAREHOUSE_API_BASE_URL=
ENV VITE_WAREHOUSE_API_BASE_URL=${VITE_WAREHOUSE_API_BASE_URL}

# Card payment screens need payment-service. Same rules as the warehouse flags above.
ARG VITE_PAYMENT_ENABLED=true
ENV VITE_PAYMENT_ENABLED=${VITE_PAYMENT_ENABLED}
ARG VITE_PAYMENT_API_BASE_URL=
ENV VITE_PAYMENT_API_BASE_URL=${VITE_PAYMENT_API_BASE_URL}

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.31.8-trixie@sha256:165ddde8751e75a1c907d24ef10d9f6deb08b57e0fe56caf67512486aff76d82

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public /usr/share/nginx/html
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} + \
  && find /usr/share/nginx/html -type f -exec chmod 644 {} +

EXPOSE 80
