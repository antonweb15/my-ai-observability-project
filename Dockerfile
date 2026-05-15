# Stage 1: Build (Builder)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifest files for dependency installation
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Run (Runner)
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variable
ENV NODE_ENV=production

# Copy only production dependency files
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Copy built code from build stage
COPY --from=builder /app/dist ./dist

# Open port
EXPOSE 3000

# Run application
CMD ["node", "dist/main"]
