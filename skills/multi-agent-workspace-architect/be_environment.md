# BE Environment Notes

File này ghi lại môi trường chạy cần thiết cho backend MVP multi-agent workspace để dùng lại ở các lần dựng máy sau.

## 1. Version tối thiểu

1. Node.js `>= 20.11.0`
2. npm `>= 10.0.0`
3. PostgreSQL `>= 16`
4. Redis `>= 7`
5. Docker Compose nếu muốn dựng nhanh infra local

## 2. Ghi chú từ workspace hiện tại

1. Máy hiện tại trong phiên làm việc này đang là `Node v15.14.0`.
2. Version đó không đủ cho NestJS + Prisma + SDK `openai` hiện tại.
3. Vì vậy code đã được viết theo baseline Node 20 và cần nâng Node trước khi chạy `npm install`.

## 3. Biến môi trường cần có

Tạo file `backend/.env` từ `backend/.env.example` với các biến sau:

```env
APP_PORT=3001
APP_HOST=0.0.0.0
APP_BASE_URL=http://localhost:3001
APP_DEFAULT_USER_ID=demo-user
APP_SSE_HEARTBEAT_MS=15000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/multi_agent_workspace?schema=public
REDIS_URL=redis://localhost:6379

LLM_PROVIDER=openrouter
LLM_API_KEY=<your-openrouter-api-key>
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=nvidia/nemotron-3-super-120b-a12b:free
LLM_TIMEOUT_MS=45000
LLM_MAX_RETRIES=1
LLM_APP_URL=http://localhost:3000
LLM_APP_NAME=Multi Agent Workspace

# Legacy fallback nếu còn cần boot với OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENAI_TIMEOUT_MS=45000
OPENAI_MAX_RETRIES=1

# Alias tương thích nếu bạn copy env từ docs OpenRouter
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free

ORCHESTRATOR_MAX_PARTICIPANTS=3
ORCHESTRATOR_MAX_RECENT_MESSAGES=20
QUEUE_RUN_ATTEMPTS=2
```

## 4. Cách dựng local nhanh

1. Khởi động infra:

```bash
docker compose up -d postgres redis
```

2. Cài và chuẩn bị backend:

```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

3. Chạy dev server:

```bash
npm run start:dev
```

## 5. Những điểm cần nhớ

1. Backend vẫn có thể boot nếu chưa có `LLM_API_KEY` hoặc `OPENAI_API_KEY`, nhưng mọi run gọi model sẽ fail ở lúc orchestration.
2. Ownership tối thiểu đang dùng header `x-user-id`.
3. SSE cũng chấp nhận query string `?userId=` để frontend dùng được native `EventSource`.
4. Swagger nội bộ nằm ở `http://localhost:3001/docs`.
5. SSE endpoint là `GET /api/topics/:topicId/stream`.
6. Khi `LLM_PROVIDER=openrouter`, topic cũ từng lưu `gpt-5` hoặc `nvidia/nemotron-3-super-120b-a12b` sẽ tự fallback sang `LLM_MODEL` ở runtime để không bị fail hoặc vô tình lệch sang bản không phải `:free`.
7. Thứ tự ưu tiên chọn model hiện tại là: `OPENAI_MODEL` -> `NVIDIA_MODEL` -> `OPENROUTER_MODEL` -> `LLM_MODEL` -> model lưu trong topic -> default theo provider.

## 6. Tài liệu provider đã bám theo

1. OpenRouter authentication and SDK usage: `https://openrouter.ai/docs/api/reference/authentication`
2. OpenAI node reference: `https://platform.openai.com/docs/guides/node-reference`
3. NVIDIA model page gốc cho Nemotron 3 Super: `https://build.nvidia.com/nvidia/nemotron-3-super-120b-a12b`

Backend hiện hỗ trợ 2 nhánh:
- OpenAI qua `responses.create`
- OpenRouter hoặc NVIDIA-compatible endpoint qua `chat.completions.create`
