# Base image
FROM node:alpine3.16

# Create app directory
WORKDIR /app/lambda/services

COPY ./lambda/services/package.json ./
COPY ./lambda/services/yarn.lock ./

COPY ./libs ../../libs

# Install app dependencies
RUN yarn run sls:installProd

# Bundle app source
COPY ./lambda/services .

ENV NODE_ENV production
RUN yarn add @nestjs/cli --dev && yarn run build && yarn remove @nestjs/cli && yarn cache clean

# Start the server using the production build
CMD [ "node", "dist/main.js" ]