FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 10001 app && adduser -D -u 10001 -G app app

COPY --from=build --chown=app:app /app ./

USER app
EXPOSE 3000

CMD ["npm", "start"]
