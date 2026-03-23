# FE Jobs

Tài liệu này tách riêng toàn bộ đầu việc Frontend cho MVP multi agent workspace. Mục tiêu là để team FE có thể nhận việc, chia sprint, ước lượng và bám sát contract sản phẩm mà không cần đọc lại toàn bộ technical spec mỗi lần.

## 1. Phạm vi FE phải bám đúng
1. Đây là app độc lập.
2. V1 chỉ hỗ trợ tiếng Việt.
3. Topic chỉ chạy sau khi human gửi message đầu tiên.
4. Prompt agent không được sửa sau khi topic đã có lịch sử chat.
5. Mỗi topic chỉ có một run active tại một thời điểm.
6. Chỉ Lead được quyền hỏi ngược Human.
7. Không phải agent nào cũng trả lời ở mọi lượt.
8. V1 không có web search.
9. V1 dùng một model chung cho toàn topic.
10. Human là người quyết định dừng hoặc kết luận.

## 2. Mục tiêu FE cho MVP
1. Tạo được topic mới với tối thiểu 2 agent.
2. Hiển thị workspace chat giống tinh thần hai ảnh mẫu.
3. Gửi được message đầu tiên để khởi động topic.
4. Hiển thị luồng thảo luận nhiều agent theo thời gian thực.
5. Xử lý rõ trạng thái run đang chạy, chờ human, hoàn tất, lỗi.
6. Chặn đúng các thao tác không hợp lệ theo business rules.

## 3. Kiến trúc FE đề xuất
1. Framework: Next.js App Router.
2. UI: Tailwind.
3. Server state: TanStack Query.
4. Local state cho chat và streaming: Zustand.
5. Form: React Hook Form kết hợp Zod.
6. Markdown renderer: react markdown kèm sanitization.
7. SSE client: EventSource hoặc wrapper tự viết.

## 4. Danh sách màn hình FE bắt buộc
1. Trang danh sách topic.
2. Trang hoặc modal tạo topic.
3. Trang workspace thảo luận.
4. Trang lỗi hoặc trạng thái rỗng cơ bản.

## 5. Job breakdown chi tiết

### FE 01. Khởi tạo dự án FE và convention nền tảng
**Mục tiêu**
Thiết lập bộ khung FE ổn định để các module phía sau phát triển đồng nhất.

**Việc cần làm**
1. Khởi tạo Next.js với TypeScript.
2. Cấu hình thư mục `app`, `components`, `features`, `lib`, `stores`, `types`, `hooks`.
3. Cấu hình Tailwind.
4. Cấu hình ESLint, Prettier, import alias.
5. Cấu hình biến môi trường cho API base URL.
6. Tạo layout gốc, font, theme màu tối gần với ảnh mẫu.
7. Tạo helper gọi API.
8. Tạo convention xử lý lỗi API thống nhất.

**Phụ thuộc**
Không có.

**Đầu ra bàn giao**
1. FE chạy local.
2. Có skeleton layout cơ bản.
3. Có helper fetch client dùng chung.

**Định nghĩa hoàn thành**
1. Có thể chạy FE bằng một lệnh rõ ràng.
2. Có ít nhất một trang health test gọi được API backend.
3. Team khác clone về chạy được mà không phải sửa code nền.

### FE 02. Xây dựng design tokens và component nền
**Mục tiêu**
Có bộ component dùng lại để đẩy nhanh tốc độ làm form và chat.

**Việc cần làm**
1. Tạo typography scale.
2. Tạo màu nền, màu text, màu border, màu trạng thái.
3. Tạo `Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, `Modal`, `EmptyState`, `Spinner`, `Toast`.
4. Tạo avatar tròn cho human và agent.
5. Tạo component trạng thái run như `Queued`, `Running`, `WaitingHuman`, `Completed`, `Failed`.
6. Tạo component divider và panel.
7. Tạo component confirm action cho archive hoặc stop run.

**Phụ thuộc**
FE 01.

**Đầu ra bàn giao**
1. Thư viện component nội bộ.
2. Trang demo component cơ bản.

**Định nghĩa hoàn thành**
1. Component có thể dùng lại ở Topic Builder và Workspace.
2. Không phải viết UI thô lặp lại ở nhiều nơi.

### FE 03. Định nghĩa type và contract client
**Mục tiêu**
Khóa type FE theo API contract để tránh mismatch giữa FE và BE.

**Việc cần làm**
1. Tạo type cho `TopicSummary`, `TopicDetail`, `TopicAgent`, `MessageItem`, `RunDetail`, `RunEvent`.
2. Tạo type cho payload tạo topic.
3. Tạo type cho payload cập nhật title.
4. Tạo type cho payload tạo agent, sửa agent, reorder agent.
5. Tạo type cho payload gửi message.
6. Tạo parser lỗi API.
7. Tạo file constants cho enum status và role.

**Phụ thuộc**
FE 01, contract API từ backend.

**Đầu ra bàn giao**
1. Bộ type dùng chung toàn app.
2. API client có typing rõ ràng.

**Định nghĩa hoàn thành**
1. Không còn type `any` ở flow chính.
2. FE có thể mock data theo type thống nhất.

### FE 04. Trang danh sách topic
**Mục tiêu**
Cho người dùng thấy các topic đã tạo và vào lại topic cũ.

**Việc cần làm**
1. Tạo layout trang danh sách topic.
2. Gọi API lấy danh sách topic.
3. Hiển thị title, số agent, trạng thái, thời điểm cập nhật gần nhất.
4. Cho phép bấm vào topic để đi tới workspace.
5. Thêm nút tạo topic mới.
6. Thêm trạng thái loading, empty, error.
7. Thêm archive badge nếu topic đã archive.

**Phụ thuộc**
FE 03 và API topics.

**Đầu ra bàn giao**
1. Trang topic list hoạt động.
2. Điều hướng giữa list và detail.

**Định nghĩa hoàn thành**
1. Trang hoạt động với dữ liệu thật.
2. Trường hợp không có topic hiển thị đúng empty state.

### FE 05. Topic Builder phần meta topic
**Mục tiêu**
Tạo phần nhập title và thông tin topic.

**Việc cần làm**
1. Tạo form title.
2. Thêm mô tả ngắn về cách dùng topic.
3. Validate title tối thiểu và tối đa ký tự.
4. Hiển thị lỗi inline.
5. Khóa nút submit khi form chưa hợp lệ.

**Phụ thuộc**
FE 02, FE 03.

**Đầu ra bàn giao**
1. Form title hoàn chỉnh.

**Định nghĩa hoàn thành**
1. Không thể submit nếu title rỗng hoặc quá ngắn.
2. UX nhập liệu rõ ràng.

### FE 06. Topic Builder phần danh sách agent
**Mục tiêu**
Cho phép cấu hình đội agent ngay trong lúc tạo topic.

**Việc cần làm**
1. Tạo list agent card.
2. Mỗi card gồm name, role, description.
3. Thêm agent mới.
4. Xóa agent khi topic chưa tạo.
5. Reorder agent.
6. Validate không trùng tên agent.
7. Validate số lượng tối thiểu 2 agent.
8. Validate description không rỗng.
9. Hiển thị hint về nhiệm vụ mỗi role.
10. Hiển thị cảnh báo khi user cố submit với dữ liệu thiếu.

**Phụ thuộc**
FE 05.

**Đầu ra bàn giao**
1. Form agent builder động.
2. Reorder ổn định.

**Định nghĩa hoàn thành**
1. Có thể tạo topic với 2 đến 5 agent theo rule V1.
2. Không thể submit khi agent vi phạm validation.

### FE 07. Gọi API tạo topic end to end
**Mục tiêu**
Hoàn tất flow tạo topic và chuyển sang workspace.

**Việc cần làm**
1. Gọi API `POST /topics`.
2. Hiển thị loading trong lúc submit.
3. Hiển thị lỗi từ backend.
4. Chuyển route tới workspace khi tạo thành công.
5. Đồng bộ cache topic list sau khi tạo.

**Phụ thuộc**
FE 05, FE 06, API topic create.

**Đầu ra bàn giao**
1. Flow create topic end to end.

**Định nghĩa hoàn thành**
1. User tạo topic thành công bằng dữ liệu thật.
2. Topic mới xuất hiện ở danh sách.

### FE 08. Workspace layout tổng thể
**Mục tiêu**
Dựng trang workspace làm xương sống cho toàn bộ trải nghiệm chat.

**Việc cần làm**
1. Tạo header topic.
2. Tạo vùng timeline chat chính.
3. Tạo composer dưới cùng.
4. Tạo sidebar phải chứa thông tin topic và agent roster.
5. Tạo trạng thái loading khi load topic detail.
6. Tạo error view nếu topic không tồn tại hoặc không có quyền.
7. Tạo responsive tối thiểu cho desktop và laptop.

**Phụ thuộc**
FE 04, FE 07.

**Đầu ra bàn giao**
1. Workspace scaffold hoàn chỉnh.

**Định nghĩa hoàn thành**
1. Có thể vào topic bất kỳ và xem layout hoàn chỉnh.

### FE 09. Timeline message và card hiển thị hội thoại
**Mục tiêu**
Hiển thị luồng đối thoại nhiều agent rõ ràng, dễ đọc.

**Việc cần làm**
1. Tạo `MessageCard` cho human.
2. Tạo `MessageCard` cho agent.
3. Tạo `SystemEventRow` cho event hệ thống.
4. Hiển thị avatar, sender name, timestamp.
5. Render markdown an toàn.
6. Hiển thị mention như `@Human`, `@GS.Minh`.
7. Hiển thị status message đang stream.
8. Xử lý nội dung dài với collapse hoặc expand.
9. Hỗ trợ auto scroll khi đang ở cuối timeline.
10. Giữ vị trí scroll nếu user đang đọc đoạn cũ.

**Phụ thuộc**
FE 08 và API messages.

**Đầu ra bàn giao**
1. Timeline đẹp và ổn định.

**Định nghĩa hoàn thành**
1. Message hiển thị đúng thứ tự.
2. Không nhảy layout khó chịu khi stream.

### FE 10. Composer và gửi human message
**Mục tiêu**
Cho human bắt đầu topic và tiếp tục hội thoại.

**Việc cần làm**
1. Tạo textarea nhập nội dung.
2. Hỗ trợ Enter gửi, Shift Enter xuống dòng.
3. Disable khi run đang active nếu rule không cho gửi song song.
4. Gọi API gửi message.
5. Hiển thị tin nhắn human ngay sau khi gửi.
6. Xử lý lỗi gửi message.
7. Focus lại composer sau các trạng thái phù hợp.
8. Hỗ trợ input có mention agent bằng text thuần ở V1.

**Phụ thuộc**
FE 09 và API send message.

**Đầu ra bàn giao**
1. Gửi được message thật.

**Định nghĩa hoàn thành**
1. Message human xuất hiện ngay và topic được khởi động đúng rule.

### FE 11. Tích hợp SSE và streaming events
**Mục tiêu**
Hiển thị cuộc thảo luận theo thời gian thực.

**Việc cần làm**
1. Tạo hook kết nối SSE theo topic.
2. Lắng nghe event run started.
3. Lắng nghe event agent started.
4. Lắng nghe event delta nội dung.
5. Lắng nghe event agent completed.
6. Lắng nghe event waiting human.
7. Lắng nghe event run completed và run failed.
8. Tạo reducer cập nhật message stream.
9. Hỗ trợ reconnect cơ bản khi mất kết nối ngắn.
10. Tránh render lặp gây lag.

**Phụ thuộc**
FE 09, FE 10, contract SSE backend.

**Đầu ra bàn giao**
1. Streaming ổn định.
2. Timeline cập nhật theo thời gian thực.

**Định nghĩa hoàn thành**
1. Agent có thể gõ dần trên UI.
2. Khi run xong, message được chốt hoàn chỉnh.

### FE 12. Run status bar và stop run
**Mục tiêu**
Cho user hiểu hệ thống đang ở trạng thái nào và có thể dừng đúng lúc.

**Việc cần làm**
1. Tạo thanh trạng thái run.
2. Hiển thị `Queued`, `Running`, `WaitingHuman`, `Completed`, `Failed`.
3. Hiển thị agent đang phát biểu.
4. Tạo nút stop run.
5. Gọi API cancel run.
6. Cập nhật UI khi run bị cancel.
7. Hiển thị lý do dừng nếu backend trả về.

**Phụ thuộc**
FE 11 và API run detail hoặc cancel.

**Đầu ra bàn giao**
1. User điều khiển được run.

**Định nghĩa hoàn thành**
1. Không còn run mồ côi trên UI.
2. User luôn biết topic đang chạy hay đang chờ mình.

### FE 13. Sidebar thông tin topic và agent roster
**Mục tiêu**
Hiển thị cấu hình đội agent để user hiểu bối cảnh cuộc thảo luận.

**Việc cần làm**
1. Hiển thị topic title.
2. Hiển thị danh sách agent, role, mô tả ngắn.
3. Đánh dấu Lead rõ ràng.
4. Hiển thị rule topic đã khóa prompt.
5. Hiển thị số lượng message, run status gần nhất.
6. Thêm nút archive topic nếu scope FE có xử lý.

**Phụ thuộc**
FE 08 và API topic detail.

**Đầu ra bàn giao**
1. Sidebar rõ ràng.

**Định nghĩa hoàn thành**
1. User nhìn vào sidebar hiểu ai đang có mặt trong topic.

### FE 14. Chặn sửa agent sau khi topic có history
**Mục tiêu**
Thể hiện đúng business rule bất biến của topic.

**Việc cần làm**
1. Nếu topic đã có message thì ẩn hoặc disable action sửa agent.
2. Hiển thị cảnh báo giải thích vì sao không sửa được.
3. Nếu backend trả lỗi do rule bất biến thì hiển thị thông báo đúng ngữ cảnh.

**Phụ thuộc**
FE 13 và API topic detail.

**Đầu ra bàn giao**
1. UI không cho người dùng thao tác sai.

**Định nghĩa hoàn thành**
1. Rule bất biến được phản ánh rõ trên FE, không gây nhầm lẫn.

### FE 15. Xử lý trạng thái waiting human
**Mục tiêu**
Tạo trải nghiệm mượt khi Lead hỏi ngược Human.

**Việc cần làm**
1. Nhận event `waiting_human`.
2. Đánh dấu run đã tạm dừng.
3. Highlight tin nhắn của Lead yêu cầu Human phản hồi.
4. Focus composer.
5. Hiển thị gợi ý `Hệ thống đang chờ bạn phản hồi`.
6. Bật lại composer nếu trước đó bị khóa.

**Phụ thuộc**
FE 11, FE 12.

**Đầu ra bàn giao**
1. UI chờ phản hồi tự nhiên.

**Định nghĩa hoàn thành**
1. User hiểu ngay rằng cần trả lời để tiếp tục topic.

### FE 16. Error handling toàn luồng
**Mục tiêu**
Không để trải nghiệm gãy khi API hoặc stream lỗi.

**Việc cần làm**
1. Tạo thông báo lỗi cho create topic.
2. Tạo thông báo lỗi cho load topic detail.
3. Tạo thông báo lỗi cho send message.
4. Tạo thông báo lỗi cho SSE disconnect.
5. Hỗ trợ retry action cho một số case phù hợp.
6. Log lỗi FE ở console hoặc service giám sát nếu có.

**Phụ thuộc**
FE 04 đến FE 15.

**Đầu ra bàn giao**
1. Hệ thống có fallback cho lỗi chính.

**Định nghĩa hoàn thành**
1. Không có màn hình trắng khi lỗi phổ biến xảy ra.

### FE 17. Test FE và hardening trước UAT
**Mục tiêu**
Ổn định FE trước khi bàn giao QA.

**Việc cần làm**
1. Viết test cho component validation quan trọng.
2. Viết test cho store xử lý SSE.
3. Test thủ công các flow tạo topic, gửi message, stop run, waiting human.
4. Kiểm tra hiệu năng render timeline dài.
5. Kiểm tra UI trên các viewport chính.
6. Sửa các issue blocker.

**Phụ thuộc**
Toàn bộ job FE trước đó.

**Đầu ra bàn giao**
1. FE đủ ổn định để QA nhận test.

**Định nghĩa hoàn thành**
1. Không còn bug blocker trong các flow chính.

## 6. Thứ tự thực hiện khuyến nghị cho FE
1. FE 01
2. FE 02
3. FE 03
4. FE 04
5. FE 05
6. FE 06
7. FE 07
8. FE 08
9. FE 09
10. FE 10
11. FE 11
12. FE 12
13. FE 13
14. FE 14
15. FE 15
16. FE 16
17. FE 17

## 7. Các tiêu chí nghiệm thu FE cho MVP
1. User tạo topic mới với ít nhất 2 agent thành công.
2. Topic mới không tự chạy nếu chưa có human message.
3. Khi human gửi message đầu tiên, run được khởi động.
4. UI hiển thị đúng nhiều agent tham gia thảo luận.
5. Chỉ một run active tại một thời điểm trong một topic.
6. Khi Lead hỏi ngược Human, UI chuyển sang trạng thái chờ human.
7. User có thể stop run.
8. Prompt agent không có UI cho chỉnh sửa sau khi topic có history.
9. Không có lỗi UI blocker trong flow chính.
