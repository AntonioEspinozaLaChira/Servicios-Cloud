FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/app.js"]
