# Use the official Node.js 16 image from Docker Hub
FROM node:16 AS build

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies with --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Copy the rest of the application files
COPY . .

# Build the Angular application
RUN npm run build --prod

# Use a minimal web server to serve the Angular app
FROM node:16-slim

# Set the working directory
WORKDIR /app

# Copy the build output from the previous stage
COPY --from=build /app/dist /app/dist

# Install a simple HTTP server
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the server to serve the Angular app
CMD ["serve", "-s", "dist/amigo", "-l", "3000"]
