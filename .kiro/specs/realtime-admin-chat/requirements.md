# Tài liệu Yêu cầu - Tính năng Chat Thời gian Thực

## Giới thiệu

Tính năng Chat Thời gian Thực cho phép Admin giao tiếp trực tiếp với Teacher và Student trong hệ thống quản lý trường học. Hệ thống sử dụng Socket.io đã có sẵn để cung cấp khả năng nhắn tin tức thời, lưu trữ lịch sử tin nhắn trong MongoDB, và tích hợp với hệ thống xác thực JWT hiện tại.

## Bảng thuật ngữ

- **Chat_System**: Hệ thống chat thời gian thực
- **Admin**: Người dùng có vai trò quản trị viên
- **Teacher**: Người dùng có vai trò giáo viên
- **Student**: Người dùng có vai trò học sinh
- **Conversation**: Cuộc hội thoại giữa hai người dùng
- **Message**: Tin nhắn văn bản được gửi trong một Conversation
- **Message_Store**: Cơ sở dữ liệu MongoDB lưu trữ tin nhắn
- **Socket_Connection**: Kết nối Socket.io giữa client và server
- **User_List**: Danh sách người dùng có thể chat
- **Chat_Interface**: Giao diện người dùng để chat
- **Notification_System**: Hệ thống thông báo hiện có
- **Online_Status**: Trạng thái trực tuyến/ngoại tuyến của người dùng
- **Unread_Count**: Số lượng tin nhắn chưa đọc
- **Message_History**: Lịch sử tin nhắn của một Conversation
- **Typing_Indicator**: Chỉ báo người dùng đang gõ tin nhắn

## Yêu cầu

### Yêu cầu 1: Khởi tạo Cuộc hội thoại

**User Story:** Là một người dùng, tôi muốn khởi tạo cuộc hội thoại với những người dùng được phép, để có thể giao tiếp trực tiếp với họ.

#### Tiêu chí chấp nhận

1. WHEN Admin chọn bất kỳ người dùng nào (Admin, Teacher, Student) từ User_List, THE Chat_System SHALL tạo hoặc mở Conversation với người dùng đó
2. WHEN Teacher chọn một Admin hoặc Student từ User_List, THE Chat_System SHALL tạo hoặc mở Conversation với người dùng đó
3. WHEN Student chọn một Admin hoặc Teacher từ User_List, THE Chat_System SHALL tạo hoặc mở Conversation với người dùng đó
4. THE Chat_System SHALL hiển thị User_List với tất cả người dùng (Admin, Teacher, Student) cho Admin
5. THE Chat_System SHALL hiển thị User_List với Admin và Student cho Teacher
6. THE Chat_System SHALL hiển thị User_List với Admin và Teacher cho Student
7. WHEN một Conversation được tạo, THE Chat_System SHALL lưu Conversation vào Message_Store

### Yêu cầu 2: Gửi và Nhận Tin nhắn Thời gian Thực

**User Story:** Là một người dùng, tôi muốn gửi và nhận tin nhắn ngay lập tức, để có thể giao tiếp hiệu quả.

#### Tiêu chí chấp nhận

1. WHEN người dùng gửi một Message, THE Chat_System SHALL gửi Message qua Socket_Connection trong vòng 100ms
2. WHEN một Message được gửi, THE Chat_System SHALL lưu Message vào Message_Store
3. WHEN người nhận đang trực tuyến, THE Chat_System SHALL hiển thị Message trong Chat_Interface ngay lập tức
4. WHEN người nhận đang ngoại tuyến, THE Chat_System SHALL lưu Message để hiển thị khi họ trực tuyến trở lại
5. THE Chat_System SHALL đảm bảo Message được gửi theo đúng thứ tự thời gian

### Yêu cầu 3: Hiển thị Lịch sử Tin nhắn

**User Story:** Là một người dùng, tôi muốn xem lịch sử tin nhắn trước đó, để có thể theo dõi các cuộc hội thoại đã diễn ra.

#### Tiêu chí chấp nhận

1. WHEN người dùng mở một Conversation, THE Chat_System SHALL tải 50 Message gần nhất từ Message_Store
2. WHEN người dùng cuộn lên đầu Message_History, THE Chat_System SHALL tải thêm 50 Message trước đó
3. THE Chat_System SHALL hiển thị Message_History theo thứ tự thời gian từ cũ đến mới
4. THE Chat_System SHALL hiển thị thông tin người gửi và thời gian cho mỗi Message
5. WHEN không còn Message nào để tải, THE Chat_System SHALL hiển thị thông báo "Đã hết tin nhắn"

### Yêu cầu 4: Đếm Tin nhắn Chưa đọc

**User Story:** Là một người dùng, tôi muốn biết có bao nhiêu tin nhắn chưa đọc, để không bỏ lỡ tin nhắn quan trọng.

#### Tiêu chí chấp nhận

1. WHEN một Message mới được nhận, THE Chat_System SHALL tăng Unread_Count cho Conversation đó
2. WHEN người dùng mở một Conversation, THE Chat_System SHALL đặt Unread_Count về 0
3. THE Chat_System SHALL hiển thị Unread_Count bên cạnh mỗi Conversation trong danh sách
4. WHEN Unread_Count lớn hơn 0, THE Chat_System SHALL hiển thị badge màu đỏ với số lượng
5. THE Chat_System SHALL lưu Unread_Count vào Message_Store để duy trì qua các phiên

### Yêu cầu 5: Hiển thị Trạng thái Trực tuyến

**User Story:** Là một người dùng, tôi muốn biết người khác có đang trực tuyến không, để biết họ có thể phản hồi ngay hay không.

#### Tiêu chí chấp nhận

1. WHEN người dùng kết nối Socket_Connection, THE Chat_System SHALL cập nhật Online_Status thành "online"
2. WHEN người dùng ngắt Socket_Connection, THE Chat_System SHALL cập nhật Online_Status thành "offline"
3. THE Chat_System SHALL hiển thị Online_Status bên cạnh tên người dùng trong User_List
4. THE Chat_System SHALL hiển thị Online_Status trong Chat_Interface
5. WHEN Online_Status thay đổi, THE Chat_System SHALL cập nhật hiển thị trong vòng 2 giây

### Yêu cầu 6: Hiển thị Chỉ báo Đang gõ

**User Story:** Là một người dùng, tôi muốn biết khi người khác đang gõ tin nhắn, để biết họ đang chuẩn bị phản hồi.

#### Tiêu chí chấp nhận

1. WHEN người dùng bắt đầu gõ trong Chat_Interface, THE Chat_System SHALL gửi Typing_Indicator qua Socket_Connection
2. WHEN người dùng ngừng gõ trong 3 giây, THE Chat_System SHALL ngừng gửi Typing_Indicator
3. WHEN Typing_Indicator được nhận, THE Chat_System SHALL hiển thị "[Tên người dùng] đang gõ..." trong Chat_Interface
4. WHEN người dùng gửi Message, THE Chat_System SHALL xóa Typing_Indicator ngay lập tức
5. THE Chat_System SHALL chỉ hiển thị Typing_Indicator cho người nhận, không hiển thị cho người gửi

### Yêu cầu 7: Tích hợp Thông báo

**User Story:** Là một người dùng, tôi muốn nhận thông báo khi có tin nhắn mới, để không bỏ lỡ tin nhắn quan trọng.

#### Tiêu chí chấp nhận

1. WHEN một Message mới được nhận, THE Chat_System SHALL gửi thông báo đến Notification_System
2. WHILE người dùng không mở Chat_Interface, THE Chat_System SHALL hiển thị thông báo trên màn hình
3. WHEN người dùng click vào thông báo, THE Chat_System SHALL mở Chat_Interface và Conversation tương ứng
4. THE Chat_System SHALL hiển thị tên người gửi và nội dung Message trong thông báo
5. WHERE người dùng đã tắt thông báo, THE Chat_System SHALL không hiển thị thông báo

### Yêu cầu 8: Tìm kiếm Người dùng

**User Story:** Là một người dùng, tôi muốn tìm kiếm người dùng khác, để nhanh chóng tìm người cần chat.

#### Tiêu chí chấp nhận

1. WHEN người dùng nhập từ khóa vào ô tìm kiếm, THE Chat_System SHALL lọc User_List theo tên hoặc email
2. THE Chat_System SHALL hiển thị kết quả tìm kiếm trong vòng 500ms
3. THE Chat_System SHALL hiển thị vai trò (Admin/Teacher/Student) trong kết quả tìm kiếm
4. WHEN không có kết quả, THE Chat_System SHALL hiển thị thông báo "Không tìm thấy người dùng"
5. WHEN từ khóa rỗng, THE Chat_System SHALL hiển thị toàn bộ User_List theo quyền của người dùng
6. THE Chat_System SHALL chỉ hiển thị người dùng mà người dùng hiện tại được phép chat

### Yêu cầu 9: Xác thực và Phân quyền

**User Story:** Là hệ thống, tôi muốn đảm bảo chỉ người dùng được xác thực mới có thể chat, để bảo mật thông tin.

#### Tiêu chí chấp nhận

1. WHEN người dùng kết nối Socket_Connection, THE Chat_System SHALL xác thực JWT token
2. IF JWT token không hợp lệ, THEN THE Chat_System SHALL từ chối Socket_Connection
3. THE Chat_System SHALL cho phép Admin chat với tất cả người dùng (Admin, Teacher, Student)
4. THE Chat_System SHALL cho phép Teacher chat với Admin và Student
5. THE Chat_System SHALL cho phép Student chat với Admin và Teacher
6. THE Chat_System SHALL không cho phép Student chat với Student khác
7. IF người dùng cố gắng truy cập Conversation không được phép, THEN THE Chat_System SHALL trả về lỗi 403

### Yêu cầu 10: Giao diện Chat Responsive

**User Story:** Là một người dùng, tôi muốn sử dụng chat trên mọi thiết bị, để có thể giao tiếp mọi lúc mọi nơi.

#### Tiêu chí chấp nhận

1. THE Chat_Interface SHALL hiển thị đúng trên màn hình desktop (>= 1024px)
2. THE Chat_Interface SHALL hiển thị đúng trên màn hình tablet (768px - 1023px)
3. THE Chat_Interface SHALL hiển thị đúng trên màn hình mobile (< 768px)
4. WHEN màn hình nhỏ hơn 768px, THE Chat_System SHALL hiển thị Chat_Interface toàn màn hình
5. THE Chat_System SHALL đảm bảo tất cả chức năng hoạt động trên mọi kích thước màn hình

### Yêu cầu 11: Xử lý Lỗi Kết nối

**User Story:** Là một người dùng, tôi muốn hệ thống xử lý lỗi kết nối một cách mượt mà, để không mất tin nhắn.

#### Tiêu chí chấp nhận

1. IF Socket_Connection bị ngắt, THEN THE Chat_System SHALL cố gắng kết nối lại trong vòng 5 giây
2. WHILE đang kết nối lại, THE Chat_System SHALL hiển thị thông báo "Đang kết nối lại..."
3. WHEN kết nối lại thành công, THE Chat_System SHALL đồng bộ Message chưa được gửi
4. IF kết nối lại thất bại sau 3 lần thử, THEN THE Chat_System SHALL hiển thị thông báo lỗi
5. THE Chat_System SHALL lưu Message chưa gửi trong local storage để không mất dữ liệu

### Yêu cầu 12: Hiệu suất và Tối ưu hóa

**User Story:** Là hệ thống, tôi muốn đảm bảo hiệu suất tốt ngay cả với nhiều người dùng, để trải nghiệm mượt mà.

#### Tiêu chí chấp nhận

1. THE Chat_System SHALL xử lý tối thiểu 100 Socket_Connection đồng thời
2. THE Chat_System SHALL gửi Message trong vòng 100ms khi mạng ổn định
3. THE Chat_System SHALL tải Message_History trong vòng 1 giây
4. THE Chat_System SHALL sử dụng pagination để tải Message_History
5. THE Chat_System SHALL tối ưu hóa truy vấn database với index trên conversation_id và timestamp
