# 1. Use Node.js base image
FROM node:22-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm ci

# 5. Copy application source code
COPY . .

# 6. Expose application port
EXPOSE 3000

# 7. Start the application
CMD ["npm", "start"]