FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy application source code
COPY . .

# Expose application port
EXPOSE 3000

# Container entrypoint command
CMD ["node", "server.js"]
