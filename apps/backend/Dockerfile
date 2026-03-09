FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]
