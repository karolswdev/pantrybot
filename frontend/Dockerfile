# Multi-stage Dockerfile for Next.js Frontend

# Stage 1: Dependencies
# This stage installs all npm dependencies for the application
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install dependencies using npm ci for faster, more reliable builds
RUN npm ci

# Stage 2: Builder
# This stage builds the Next.js application for production
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from the previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy all application source files
COPY . .

# Set environment variable for production build
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# Stage 3: Runner
# This stage sets up the production server using the built application
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary files for production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change ownership to the nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

# Expose the port Next.js runs on
EXPOSE 3000

# Set the port environment variable
ENV PORT 3000

# Start the production server using the standalone server
CMD ["node", "/app/server.js"]