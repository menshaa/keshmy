# Use the official Node.js 18 image as the base image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install nodemon globally
RUN npm install -g nodemon

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["sh", "-c", "npm run dev"]
