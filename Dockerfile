FROM node:22-slim
# Install build dependencies for uWebSockets.js and git
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
USER node
RUN npm cache clean --force
RUN npm install --legacy-peer-deps
COPY --chown=node:node . .
EXPOSE 1234
CMD [ "npm", "start" ]
