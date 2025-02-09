FROM node:20.12.2

ARG SERVER_PORT
ARG DB_NAME
ARG DB_USER
ARG DB_PASSWORD
ARG DB_HOST
ARG DB_PORT

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY src/backend/. tsconfig.json ./
# COPY .env .env

RUN pnpm install --force
# RUN pnpm tsc:check
# RUN pnpm env:check

CMD ["pnpm", "start"]