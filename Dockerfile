FROM node:18-alpine

# Install build dependencies for uWebSockets.js
RUN apk add --no-cache python3 make g++

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
USER node
RUN npm install

COPY --chown=node:node . .

EXPOSE 1234

CMD [ "npm", "start" ]
