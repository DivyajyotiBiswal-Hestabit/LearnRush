# Use official Node base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining source code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "src/server.js"]