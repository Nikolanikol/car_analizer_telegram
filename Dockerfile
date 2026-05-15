FROM node:20-alpine

ARG COMMIT_SHA=unknown
ENV COMMIT_SHA=$COMMIT_SHA

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY . .
RUN npm run build

RUN npm prune --production

CMD ["npm", "start"]
