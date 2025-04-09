# Base image
FROM node:20-alpine

# Create app directory
WORKDIR /app/backend/services

COPY ./backend/services/package.json ./backend/services/yarn.lock ./

# Install app dependencies
RUN yarn install --frozen-lockfile

# Bundle app source
COPY ./backend/services ./

RUN yarn build

ENV NODE_ENV production

RUN yarn cache clean

# Start the server using the production build
CMD [ "node", "dist/main.js" ]
