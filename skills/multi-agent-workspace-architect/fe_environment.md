# FE Environment Notes

File này ghi lại môi trường chạy cần thiết cho frontend Next.js của MVP multi-agent workspace.

## 1. Version tối thiểu

1. Node.js `>= 20.11.0`
2. npm `>= 10.0.0`

## 2. Ghi chú từ workspace hiện tại

1. Máy hiện tại trong phiên làm việc này đang là `Node v15.14.0`.
2. Version đó không đủ để cài dependency Next.js hiện tại một cách ổn định.
3. Vì vậy code frontend đã được viết theo baseline Node 20 và cần nâng Node trước khi chạy `npm install`.

## 3. Biến môi trường cần có

Tạo `frontend/.env.local` từ `frontend/.env.example`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_USER_ID=demo-user
```

## 4. Cách dựng local nhanh

1. Dựng backend trước theo `skills/multi-agent-workspace-architect/be_environment.md`.
2. Cài dependency frontend:

```bash
cd frontend
npm install
```

3. Chạy dev server:

```bash
npm run dev
```

## 5. Những điểm cần nhớ

1. REST API gọi backend bằng `x-user-id`.
2. SSE dùng `EventSource`, nên user id được đẩy qua query string `?userId=...`.
3. Nếu bạn đổi `NEXT_PUBLIC_USER_ID`, hãy bảo đảm backend cho phép user đó truy cập cùng tập dữ liệu.
4. Trang health của FE nằm ở `/health` để xác nhận FE gọi được backend thật.
