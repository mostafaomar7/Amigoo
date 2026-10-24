# Use the official Node.js 16 image from Docker Hub
FROM node:22.23.4-bookworm@sha256:63538dfe497cc29dfafdda25ada09b46db68a3f4cc205abf1f5d6bf0913f3384 AS build

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies with --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Copy the rest of the application files
COPY . .

# Build the Angular application
RUN npx ng build --configuration production

# Use a minimal web server to serve the Angular app
FROM node:22.23.4-bookworm-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d

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
