# ========== 1) deps: 의존성 설치만 ==========
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm

# 루트 설정 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# api, shared-types의 package.json만 먼저 복사
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json

# api + shared-types에 필요한 의존성만 설치
RUN pnpm install --frozen-lockfile \
  --filter "api" \
  --filter "@chart/shared-types" \
  --config.unsupported-cpu-arch-warning=false

# ========== 2) builder: 빌드 ==========
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

# deps에서 만든 node_modules + workspace symlink 통째로 가져오기
COPY --from=deps /app ./

# 이후에 실제 소스 전체 덮어쓰기
COPY apps ./apps
COPY packages ./packages

# shared-types 빌드
RUN pnpm --filter "@chart/shared-types" build

# api 빌드
RUN pnpm --filter "api" build

# ========== 3) runtime ==========
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# deps에서 세팅한 node_modules + workspace 패키지들 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 8000
CMD ["node", "dist/src/main.js"]

