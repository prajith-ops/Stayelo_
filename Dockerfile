# --- 1. Build Frontend ---
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- 2. Build Backend ---
FROM node:20-alpine AS final
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./

# Copy the built Vite frontend (dist → build)
COPY --from=build /app/dist ./build

# Expose backend port
EXPOSE 4000

# Start server
CMD ["node", "Server.js"]
