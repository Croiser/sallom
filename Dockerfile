FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN npx prisma generate
RUN pnpm run build

FROM base AS runner
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist /usr/src/app/dist
COPY --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=build /usr/src/app/package.json /usr/src/app/package.json
COPY --from=build /usr/src/app/server.ts /usr/src/app/server.ts
COPY --from=build /usr/src/app/server /usr/src/app/server
COPY --from=build /usr/src/app/prisma /usr/src/app/prisma

EXPOSE 3000
CMD [ "node", "server.ts" ]
