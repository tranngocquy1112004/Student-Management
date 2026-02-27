# Hướng dẫn Import Excel cho Bài tập

## Cấu trúc file Excel

File Excel của bạn cần có các cột sau:

| Tên bài tập | Mô tả | Điểm tối đa | Hạn nộp | Thời gian (phút) | Loại | Câu hỏi |
|-------------|---------|-------------|-----------|------------------|-------|----------|
| Bài tập 1 | Làm bài tập về nhà | 10 | 2024-12-31 23:59 | 60 | file | |
| Quiz 1 | Kiểm tra trắc nghiệm | 20 | 2024-12-25 23:59 | 30 | quiz | Câu 1\nCâu 2\nCâu 3 |

## Chi tiết các cột

### **Tên bài tập** (bắt buộc)
- Tên của bài tập
- Ví dụ: "Bài tập lớn", "Quiz giữa kỳ"

### **Mô tả** (tùy chọn)
- Mô tả chi tiết về bài tập
- Có thể để trống

### **Điểm tối đa** (tùy chọn)
- Điểm cao nhất có thể đạt được
- Mặc định: 10 nếu không điền

### **Hạn nộp** (tùy chọn)
- Thời hạn nộp bài
- Định dạng: YYYY-MM-DD HH:MM
- Ví dụ: "2024-12-31 23:59"
- Mặc định: không có hạn

### **Thời gian (phút)** (tùy chọn)
- Thời gian làm bài cho quiz
- Chỉ áp dụng cho loại quiz
- Mặc định: 60 phút

### **Loại** (tùy chọn)
- `file`: Bài tập nộp file
- `quiz`: Bài tập trắc nghiệm
- Mặc định: file

### **Câu hỏi** (tùy chọn)
- Danh sách câu hỏi cho quiz
- Mỗi câu hỏi trên 1 dòng
- Chỉ áp dụng cho loại quiz
- Ví dụ: "Câu 1\nCâu 2\nCâu 3"

## Ví dụ file Excel

```
Tên bài tập,Mô tả,Điểm tối đa,Hạn nộp,Thời gian (phút),Loại,Câu hỏi
Bài tập 1,Làm bài tập về nhà,10,2024-12-31 23:59,60,file,
Quiz 1,Kiểm tra 15 phút,20,2024-12-25 23:59,15,quiz,1+1=?\n2+2=?\n3+3=?
Bài tập 2,Nộp báo cáo,15,2025-01-15 23:59,90,file,
```

## Lưu ý quan trọng

1. **Tiêu đề cột**: Phải đúng tên cột (có thể dùng tiếng Việt hoặc tiếng Anh)
2. **Dòng trống**: Bỏ qua các dòng trống
3. **Tên bài tập**: Bắt buộc, các dòng không có tên sẽ bị bỏ qua
4. **Quiz**: Cần có cột "Câu hỏi" và "Loại" = "quiz"
5. **File format**: Chấp nhận .xlsx và .xls

## Các tên cột được hỗ trợ

- **Tên bài tập** hoặc **title**
- **Mô tả** hoặc **description**  
- **Điểm tối đa** hoặc **maxScore**
- **Hạn nộp** hoặc **deadline**
- **Thời gian (phút)** hoặc **durationMinutes**
- **Loại** hoặc **type**
- **Câu hỏi** hoặc **questions**

## Cách sử dụng

1. **Tạo file Excel** theo cấu trúc trên
2. **Vào trang lớp học** → Tab "Bài tập"
3. **Click "📁 Import Excel"**
4. **Chọn file Excel** đã tạo
5. **Chờ import** - hệ thống sẽ thông báo kết quả

## Lỗi thường gặp

- **"Không đọc được file"**: Kiểm tra định dạng file (.xlsx, .xls)
- **"Import thất bại"**: Kiểm tra tên cột có đúng không
- **"Bài tập trống"**: Đảm bảo cột "Tên bài tập" có dữ liệu
