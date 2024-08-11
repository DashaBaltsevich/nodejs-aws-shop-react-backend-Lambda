FROM node:20-alpine as setup
WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

FROM setup as build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:20-alpine as production
WORKDIR /app
ENV NODE_ENV production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist

USER node

EXPOSE 4000

CMD [ "node", "dist/main.js" ]
