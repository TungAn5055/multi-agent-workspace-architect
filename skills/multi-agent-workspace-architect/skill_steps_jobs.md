# Skill Steps Jobs

Tài liệu này là file điều hướng backlog tổng cho skill. Thay vì nhồi toàn bộ backlog vào một file duy nhất, backlog đã được tách thành các workstream chi tiết hơn để dễ giao việc, theo dõi phụ thuộc và kiểm soát phạm vi.

## 1. Cách dùng bộ tài liệu này
1. Đọc file này trước để nắm bản đồ công việc tổng.
2. Khi giao việc cho Frontend, dùng `fe_jobs.md`.
3. Khi giao việc cho Backend, dùng `be_jobs.md`.
4. Khi chuẩn bị SIT, UAT hoặc nghiệm thu, dùng `qa_uat_checklist.md`.
5. Khi cần nhắc lại product contract hoặc technical baseline, quay về `references/product-decisions.md` và `references/technical-spec.md`.

## 2. Bộ file đã tách
1. `fe_jobs.md`
   Tách toàn bộ đầu việc Frontend từ khởi tạo nền tảng, Topic Builder, Workspace, Timeline, Composer, SSE, run state, error handling cho tới hardening trước UAT.

2. `be_jobs.md`
   Tách toàn bộ đầu việc Backend từ schema, API, queue, orchestration, OpenAI gateway, SSE events, validation nghiệp vụ, observability và test hardening.

3. `qa_uat_checklist.md`
   Tập hợp checklist kiểm thử từ smoke test, chức năng chính, nghiệp vụ đặc thù multi agent cho tới UAT theo kịch bản business thực tế.

## 3. Gợi ý cách chia sprint

### Sprint 1
1. FE 01 đến FE 07.
2. BE 01 đến BE 08.
3. Mục tiêu là tạo topic, quản lý agent, lưu message nền tảng và chạy được flow message cơ bản chưa cần streaming hoàn chỉnh.

### Sprint 2
1. FE 08 đến FE 13.
2. BE 09 đến BE 16.
3. Mục tiêu là hoàn thiện workspace, orchestration, streaming, waiting human và stop run.

### Sprint 3
1. FE 14 đến FE 17.
2. BE 17 đến BE 20.
3. QA 01 đến QA 25.
4. Mục tiêu là khóa business rules, hardening, SIT và UAT.

## 4. Mốc chấp nhận MVP
1. User tạo được topic với tối thiểu 2 agent.
2. Topic không tự chạy nếu chưa có human message.
3. Một topic chỉ có một active run.
4. FE hiển thị được thảo luận nhiều agent qua SSE.
5. Chỉ Lead được hỏi ngược Human.
6. Run chuyển `waiting_human` khi cần Human bổ sung.
7. Prompt agent không sửa được sau khi topic có history.
8. Không có bug blocker trong luồng chính tạo topic và thảo luận.

## 5. Cách dùng để giao việc thực chiến
1. Product hoặc Tech Lead dùng file này để chia milestone.
2. FE Lead dùng `fe_jobs.md` để chia ticket nhỏ hơn theo component hoặc route.
3. BE Lead dùng `be_jobs.md` để chia ticket theo module hoặc service.
4. QA Lead dùng `qa_uat_checklist.md` để chuyển thành test cases có id và priority.

## 6. Lưu ý phạm vi
1. Bộ backlog này chỉ bao phủ MVP đã khóa.
2. Không tự thêm web search, file upload, RAG, multi user collaboration hoặc multi model nếu chưa có quyết định mới.
3. Human vẫn là người quyết định dừng hoặc kết luận. Đây là rule không được làm sai ở bất kỳ workstream nào.
