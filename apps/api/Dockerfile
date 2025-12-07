FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

# 루트 설정 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 모노레포 소스 복사
COPY apps ./apps
COPY packages ./packages

# 의존성 설치
RUN pnpm install --frozen-lockfile

# shared 패키지 빌드
RUN pnpm --filter "@chart/shared-types" build

# api 빌드
RUN pnpm --filter api build

# 런타임 이미지
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 8000
CMD ["node", "dist/main.js"]