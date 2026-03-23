# BE Jobs

Tài liệu này tách riêng đầu việc Backend cho MVP multi agent workspace. Tập trung vào NestJS, PostgreSQL, Redis, BullMQ, SSE, orchestration và tích hợp OpenAI theo đúng contract đã khóa.

## 1. Phạm vi backend phải bám đúng
1. App độc lập.
2. Topic chỉ bắt đầu sau message đầu tiên của Human.
3. Chỉ Lead được hỏi ngược Human.
4. Human là người quyết định dừng hoặc kết luận.
5. Không phải agent nào cũng cần trả lời trong mọi lượt.
6. Một topic chỉ có một run active.
7. Prompt agent bất biến sau khi topic có history.
8. V1 không dùng web search.
9. V1 chỉ dùng tiếng Việt.
10. V1 dùng một model chung cho toàn topic.

## 2. Mục tiêu BE cho MVP
1. Cung cấp API topic, agent, message, run đủ cho FE dùng thật.
2. Lưu được toàn bộ lịch sử hội thoại và trạng thái chạy.
3. Tổ chức orchestration nhiều agent theo một run tuần tự và có kiểm soát.
4. Stream được message agent theo thời gian thực.
5. Dừng đúng khi cần chờ Human hoặc khi user bấm stop.
6. Có log, trạng thái, và trace đủ để debug production sớm.

## 3. Kiến trúc BE đề xuất
1. NestJS theo module.
2. PostgreSQL làm source of truth.
3. Prisma hoặc Drizzle làm ORM.
4. Redis cho queue, lock, pub sub nhẹ nếu cần.
5. BullMQ để chạy job orchestration.
6. SSE để đẩy events xuống FE.
7. OpenAI Responses API qua một gateway service riêng.

## 4. Module bắt buộc
1. Auth hoặc lớp ownership tối thiểu.
2. TopicsModule.
3. AgentsModule.
4. MessagesModule.
5. RunsModule.
6. OrchestratorModule.
7. LlmGatewayModule.
8. StreamModule.
9. Persistence và migration.

## 5. Job breakdown chi tiết

### BE 01. Khởi tạo NestJS và cấu trúc module
**Mục tiêu**
Thiết lập nền backend rõ ràng để phát triển theo module.

**Việc cần làm**
1. Khởi tạo NestJS project.
2. Tạo cấu trúc module theo domain.
3. Cấu hình env loader.
4. Cấu hình logger.
5. Cấu hình validation pipe toàn cục.
6. Cấu hình exception filter chuẩn.
7. Cấu hình health check endpoint.

**Phụ thuộc**
Không có.

**Đầu ra bàn giao**
1. Backend chạy local.
2. Khung module rõ ràng.

**Định nghĩa hoàn thành**
1. Có thể khởi động server dev thành công.
2. Có health check hoạt động.

### BE 02. Thiết kế schema database và migrations
**Mục tiêu**
Khóa lớp dữ liệu cốt lõi cho topic, agent, message, run, run step.

**Việc cần làm**
1. Tạo bảng `topics`.
2. Tạo bảng `topic_agents`.
3. Tạo bảng `messages`.
4. Tạo bảng `runs`.
5. Tạo bảng `run_steps`.
6. Tạo index cho `topic_id`, `run_id`, `status`, `sequence_no`, `sort_order`.
7. Tạo enum cho sender type, run status, message status, agent role.
8. Tạo migration từ đầu.
9. Tạo seed data dev.

**Phụ thuộc**
BE 01.

**Đầu ra bàn giao**
1. Schema vật lý rõ ràng.
2. Migrations chạy được.

**Định nghĩa hoàn thành**
1. Có thể migrate lên DB trống.
2. Có thể rollback migration gần nhất.

### BE 03. Repository layer và truy vấn cơ bản
**Mục tiêu**
Tạo lớp truy cập dữ liệu ổn định cho các service phía trên.

**Việc cần làm**
1. Tạo repository cho topics.
2. Tạo repository cho agents.
3. Tạo repository cho messages.
4. Tạo repository cho runs.
5. Tạo query lấy topic detail kèm agents.
6. Tạo query lấy message timeline theo cursor.
7. Tạo query lấy active run theo topic.

**Phụ thuộc**
BE 02.

**Đầu ra bàn giao**
1. Repository layer có test cơ bản.

**Định nghĩa hoàn thành**
1. Service phía trên có thể gọi repository mà không phải tự viết SQL lặp lại.

### BE 04. API contract và DTO
**Mục tiêu**
Khóa contract dữ liệu trao đổi giữa FE và BE.

**Việc cần làm**
1. Tạo DTO cho create topic.
2. Tạo DTO cho update topic title.
3. Tạo DTO cho add agent, update agent, delete agent, reorder agent.
4. Tạo DTO cho post human message.
5. Tạo DTO cho run detail và cancel run.
6. Chuẩn hóa response envelope nếu cần.
7. Chuẩn hóa error body.
8. Viết swagger nội bộ hoặc tài liệu tương đương.

**Phụ thuộc**
BE 02, BE 03.

**Đầu ra bàn giao**
1. API contract dùng chung.

**Định nghĩa hoàn thành**
1. FE có thể code chính xác từ contract này.

### BE 05. TopicsModule triển khai CRUD lõi
**Mục tiêu**
Cho phép tạo, đọc, sửa title và archive topic.

**Việc cần làm**
1. Viết API tạo topic kèm agents ban đầu.
2. Viết API lấy danh sách topic theo owner.
3. Viết API lấy topic detail.
4. Viết API cập nhật title.
5. Viết API archive topic.
6. Áp ownership check.
7. Áp validation số lượng agent tối thiểu khi tạo topic.

**Phụ thuộc**
BE 04.

**Đầu ra bàn giao**
1. Topics API dùng được bởi FE.

**Định nghĩa hoàn thành**
1. Chỉ owner mới đọc sửa archive topic của mình.
2. Không tạo được topic với dưới 2 agent.

### BE 06. AgentsModule và rule bất biến prompt
**Mục tiêu**
Quản lý agent an toàn trước và sau khi topic có history.

**Việc cần làm**
1. Viết API thêm agent khi topic chưa có history.
2. Viết API sửa agent khi topic chưa có history.
3. Viết API xóa agent khi topic chưa có history.
4. Viết API reorder agent khi topic chưa có history.
5. Tạo rule chặn mọi chỉnh sửa prompt nếu topic đã có message.
6. Tạo thông báo lỗi nghiệp vụ rõ ràng.
7. Kiểm tra không trùng tên agent trong cùng topic.

**Phụ thuộc**
BE 05.

**Đầu ra bàn giao**
1. Agents API đầy đủ cho MVP.

**Định nghĩa hoàn thành**
1. Sau message đầu tiên, update prompt luôn bị chặn.
2. Rule bất biến có unit test.

### BE 07. MessagesModule và sequence timeline
**Mục tiêu**
Lưu timeline tin nhắn đúng thứ tự và phục vụ đọc theo cursor.

**Việc cần làm**
1. Tạo API lấy messages theo topic.
2. Thiết kế cursor hoặc pagination.
3. Tạo logic cấp `sequence_no` trong topic.
4. Tạo logic persist human message.
5. Tạo logic persist agent message.
6. Tạo logic persist system event.
7. Tạo field status cho pending, streaming, completed, failed.

**Phụ thuộc**
BE 03, BE 04.

**Đầu ra bàn giao**
1. Timeline backend hoàn chỉnh.

**Định nghĩa hoàn thành**
1. FE đọc timeline đúng thứ tự ổn định.

### BE 08. RunsModule và vòng đời run
**Mục tiêu**
Quản lý đúng lifecycle của một run trong topic.

**Việc cần làm**
1. Tạo bảng và entity run hoàn chỉnh.
2. Tạo API đọc run detail.
3. Tạo API cancel run.
4. Tạo service tạo run từ human message.
5. Đảm bảo một topic chỉ có một active run.
6. Tạo lock hoặc transaction chặn race condition.
7. Tạo trạng thái `queued`, `running`, `waiting_human`, `completed`, `failed`, `cancelled`.

**Phụ thuộc**
BE 07.

**Đầu ra bàn giao**
1. Run lifecycle ổn định.

**Định nghĩa hoàn thành**
1. Không có trường hợp hai run active cùng topic.

### BE 09. Tạo hàng đợi BullMQ và worker orchestration
**Mục tiêu**
Tách orchestration khỏi request HTTP.

**Việc cần làm**
1. Tạo queue cho run processing.
2. Tạo worker xử lý run.
3. Đẩy job vào queue sau khi human message được lưu.
4. Đảm bảo idempotent khi client gửi lặp do retry.
5. Log run id, topic id, trigger message id trong job.
6. Xử lý retry cho lỗi tạm thời.
7. Tạo dead letter handling cơ bản hoặc status fail rõ ràng.

**Phụ thuộc**
BE 08.

**Đầu ra bàn giao**
1. Run được xử lý qua queue.

**Định nghĩa hoàn thành**
1. Request gửi message trả nhanh và không phải chờ agent nói xong.

### BE 10. Orchestrator bước chọn participants
**Mục tiêu**
Quyết định agent nào tham gia ở mỗi lượt mà không gọi tất cả mọi agent.

**Việc cần làm**
1. Tạo hàm chọn participants dựa trên latest human message.
2. Ưu tiên agent được tag trực tiếp trong nội dung user.
3. Ưu tiên assistant hoặc researcher mở đầu khi user cần khai triển.
4. Ưu tiên lead khi user hỏi tổng hợp hoặc chốt hướng.
5. Giới hạn số agent tối đa trong một run ở V1.
6. Trả ra danh sách agent cùng nhiệm vụ ngắn cho từng step.

**Phụ thuộc**
BE 09.

**Đầu ra bàn giao**
1. Participant selection logic.

**Định nghĩa hoàn thành**
1. Không còn kiểu mọi agent luôn nói ở mọi lượt.

### BE 11. Orchestrator bước build context cho từng agent
**Mục tiêu**
Chuẩn hóa context gửi vào model để agent có vai trò rõ ràng và không lặp vô nghĩa.

**Việc cần làm**
1. Tạo platform prompt rules.
2. Tạo topic contract context.
3. Tạo persona prompt theo agent.
4. Tạo recent history window.
5. Tạo current turn brief.
6. Tạo rule chỉ Lead được hỏi ngược Human.
7. Tạo rule Human là người kết luận cuối.
8. Tạo rule không cho agent giả vờ có web search.

**Phụ thuộc**
BE 10.

**Đầu ra bàn giao**
1. Prompt builder có test snapshot.

**Định nghĩa hoàn thành**
1. Có thể xem prompt snapshot từng step để debug.

### BE 12. LlmGateway tích hợp OpenAI Responses API
**Mục tiêu**
Tạo lớp gọi OpenAI tách biệt với orchestration để dễ thay đổi sau này.

**Việc cần làm**
1. Tạo service gọi Responses API.
2. Cấu hình model dùng chung theo topic.
3. Cấu hình timeout.
4. Cấu hình retry cho lỗi tạm thời.
5. Log request id, latency, token usage.
6. Chuẩn hóa dữ liệu trả về cho orchestrator.
7. Hỗ trợ streaming response.
8. Tạo hàm parse structured output nội bộ nếu áp dụng.

**Phụ thuộc**
BE 11.

**Đầu ra bàn giao**
1. Gateway gọi model ổn định.

**Định nghĩa hoàn thành**
1. Orchestrator không gọi API OpenAI trực tiếp.

### BE 13. Thực thi step agent và lưu `run_steps`
**Mục tiêu**
Mỗi phát biểu của agent phải có trace riêng để debug và đo chi phí.

**Việc cần làm**
1. Tạo record `run_step` trước khi gọi model.
2. Lưu prompt snapshot.
3. Cập nhật status step khi đang chạy.
4. Lưu output snapshot khi xong.
5. Lưu input tokens, output tokens, latency.
6. Gắn message id được tạo từ step.
7. Lưu stop reason nếu step thất bại.

**Phụ thuộc**
BE 12.

**Đầu ra bàn giao**
1. Trace step đầy đủ.

**Định nghĩa hoàn thành**
1. Có thể mở DB để debug run từng bước.

### BE 14. SSE stream events xuống frontend
**Mục tiêu**
Cho FE nhận từng bước chạy theo thời gian thực.

**Việc cần làm**
1. Tạo endpoint SSE theo topic hoặc user.
2. Chuẩn hóa event names.
3. Phát event `run.started`.
4. Phát event `agent.started`.
5. Phát event `agent.delta`.
6. Phát event `agent.completed`.
7. Phát event `run.waiting_human`.
8. Phát event `run.completed`.
9. Phát event `run.failed`.
10. Phát event `run.cancelled`.
11. Gắn trace data tối thiểu cần cho FE render.

**Phụ thuộc**
BE 13.

**Đầu ra bàn giao**
1. SSE contract hoạt động.

**Định nghĩa hoàn thành**
1. FE nhận được stream ổn định trong run bình thường.

### BE 15. Logic waiting human khi Lead hỏi ngược
**Mục tiêu**
Dừng đúng chỗ khi cần Human bổ sung thông tin.

**Việc cần làm**
1. Phân tích output của Lead để xác định `needs_human_input`.
2. Nếu đúng thì cập nhật run thành `waiting_human`.
3. Persist message của Lead.
4. Phát SSE `run.waiting_human`.
5. Không cho worker tiếp tục thêm step mới sau đó.

**Phụ thuộc**
BE 13, BE 14.

**Đầu ra bàn giao**
1. Flow chờ human hoàn chỉnh.

**Định nghĩa hoàn thành**
1. Run dừng đúng và FE thấy rõ đang chờ Human.

### BE 16. Logic stop run và cancel an toàn
**Mục tiêu**
Cho Human dừng run mà không làm hỏng timeline.

**Việc cần làm**
1. Nhận yêu cầu cancel run.
2. Đánh dấu run `cancelled`.
3. Cập nhật step hiện tại nếu có thể.
4. Phát event `run.cancelled`.
5. Bảo đảm không tạo thêm message mới sau khi run bị hủy.

**Phụ thuộc**
BE 14.

**Đầu ra bàn giao**
1. Cancel flow hoàn chỉnh.

**Định nghĩa hoàn thành**
1. Không còn ghost messages sau cancel.

### BE 17. Validation nghiệp vụ toàn hệ thống
**Mục tiêu**
Khóa toàn bộ business rule tại backend, không chỉ tin vào FE.

**Việc cần làm**
1. Chặn gửi message nếu topic đang có active run và policy không cho song song.
2. Chặn sửa agent khi topic có history.
3. Chặn tạo topic dưới 2 agents.
4. Chặn run mới khi topic archived.
5. Chặn agent role không hợp lệ.
6. Chặn prompt rỗng.
7. Chặn tên agent trùng lặp.

**Phụ thuộc**
BE 05 đến BE 16.

**Đầu ra bàn giao**
1. Bộ rule được enforce ở backend.

**Định nghĩa hoàn thành**
1. Không thể phá rule chỉ bằng cách bypass FE.

### BE 18. Logging, metrics và observability tối thiểu
**Mục tiêu**
Có khả năng debug sự cố ngay trong giai đoạn MVP.

**Việc cần làm**
1. Log request id.
2. Log topic id, run id, step id.
3. Log thời gian xử lý từng step.
4. Log token usage tổng theo run.
5. Log error code của OpenAI hoặc network.
6. Tạo metric đơn giản cho số run thành công, fail, waiting human, cancel.

**Phụ thuộc**
BE 12 đến BE 17.

**Đầu ra bàn giao**
1. Log đủ để support môi trường dev và staging.

**Định nghĩa hoàn thành**
1. Khi lỗi xảy ra có thể truy ngược run và step liên quan.

### BE 19. Test backend theo lớp
**Mục tiêu**
Đảm bảo backend ổn định trước khi QA nhận.

**Việc cần làm**
1. Unit test cho validation rule.
2. Unit test cho participant selection.
3. Unit test cho prompt builder.
4. Integration test cho create topic.
5. Integration test cho send message và tạo run.
6. Integration test cho waiting human.
7. Integration test cho cancel run.
8. Test migration trên DB trống.

**Phụ thuộc**
Toàn bộ job BE trước đó.

**Đầu ra bàn giao**
1. Bộ test cốt lõi.

**Định nghĩa hoàn thành**
1. Các flow chính đều có test bảo vệ.

### BE 20. Hardening trước UAT
**Mục tiêu**
Đóng các khoảng hở quan trọng trước khi cho QA và business test.

**Việc cần làm**
1. Review race condition tạo run.
2. Review retry duplication khi FE gửi lại request.
3. Review sequence number trong stream.
4. Review memory growth khi timeline dài.
5. Review timeout và fail safe khi model chậm.
6. Review error messages trả về FE.

**Phụ thuộc**
BE 19.

**Đầu ra bàn giao**
1. Backend đủ tin cậy để UAT.

**Định nghĩa hoàn thành**
1. Không còn issue blocker mức nền tảng.

## 6. Thứ tự thực hiện khuyến nghị cho BE
1. BE 01
2. BE 02
3. BE 03
4. BE 04
5. BE 05
6. BE 06
7. BE 07
8. BE 08
9. BE 09
10. BE 10
11. BE 11
12. BE 12
13. BE 13
14. BE 14
15. BE 15
16. BE 16
17. BE 17
18. BE 18
19. BE 19
20. BE 20

## 7. Các tiêu chí nghiệm thu BE cho MVP
1. Tạo topic với tối thiểu 2 agent thành công.
2. Prompt agent không sửa được sau khi topic có history.
3. Gửi human message tạo run mới đúng logic.
4. Một topic không bao giờ có hai run active.
5. Orchestrator chỉ chọn một tập con agent phù hợp cho mỗi lượt.
6. Chỉ Lead được hỏi ngược Human.
7. Khi Lead hỏi Human, run chuyển `waiting_human`.
8. SSE stream ra đầy đủ event để FE render.
9. Cancel run hoạt động và không sinh thêm message rác.
10. Có trace từng step để debug.
