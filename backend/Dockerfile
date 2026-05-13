
# This tells Docker to install an OS (alpine) with Node installed
FROM node:alpine

# This will add everything from the current folder to the docker container.
ADD . .

# This installs all app dependencies in the container
RUN npm install

# creates a command that runs the image and starts our app
CMD ["npm", "start"]
