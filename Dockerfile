FROM pierrezemb/gostatic
COPY . /srv/http/
CMD ["-port","8080","-https-promote", "-enable-logging"]


# Use a lightweight Node image
FROM node:20-slim

# Install dependencies needed for some node modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install ALL dependencies (including devDeps for build)
COPY package*.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# Build the frontend and the server
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the server using tsx (ensure tsx is in your dependencies)
CMD ["npx", "tsx", "server.ts"]