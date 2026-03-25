FROM node:20-slim AS base
RUN sed -i 's/deb.debian.org/ftp.br.debian.org/g' /etc/apt/sources.list.d/debian.sources || true
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pm2
WORKDIR /usr/src/app

FROM base AS build
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
COPY --from=build /usr/src/app/dist /usr/src/app/dist
COPY --from=build /usr/src/app/dist-server /usr/src/app/dist-server
COPY --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=build /usr/src/app/package.json /usr/src/app/package.json
COPY --from=build /usr/src/app/ecosystem.config.cjs /usr/src/app/ecosystem.config.cjs
COPY --from=build /usr/src/app/prisma /usr/src/app/prisma

EXPOSE 3000
# Comando para iniciar a aplicação com PM2 após sincronizar o banco
CMD ["sh", "-c", "npx prisma db push && npm run start:prod"]
