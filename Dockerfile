# Use a Node.js image as a base
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json (if available)
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of your app's code to the container
COPY . .

# Expose port 5000 for the server (as your server is running on port 5000)
EXPOSE 5000

# Command to start the server
CMD ["node", "server.js"]
