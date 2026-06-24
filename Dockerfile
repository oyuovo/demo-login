# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN npm ci --workspaces --if-present

COPY tsconfig.base.json .
COPY packages/contracts packages/contracts
COPY apps/api apps/api
COPY apps/web apps/web

RUN npm run build --workspace=packages/contracts
RUN npm run build --workspace=apps/web
RUN npm run build --workspace=apps/api

# Fix contracts package resolution for production (swap src → dist)
RUN node -e "const p=require('./packages/contracts/package.json');p.main='./dist/index.js';p.exports={'.':'./dist/index.js','./*':'./dist/*'};require('fs').writeFileSync('./packages/contracts/package.json',JSON.stringify(p,null,2))"

# Prune dev dependencies for production
RUN npm ci --workspace=apps/api --omit=dev --workspaces --if-present

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/packages/contracts/dist packages/contracts/dist
COPY --from=builder /app/packages/contracts/package.json packages/contracts/
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/package.json apps/api/
COPY --from=builder /app/apps/web/dist apps/web/dist

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
