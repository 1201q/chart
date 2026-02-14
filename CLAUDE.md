# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack cryptocurrency trading platform (Korean market, KRW-based) built as a **PNPM monorepo with Turborepo**. Connects to Upbit exchange for real-time market data and provides simulated order matching against live orderbooks.

## Monorepo Structure

```
apps/web/       → Next.js 16 frontend (React 19, App Router)
apps/api/       → NestJS backend (TypeORM, Oracle DB)
packages/shared-types/  → Shared TypeScript types (@chart/shared-types)
```

Package manager: **pnpm@10.22.0** (enforced). Workspaces defined in `pnpm-workspace.yaml`.

## Common Commands

```bash
# Root-level (via Turborepo)
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all packages (respects dependency graph)
pnpm lint         # Lint all packages
pnpm test         # Run all tests
pnpm dev:mock     # Start web with mock env (.env.test)

# Frontend only
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint

# Backend only
pnpm --filter api dev          # nest start --watch
pnpm --filter api build        # nest build
pnpm --filter api test         # jest
pnpm --filter api test:e2e     # e2e tests
pnpm --filter api lint         # eslint with --fix

# Shared types
pnpm --filter @chart/shared-types build   # tsc
```

## Architecture

### Frontend (`apps/web`)

- **Routing**: Next.js App Router. Key routes: `/login`, `/market/[code]`, `/account/assets`, `/account/orders`
- **State management**: Custom lightweight stores (no Redux/Zustand). Base class `ExternalStoreBase` in `src/utils/stores/_base/` uses subscriber pattern with `requestAnimationFrame` batching. Stores (orders, balances, fills, tickers, orderbook) are distributed via React context providers.
- **Server state**: React Query (`@tanstack/react-query`) for API data fetching
- **Charts**: `@visx` and `lightweight-charts` for candlestick/trading charts
- **Path aliases**: `@/*` maps to `./src/*`; `@chart/shared-types` resolves to `../../packages/shared-types/src`
- **SVG**: Uses `@svgr/webpack` via Turbopack config in `next.config.ts`
- **React Compiler**: Enabled (`reactCompiler: true`)

### Backend (`apps/api`)

- **Framework**: NestJS with modular architecture
- **Database**: Oracle DB via TypeORM (`synchronize: false` — schema managed manually)
- **Core modules**:
  - `auth/` — OAuth2 (Google, Naver) + JWT. 15-min access token (Bearer header), 7-day refresh token (httpOnly cookie stored in Redis). Guards: `JwtGuard`, `RolesGuard`. Decorators: `@Public()`, `@CurrentUser()`
  - `trading/` — Orders, balances, positions, fills, deposits. Contains the **order matching engine** (`matching/`) using Strategy pattern (LimitBuy, LimitSell, MarketBuy, MarketSell). Matching runs in DB transactions with pessimistic locking.
  - `realtime/` — WebSocket (Socket.IO) streams for candles, tickers, trades, orderbook. Has mock data providers.
  - `trading/sse/` — Server-Sent Events for per-user trading updates (fills, orders, balances, positions)
  - `queue/` — BullMQ job queues: `ORDER_MATCHING`, `CMC_TRANSLATE`, `ICON_UPLOAD`, `CANDLE_RECOVERY`, `CANDLE_INIT`. Bull Board admin at `/admin/queues`
  - `upbit/` — Upbit exchange WebSocket integration
  - `cmc/` — CoinMarketCap data + Google Gemini for translation
  - `bucket/` — Oracle Cloud Object Storage
- **API docs**: Swagger at `/api`
- **Entities** (in `trading/entities/`): `TradingUser`, `TradingOrder`, `TradingBalance`, `TradingFill`, `TradingPosition`, `TradingDeposit`

### Shared Types (`packages/shared-types`)

Exports types for Upbit market data (ticker, trade, orderbook, candle), trading SSE events, and shared trading types. Both `web` and `api` depend on this package.

## Code Style

- **Prettier**: single quotes, trailing commas, 90 char width, 2-space indent (`.prettierrc`)
- **ESLint**: Web uses flat config (`eslint.config.mjs`); API uses legacy config (`.eslintrc.js`)
- **Language**: All code in TypeScript. Comments and variable names mix Korean and English — Korean comments are common throughout the codebase.

## Key Patterns

- **Order matching**: Strategy pattern in `trading/matching/strategies/`. Each strategy implements `IOrderExecutionStrategy.execute()`. Matching runs per-market via BullMQ jobs triggered by real-time orderbook updates.
- **Real-time data flow**: Upbit WebSocket → `realtime/` module → Socket.IO → frontend stores. Trading events flow via SSE (`/trading/stream`).
- **Store pattern (frontend)**: Extend `ExternalStoreBase` or `KeyedExternalStoreBase`. Call `this.notify()` after mutations. Components subscribe via `useSyncExternalStore` through custom hooks.
- **Auth flow**: OAuth redirect → callback sets tokens → frontend reads access token from URL query param, refresh token from cookie.
