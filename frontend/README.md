# Multi Agent Workspace Frontend

Frontend Next.js App Router cho MVP multi-agent workspace.

## Yêu cầu môi trường

- Node.js `>= 20.11`
- npm `>= 10`
- Backend NestJS ở `http://localhost:3001/api` hoặc URL bạn tự cấu hình

## Chạy local

1. Copy `frontend/.env.example` thành `frontend/.env.local`.
2. Cài dependency:

```bash
cd frontend
npm install
```

3. Chạy dev server:

```bash
npm run dev
```

## Route chính

- `/topics`
- `/topics/new`
- `/topics/:topicId`
- `/health`

## Ghi chú

- REST API gửi `x-user-id` từ `NEXT_PUBLIC_USER_ID`.
- SSE dùng `?userId=` trên URL để tương thích với native `EventSource`.
- Workspace hiện đã hỗ trợ list topic, tạo topic, vào workspace, gửi message, stream delta, waiting human, stop run và archive topic.
