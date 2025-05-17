FROM node:20.12.2

ARG SERVER_PORT
ARG DB_NAME
ARG DB_USER
ARG DB_PASSWORD
ARG DB_HOST
ARG DB_PORT

RUN npm install -g pnpm

WORKDIR /usr/app

COPY . .

RUN pnpm install --force
# RUN pnpm run db:push
# RUN pnpm run db:seed
# RUN pnpm tsc:check
# RUN pnpm env:check

CMD ["pnpm", "start"]