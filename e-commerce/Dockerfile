FROM node:22

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["npx", "nodemon", "app.js"]
