# Multi-stage build for optimal image size

# Frontend build stage
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend (outputs to ../src/main/resources/static/dist)
RUN npm run build

# Backend build stage - use full JDK and Gradle to compile the application
FROM gradle:8-jdk21 AS backend-build
WORKDIR /app

# Copy source code
COPY . .

# Copy built frontend from previous stage
COPY --from=frontend-build /app/src/main/resources/static/dist ./src/main/resources/static/dist

# Build the fat JAR (includes all dependencies and frontend files)
RUN gradle buildFatJar --no-daemon

# Runtime stage - use Debian-based JRE (better SSL/TLS support)
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built JAR from build stage
COPY --from=backend-build /app/build/libs/*-all.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
