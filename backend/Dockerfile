# Backend Dockerfile
FROM node:18-alpine

# Install OpenSSL required by Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev deps for Prisma CLI)
RUN npm ci

# Copy application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start script that runs migrations and starts the app
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
