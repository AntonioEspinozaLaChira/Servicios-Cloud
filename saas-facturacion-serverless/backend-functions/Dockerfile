FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src/ ./src/
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/app.js"]

