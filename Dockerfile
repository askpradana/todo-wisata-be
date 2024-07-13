# Use Node.js 20.11.1 as the parent image
FROM node:19-bullseye

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
# Use npm ci for more reliable builds, and include build tools for native modules
RUN npm ci --only=production && npm cache clean --force

# Copy app source code
COPY . .

# Expose the port your app runs on
EXPOSE 3030

# Define the command to run your app
CMD ["node", "index.js"]