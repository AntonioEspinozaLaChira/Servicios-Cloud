FROM node:20-slim
WORKDIR /usr/src/app
COPY backend-functions/package*.json ./
RUN npm install --omit=dev
COPY backend-functions/src/ ./src/
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/app.js"]

