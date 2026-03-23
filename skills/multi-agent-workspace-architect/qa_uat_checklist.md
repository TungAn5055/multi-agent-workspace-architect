# QA UAT Checklist

Tài liệu này gom toàn bộ checklist kiểm thử cho MVP multi agent workspace. Dùng cho QA nội bộ, SIT, smoke test staging và UAT với business hoặc product owner.

## 1. Mục tiêu kiểm thử
1. Xác nhận hệ thống bám đúng contract sản phẩm đã khóa.
2. Xác nhận FE, BE và orchestration chạy liền mạch theo luồng thật.
3. Phát hiện lỗi nghiệp vụ, lỗi đồng bộ state, lỗi stream và lỗi race condition sớm.
4. Cung cấp checklist nghiệm thu rõ ràng trước khi đóng MVP.

## 2. Quy tắc nghiệp vụ bắt buộc phải kiểm tra
1. Topic không tự chạy ngay sau khi tạo.
2. Topic chỉ chạy sau human message đầu tiên.
3. Chỉ Lead được hỏi ngược Human.
4. Human là người quyết định dừng hoặc kết luận.
5. Không phải agent nào cũng trả lời ở mọi lượt.
6. Prompt agent không sửa được sau khi topic có history.
7. Mỗi topic chỉ có một run active.
8. V1 không có web search.
9. V1 chỉ dùng tiếng Việt.
10. V1 dùng một model chung cho toàn topic.

## 3. Chuẩn bị môi trường test
1. Có môi trường local hoặc staging với FE, BE, DB, Redis hoạt động.
2. Có ít nhất 2 tài khoản test nếu cần phân quyền.
3. Có bộ topic mẫu với 2 agent và 3 agent.
4. Có dữ liệu seed cho topic chưa có history và topic đã có history.
5. Có log backend và console FE sẵn để đối chiếu khi fail.

## 4. Bộ test theo nhóm chức năng

### QA 01. Smoke test khởi động hệ thống
1. FE mở được trang chủ.
2. BE health check trả thành công.
3. Trang danh sách topic load được.
4. Không có lỗi console nghiêm trọng khi vừa vào app.

### QA 02. Tạo topic hợp lệ
1. Mở trang tạo topic.
2. Nhập title hợp lệ.
3. Tạo 2 agent hợp lệ.
4. Submit thành công.
5. Điều hướng sang workspace thành công.
6. Topic mới xuất hiện trong topic list.

**Kỳ vọng**
1. Không có run nào tự chạy sau khi tạo.
2. Topic lưu đúng title và agent config.

### QA 03. Validation khi tạo topic
1. Bỏ trống title rồi submit.
2. Chỉ tạo 1 agent rồi submit.
3. Để trống description agent rồi submit.
4. Tạo 2 agent trùng tên rồi submit.
5. Chọn role không hợp lệ nếu có thể giả lập từ request.

**Kỳ vọng**
1. FE hiển thị lỗi đúng vị trí.
2. Backend cũng chặn được request xấu nếu bypass FE.

### QA 04. Topic không tự chạy trước message đầu tiên
1. Tạo topic thành công.
2. Không gửi message nào.
3. Refresh trang.
4. Kiểm tra run status.

**Kỳ vọng**
1. Không có active run.
2. Timeline rỗng hoặc chỉ có system state ban đầu nếu được thiết kế như vậy.

### QA 05. Gửi message đầu tiên để khởi động topic
1. Tạo topic mới.
2. Gửi human message đầu tiên.
3. Quan sát timeline.
4. Quan sát status run.

**Kỳ vọng**
1. Human message được lưu ngay.
2. Run chuyển từ queued sang running.
3. Agent bắt đầu trả lời qua stream.

### QA 06. Kiểm tra streaming agent message
1. Gửi câu hỏi mở để agent trả lời dài hơn.
2. Quan sát nội dung delta hiện dần.
3. Quan sát message status.

**Kỳ vọng**
1. Có trạng thái agent đang phát biểu.
2. Nội dung không bị nhảy thứ tự.
3. Khi xong, message chuyển completed.

### QA 07. Không phải agent nào cũng trả lời ở mọi lượt
1. Tạo topic với 3 agent.
2. Gửi câu hỏi nhắm vào một nhánh hẹp.
3. Theo dõi số agent thực sự trả lời.

**Kỳ vọng**
1. Backend chỉ chọn tập con agent phù hợp.
2. Không có hành vi gọi đủ cả 3 agent một cách máy móc.

### QA 08. Tag agent cụ thể trong input
1. Gửi câu hỏi có `@TênAgent`.
2. Theo dõi xem agent đó có được ưu tiên tham gia hay không.

**Kỳ vọng**
1. Agent được tag có xác suất cao hoặc bắt buộc được chọn theo rule thiết kế.
2. UI hiển thị đúng mention.

### QA 09. Chỉ Lead được hỏi ngược Human
1. Dùng topic có Lead và Assistant.
2. Gửi câu hỏi thiếu thông tin để khuyến khích hỏi ngược.
3. Lặp vài lần với tình huống khác nhau.

**Kỳ vọng**
1. Chỉ message của Lead mới được phép chứa yêu cầu rõ ràng gửi tới Human.
2. Assistant không tự ý yêu cầu Human bổ sung như một decision gate.

### QA 10. Run chuyển waiting human đúng lúc
1. Tạo tình huống Lead cần hỏi thêm Human.
2. Quan sát status run và composer.

**Kỳ vọng**
1. Run chuyển `waiting_human`.
2. Composer được mở sẵn và focus.
3. UI báo rõ đang chờ Human phản hồi.

### QA 11. Tiếp tục topic sau waiting human
1. Sau khi run ở trạng thái `waiting_human`, gửi câu trả lời từ Human.
2. Quan sát run mới hoặc flow tiếp nối theo thiết kế.

**Kỳ vọng**
1. Hệ thống tiếp tục hội thoại mượt.
2. Không còn treo ở trạng thái chờ cũ.

### QA 12. Chỉ một run active trong một topic
1. Gửi message để tạo run.
2. Trong khi run đang chạy, thử gửi tiếp message khác bằng UI.
3. Thử gọi API thẳng nếu có thể.

**Kỳ vọng**
1. FE chặn hoặc disable composer theo policy.
2. Backend chặn run song song.
3. Không xuất hiện hai run active cùng topic.

### QA 13. Stop run thủ công
1. Gửi message để khởi động run.
2. Khi agent đang stream, bấm stop run.

**Kỳ vọng**
1. Run chuyển `cancelled`.
2. Không có message mới tiếp tục sinh ra sau đó.
3. Timeline vẫn nhất quán.

### QA 14. Sửa agent trước khi topic có history
1. Tạo topic mới nhưng chưa gửi message.
2. Sửa name hoặc description agent.
3. Lưu thành công.

**Kỳ vọng**
1. Update thành công trước khi topic có history.

### QA 15. Chặn sửa agent sau khi topic có history
1. Tạo topic.
2. Gửi ít nhất một message.
3. Thử sửa description agent.
4. Thử sửa role agent.
5. Thử reorder agent.

**Kỳ vọng**
1. Tất cả action sửa bị chặn theo rule đã khóa nếu backend định nghĩa như vậy.
2. FE hiển thị đúng lý do không được sửa.

### QA 16. Archive topic
1. Archive topic từ danh sách hoặc workspace.
2. Reload trang.
3. Kiểm tra khả năng gửi message mới.

**Kỳ vọng**
1. Topic hiển thị trạng thái archive.
2. Hệ thống xử lý đúng theo policy đã định cho topic archive.

### QA 17. Đọc lại timeline topic cũ
1. Mở topic đã có nhiều message.
2. Reload trang nhiều lần.
3. Cuộn lên xuống timeline.

**Kỳ vọng**
1. Message đúng thứ tự.
2. Không mất message.
3. Không nhân đôi message stream đã hoàn thành.

### QA 18. Kiểm tra tiếng Việt và cách diễn đạt
1. Gửi câu hỏi tiếng Việt.
2. Quan sát đầu ra của agent.

**Kỳ vọng**
1. Agent trả lời bằng tiếng Việt.
2. Không chuyển sang tiếng Anh một cách bất thường.

### QA 19. Kiểm tra không dùng web search ở V1
1. Gửi câu hỏi gợi ý lấy thông tin thời sự hoặc nguồn ngoài.
2. Quan sát output và trace nếu có quyền.

**Kỳ vọng**
1. Hệ thống không hiển thị dấu hiệu có web search.
2. Không sinh ra citation giả từ web.

### QA 20. Xử lý lỗi API hoặc SSE
1. Ngắt backend tạm thời khi load topic.
2. Ngắt SSE trong khi run đang chạy.
3. Khôi phục kết nối.

**Kỳ vọng**
1. FE hiển thị lỗi có thể hiểu được.
2. Không vỡ layout.
3. Có chiến lược reconnect hoặc refresh hợp lý.

### QA 21. Race condition gửi lặp
1. Nhấn gửi liên tiếp nhiều lần.
2. Mô phỏng mạng chậm.
3. Thử reload ngay sau khi gửi.

**Kỳ vọng**
1. Không tạo run trùng.
2. Không tạo human message trùng ngoài policy cho phép.

### QA 22. Message ordering khi stream dài
1. Gửi prompt để agent trả lời dài.
2. Trong lúc stream, quan sát thứ tự timeline.

**Kỳ vọng**
1. Delta không nhảy lên vị trí sai.
2. Sequence number vẫn đúng.

### QA 23. Phân quyền owner topic
1. Dùng user A tạo topic.
2. Dùng user B truy cập topic của A nếu hệ thống có auth đa người dùng.

**Kỳ vọng**
1. Chỉ owner có quyền xem hoặc thao tác theo policy bảo mật.

### QA 24. Dữ liệu tồn tại sau refresh và restart backend
1. Tạo topic, gửi message.
2. Restart FE hoặc BE.
3. Vào lại topic.

**Kỳ vọng**
1. Lịch sử vẫn còn nguyên.
2. Không mất trạng thái dữ liệu đã hoàn tất.

### QA 25. UAT theo kịch bản business thực tế
1. Tạo topic `Nghiên cứu chọn co founder` với 2 agent: Lead và Assistant.
2. Human gửi câu hỏi mở.
3. Quan sát Assistant thu thập góc nhìn.
4. Quan sát Lead tổng hợp và hỏi lại Human nếu thiếu dữ liệu.
5. Human trả lời tiếp.
6. Quan sát vòng tiếp theo.

**Kỳ vọng**
1. Trải nghiệm gần đúng tinh thần ảnh mẫu.
2. Human cảm nhận rõ có đối thoại nhóm, không phải chatbot đơn lẻ.

## 5. Checklist phi chức năng

### Hiệu năng
1. Tải trang topic list trong ngưỡng chấp nhận.
2. Tải workspace với lịch sử trung bình không quá chậm.
3. Stream dài không làm UI giật mạnh.

### Độ ổn định
1. Không crash FE khi SSE mất kết nối ngắn.
2. Không crash worker khi một step model fail.
3. Không để active run mồ côi quá lâu mà không có trạng thái rõ ràng.

### Quan sát và debug
1. Có thể tìm được run theo run id.
2. Có thể biết step nào fail.
3. Có thể biết vì sao run dừng.

## 6. Tiêu chí pass cho MVP
1. Tất cả test critical từ QA 02 đến QA 15 pass.
2. Không còn bug blocker và không còn bug nghiêm trọng phá vỡ flow chính.
3. UAT kịch bản business thực tế pass.
4. Product owner xác nhận trải nghiệm đúng mục tiêu multi agent discussion.

## 7. Mẫu báo cáo bug đề xuất
1. Tiêu đề bug.
2. Môi trường.
3. Tài khoản test.
4. Topic id nếu có.
5. Run id nếu có.
6. Các bước tái hiện.
7. Kết quả thực tế.
8. Kết quả kỳ vọng.
9. Ảnh hoặc video đính kèm.
10. Log FE hoặc BE liên quan nếu có.
