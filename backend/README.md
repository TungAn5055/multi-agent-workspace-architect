# Multi Agent Workspace Backend

Backend NestJS cho MVP multi-agent workspace theo backlog trong `skills/multi-agent-workspace-architect/be_jobs.md`.

## Yêu cầu môi trường

- Node.js `>= 20.11`
- npm `>= 10`
- PostgreSQL `>= 16`
- Redis `>= 7`

## Chạy local

1. Copy `backend/.env.example` thành `backend/.env`.
   Mặc định sample env đã set `LLM_PROVIDER=openrouter` với model `nvidia/nemotron-3-super-120b-a12b:free`.
2. Khởi động PostgreSQL và Redis:

```bash
docker compose up -d postgres redis
```

3. Cài dependency và generate Prisma client:

```bash
cd backend
npm install
npm run db:generate
```

4. Apply migration và seed:

```bash
npm run db:migrate
npm run db:seed
```

5. Chạy backend:

```bash
npm run start:dev
```

## Endpoint chính

- `GET /api/health`
- `POST /api/topics`
- `GET /api/topics`
- `GET /api/topics/:topicId`
- `POST /api/topics/:topicId/messages`
- `GET /api/topics/:topicId/stream`
- `GET /docs`

## Ownership tối thiểu

Mặc định backend lấy user từ header `x-user-id`. Nếu thiếu header, app rơi về `APP_DEFAULT_USER_ID`.
Riêng SSE cũng chấp nhận `?userId=` để tương thích với native `EventSource` từ frontend.
