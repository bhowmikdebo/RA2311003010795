# Campus Notification Platform

This repository contains a reusable logging middleware, a Stage 1 priority inbox implementation, and a Stage 2 React/Next notification interface.

## Environment

Create environment files from the examples and provide the protected API bearer token:

```bash
cp .env.example .env
cp notification_app_fe/.env.example notification_app_fe/.env.local
```

## Commands

```bash
npm install
npm test
npm run stage1 -- --limit 10
npm run dev
```

The frontend is configured to run on `http://localhost:3000`.

