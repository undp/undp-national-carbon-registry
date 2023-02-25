# Base image
FROM node:alpine3.16

# Create app directory
WORKDIR /app/lambda/services

COPY ./lambda/services/package.json ./
COPY ./lambda/services/yarn.lock ./

COPY ./libs ../../libs

# Build libraries
RUN yarn run sls:installProd
# Install app dependencies
# RUN yarn install --production --frozen-lockfile

# Bundle app source
COPY ./lambda/services .

# Creates a "dist" folder with the production build
RUN yarn run build
RUN yarn cache clean

ENV NODE_ENV production

# Start the server using the production build
CMD [ "node", "dist/main.js" ]