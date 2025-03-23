# Build stage
FROM --platform=$BUILDPLATFORM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM --platform=$TARGETPLATFORM node:20-alpine

WORKDIR /app

# Copy built assets from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Install production dependencies and vite globally
RUN npm ci --production && npm install -g vite

# Expose port
EXPOSE 8081

# Start the application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8081"] 