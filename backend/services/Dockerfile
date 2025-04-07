FROM node:20-alpine AS builder

WORKDIR /app
    
COPY ./backend/services/package.json ./backend/services/yarn.lock ./
    
RUN yarn install --frozen-lockfile
    
COPY ./backend/services .
    
RUN yarn build 
    
FROM node:20-alpine
    
WORKDIR /app
    
COPY --from=builder /app/node_modules ./node_modules
    
COPY --from=builder /app/dist ./dist
    
COPY ./backend/services/package.json .
    
ENV NODE_ENV=production
    
CMD ["node", "dist/main.js"]
    