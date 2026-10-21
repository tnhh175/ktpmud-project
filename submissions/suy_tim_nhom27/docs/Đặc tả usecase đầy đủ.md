# Đặc tả Use Case — Hệ thống quản lý bệnh nhân suy tim

**Phiên bản:** 0.2 · **Ngày:** 21/10/2026 · **Trạng thái:** bản dự thảo đầy đủ theo bộ sơ đồ hiện tại; chưa phải xác nhận của bệnh viện hoặc kết quả triển khai.

## 1. Phạm vi và cách sử dụng

Tài liệu đặc tả 54 Use Case thuộc sáu nhóm, giữ nguyên mã/tên trên các sơ đồ hiện hành. Mỗi bảng có sáu trường: tên, tác nhân chính, tiền điều kiện, luồng chính, luồng thay thế và hậu điều kiện. Mã UC nằm trong tên để liên kết các tài liệu. Sơ đồ tổng quan không được đặc tả lặp thành một bộ khác.

Đây là bản đầy đủ để quản lý tài liệu trên GitHub và làm đầu vào thiết kế/kiểm thử. Bản [Use Case trọng tâm cho báo cáo](Use-case-trong-tam-cho-bao-cao-v0.2.md) trích nguyên 12 bảng đại diện. Lựa chọn báo cáo là đề xuất biên tập, không loại bỏ các chức năng còn lại khỏi phạm vi.

**RTM được lập ở một mục/tệp riêng.** Tài liệu này không thay bảng truy vết, User Story, BDD, đặc tả dữ liệu hoặc bộ ca kiểm thử. Các mã FR hiện hành là FR01–FR46; khi lập RTM cần đối chiếu theo quan hệ nhiều–nhiều, không suy rằng một bảng UC bằng một FR.

## 2. Quy ước dùng chung

1. **Quyền:** “Theo quyền” nghĩa là được giao đúng việc và đúng phạm vi hồ sơ. Không mặc định mọi nhân viên/bác sĩ có mọi quyền. Người nhập có thể khác người xác nhận; bác sĩ là người quyết định chuyên môn cuối cùng.

2. **Bệnh án và tài khoản:** hồ sơ có mã nội bộ, chứa thông tin người bệnh và dữ liệu theo lượt/đợt/mốc thời gian. CCCD là thông tin định danh khi có, không thay mã mọi đối tượng và không tự cấp quyền xem. Tài khoản chỉ xem bệnh án sau liên kết được xác minh.

3. **Lưu và truy cập:** các thao tác được bảo vệ phải kiểm tra quyền hiện hành khi xử lý, kể cả mở từ liên kết hoặc tải tệp. Thay đổi có người/thời điểm và lịch sử theo phạm vi quy định. Lưu lỗi hoặc chưa rõ kết quả không được báo thành công; kiểm tra trạng thái trước khi thử lại nếu có nguy cơ lặp.

4. **Dữ liệu và phiên bản:** ghi đúng hồ sơ/lượt, nguồn, thời điểm và đơn vị khi phù hợp. Chưa có/chưa đánh giá khác bình thường. Dữ liệu hoặc phương án đổi làm kết quả hỗ trợ liên quan cần xem lại; không ghi đè lịch sử hoặc dùng bản cũ như kết quả cho bản mới.

5. **Demo và kết nối viện:** demo dùng bệnh án sản phẩm làm nơi nhập/cập nhật chính, cùng các nguồn/đích HIS/EMR, LIS, PACS/RIS mô phỏng. Khi kết nối thật, HIS/EMR là nguồn bệnh án chính phía viện theo giao diện và quyền được thống nhất; nguồn LIS/PACS/RIS vẫn được giữ. Chưa chốt API, HL7/FHIR, SSO hoặc phương thức kết nối thật.

6. **Bốn module:** sử dụng đầu ra liên quan theo hướng Diagnosis → Lab/Test → Treatment → MedSafety, kết hợp dữ liệu bệnh án; không bắt mọi ca chạy đủ bốn module. Lab/Test không tạo kết quả đo. Gợi ý/cảnh báo không tự thành chỉ định, kết luận, đơn hoặc hành động ngừng thuốc.

7. **Các trạng thái riêng:** xác nhận chuyên môn, hoàn tất lượt, công bố cho bệnh nhân và đích HIS/EMR tiếp nhận ghi trả được quản lý riêng. Kế hoạch theo dõi thuộc kế hoạch điều trị; mốc tái khám dự kiến chưa phải lịch hẹn đã xác nhận.

8. **Giới hạn:** app ngoại trú thuộc phạm vi nhưng triển khai sau luồng lõi. Chưa thêm người chăm sóc, nhật ký uống thuốc, thanh toán/chọn bác sĩ hoặc nội trú chi tiết. Đã đọc/nhận nhắc không chứng minh đã uống thuốc. Quy tắc có đối tượng áp dụng riêng, không mặc định cả hệ thống chỉ phục vụ người cao tuổi.

Các hành vi UC2.02–UC2.05 và UC3.05 kế thừa tác nhân của ca gọi; chúng không phải tác nhân “Hệ thống” mới. Quan hệ include trên sơ đồ không biểu diễn thứ tự dữ liệu. UC4.07 sử dụng xác nhận UC4.06; các tham chiếu khác dưới đây mô tả liên hệ hành vi, không tự thêm cạnh vào sơ đồ.

## 3. Mục lục sáu nhóm

### Nhóm 1. Hồ sơ bệnh án và lượt khám (12 Use Case)

- [UC1.01 — Tra cứu hồ sơ bệnh án](#uc1-01)
- [UC1.02 — Tạo hồ sơ bệnh án](#uc1-02)
- [UC1.03 — Cập nhật thông tin hành chính](#uc1-03)
- [UC1.04 — Liên kết tài khoản bệnh nhân với bệnh án](#uc1-04)
- [UC1.05 — Quản lý khung giờ khám](#uc1-05)
- [UC1.06 — Quản lý lịch hẹn tại quầy](#uc1-06)
- [UC1.07 — Tiếp nhận và mở lượt khám](#uc1-07)
- [UC1.08 — Cập nhật dữ liệu lâm sàng](#uc1-08)
- [UC1.09 — Ghi nhận chỉ định cận lâm sàng](#uc1-09)
- [UC1.10 — Ghi nhận kết quả cận lâm sàng](#uc1-10)
- [UC1.11 — Tra cứu lịch sử khám và điều trị](#uc1-11)
- [UC1.12 — Hoàn tất lượt khám](#uc1-12)

### Nhóm 2. Tích hợp và tiền xử lý dữ liệu (9 Use Case)

- [UC2.01 — Tiếp nhận dữ liệu viện vào hồ sơ bệnh án](#uc2-01)
- [UC2.02 — Đối chiếu hồ sơ và lượt khám](#uc2-02)
- [UC2.03 — Kiểm tra dữ liệu hợp lệ và dữ liệu thiếu](#uc2-03)
- [UC2.04 — Chuẩn hóa dữ liệu](#uc2-04)
- [UC2.05 — Kiểm soát dữ liệu trùng và bản sửa](#uc2-05)
- [UC2.06 — Ghi trả dữ liệu đã xác nhận](#uc2-06)
- [UC2.07 — Tra cứu lịch sử gửi và nhận dữ liệu](#uc2-07)
- [UC2.08 — Kiểm tra kết quả ghi trả dữ liệu](#uc2-08)
- [UC2.09 — Xử lý lại trao đổi dữ liệu bị lỗi](#uc2-09)

### Nhóm 3. Hỗ trợ chuyên môn AI-CDSS (8 Use Case)

- [UC3.01 — Hỗ trợ chẩn đoán (Diagnosis)](#uc3-01)
- [UC3.02 — Gợi ý cận lâm sàng (Lab/Test)](#uc3-02)
- [UC3.03 — Đề xuất phương án điều trị (Treatment)](#uc3-03)
- [UC3.04 — Rà soát an toàn thuốc (MedSafety)](#uc3-04)
- [UC3.05 — Kiểm tra đầu vào và điều kiện áp dụng](#uc3-05)
- [UC3.06 — Xem kết quả, căn cứ và cảnh báo](#uc3-06)
- [UC3.07 — Xem lại các lần hỗ trợ](#uc3-07)
- [UC3.08 — Yêu cầu đánh giá lại](#uc3-08)

### Nhóm 4. Quản lý kết luận và kế hoạch điều trị (9 Use Case)

- [UC4.01 — Ghi, xác nhận kết luận và hướng xử trí](#uc4-01)
- [UC4.02 — Xem xét và phản hồi gợi ý hỗ trợ](#uc4-02)
- [UC4.03 — Lập, sửa dự thảo kế hoạch điều trị](#uc4-03)
- [UC4.04 — Lập phương án thuốc và yêu cầu rà soát](#uc4-04)
- [UC4.05 — Lập kế hoạch theo dõi và tái khám](#uc4-05)
- [UC4.06 — Xác nhận kế hoạch điều trị](#uc4-06)
- [UC4.07 — Điều chỉnh kế hoạch đã xác nhận](#uc4-07)
- [UC4.08 — Công bố kết quả và kế hoạch điều trị](#uc4-08)
- [UC4.09 — Cập nhật hoặc thu hồi nội dung đã công bố](#uc4-09)

### Nhóm 5. Hỗ trợ bệnh nhân ngoại trú (6 Use Case)

- [UC5.01 — Đặt lịch khám](#uc5-01)
- [UC5.02 — Xem lịch khám và trạng thái](#uc5-02)
- [UC5.03 — Xem kết quả và kế hoạch đã công bố](#uc5-03)
- [UC5.04 — Nhận và xem thông báo](#uc5-04)
- [UC5.05 — Nhận nhắc lịch khám](#uc5-05)
- [UC5.06 — Nhận nhắc thuốc theo kế hoạch](#uc5-06)

### Nhóm 6. Quản trị hệ thống và dữ liệu dùng chung (10 Use Case)

- [UC6.01 — Đăng ký tài khoản bệnh nhân](#uc6-01)
- [UC6.02 — Đăng nhập, đăng xuất](#uc6-02)
- [UC6.03 — Cập nhật thông tin tài khoản](#uc6-03)
- [UC6.04 — Khôi phục truy cập tài khoản](#uc6-04)
- [UC6.05 — Quản lý tài khoản người dùng](#uc6-05)
- [UC6.06 — Quản lý vai trò và quyền truy cập](#uc6-06)
- [UC6.07 — Quản lý danh mục dùng chung](#uc6-07)
- [UC6.08 — Quản lý thiết lập và phiên bản áp dụng](#uc6-08)
- [UC6.09 — Tra cứu nhật ký hệ thống](#uc6-09)
- [UC6.10 — Mở đúng bệnh án/lượt khám từ HIS/EMR](#uc6-10)

## 4. Nhóm 1 — Hồ sơ bệnh án và lượt khám

<a id="uc1-01"></a>

### UC1.01 — Tra cứu hồ sơ bệnh án

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.01 — Tra cứu hồ sơ bệnh án |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Người dùng đã đăng nhập và có quyền tra cứu trong phạm vi được giao. |
| **Luồng chính** | **1.** Người dùng nhập mã hồ sơ, số định danh cá nhân khi có hoặc thông tin người bệnh.<br>**2.** Hệ thống tìm các hồ sơ phù hợp trong phạm vi được phép xem.<br>**3.** Người dùng đối chiếu thông tin và chọn hồ sơ.<br>**4.** Hệ thống hiển thị thông tin hồ sơ và các lượt khám liên quan. |
| **Luồng thay thế** | **2a.** Không có kết quả: thông báo không tìm thấy; người dùng sửa tiêu chí hoặc chuyển [UC1.02](#uc1-02) nếu có quyền.<br>**3a.** Có nhiều hồ sơ phù hợp: yêu cầu đối chiếu thêm thông tin, chưa tự chọn một hồ sơ. |
| **Hậu điều kiện** | Hiển thị đúng hồ sơ được phép xem; việc tra cứu không tự mở hoặc bắt đầu lượt khám. |

<a id="uc1-02"></a>

### UC1.02 — Tạo hồ sơ bệnh án

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.02 — Tạo hồ sơ bệnh án |
| **Actor chính** | Nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền tạo hồ sơ; đã tra cứu nhưng chưa xác định được hồ sơ hiện có. |
| **Luồng chính** | **1.** Người dùng nhập thông tin hành chính theo biểu mẫu, gồm số định danh nếu đã có.<br>**2.** Hệ thống kiểm tra dữ liệu và các hồ sơ có dấu hiệu trùng.<br>**3.** Người dùng đối chiếu, bổ sung thông tin và yêu cầu tạo hồ sơ mới.<br>**4.** Hệ thống cấp mã hồ sơ nội bộ, lưu người/thời điểm tạo và hiển thị hồ sơ. |
| **Luồng thay thế** | **2a.** Số định danh đã gắn hồ sơ hoặc có nghi vấn trùng: yêu cầu đối chiếu; chuyển dùng hồ sơ có sẵn khi xác minh phù hợp.<br>**2b.** Chưa có số định danh hoặc dữ liệu chuyên môn: cho để trống theo biểu mẫu; chỉ yêu cầu bổ sung các trường hành chính bắt buộc. |
| **Hậu điều kiện** | Tạo một hồ sơ có mã nội bộ để bổ sung thông tin và liên kết các lượt khám; chưa tự tạo kết luận hoặc quyền xem cho tài khoản bệnh nhân. |

<a id="uc1-03"></a>

### UC1.03 — Cập nhật thông tin hành chính

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.03 — Cập nhật thông tin hành chính |
| **Actor chính** | Nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền cập nhật và đã chọn đúng hồ sơ. |
| **Luồng chính** | **1.** Người dùng mở thông tin hành chính của hồ sơ.<br>**2.** Người dùng bổ sung hoặc sửa thông tin cần thiết.<br>**3.** Hệ thống kiểm tra dữ liệu, dấu hiệu trùng và xung đột với liên kết định danh hiện có.<br>**4.** Người dùng lưu; hệ thống cập nhật, giữ mã hồ sơ và lịch sử thay đổi. |
| **Luồng thay thế** | **3a.** Thông tin không hợp lệ: chỉ rõ trường cần sửa, quay lại bước 2.<br>**3b.** Thay đổi định danh gây trùng hoặc mâu thuẫn liên kết: giữ dữ liệu hiện tại, yêu cầu xác minh theo quyền trước khi cập nhật. |
| **Hậu điều kiện** | Thông tin hành chính được cập nhật có dấu vết; dữ liệu chuyên môn và các liên kết chưa được xác minh không bị tự thay thế. |

<a id="uc1-04"></a>

### UC1.04 — Liên kết tài khoản bệnh nhân với bệnh án

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.04 — Liên kết tài khoản bệnh nhân với bệnh án |
| **Actor chính** | Nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền liên kết; có tài khoản bệnh nhân và hồ sơ cần đối chiếu. |
| **Luồng chính** | **1.** Người dùng chọn tài khoản và hồ sơ bệnh án cần liên kết.<br>**2.** Hệ thống hiển thị thông tin đối chiếu và tình trạng liên kết hiện có.<br>**3.** Người dùng xác minh chủ tài khoản với hồ sơ theo cách đã thống nhất và xác nhận liên kết.<br>**4.** Hệ thống lưu liên kết, người/thời điểm thực hiện và cấp phạm vi xem tương ứng. |
| **Luồng thay thế** | **2a.** Có liên kết mâu thuẫn: dừng thay thế và yêu cầu người có quyền xử lý; CCCD nhập đơn lẻ không đủ để tự liên kết.<br>**3a.** Chưa đủ bằng chứng hoặc thông tin không khớp: giữ chờ xác minh, chưa cấp quyền xem. |
| **Hậu điều kiện** | Tài khoản đã xác minh được liên kết đúng hồ sơ và chỉ xem nội dung được công bố; không tạo một bệnh án chuyên môn thứ hai. |

<a id="uc1-05"></a>

### UC1.05 — Quản lý khung giờ khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.05 — Quản lý khung giờ khám |
| **Actor chính** | Nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền quản lý khung giờ của đơn vị khám. |
| **Luồng chính** | **1.** Người dùng chọn cơ sở/đơn vị khám và khoảng ngày cần quản lý.<br>**2.** Hệ thống hiển thị khung giờ, sức chứa và số lịch đã xác nhận.<br>**3.** Người dùng tạo hoặc cập nhật khung giờ và sức chứa.<br>**4.** Hệ thống kiểm tra, lưu thay đổi và cập nhật khả năng đặt lịch tại quầy và trên app. |
| **Luồng thay thế** | **4a.** Khung giờ hoặc sức chứa không hợp lệ: báo lý do, quay lại bước 3.<br>**4b.** Thay đổi ảnh hưởng lịch đã xác nhận: chỉ rõ các lịch liên quan và yêu cầu xử lý theo quy tắc lịch; chưa tự hủy hoặc làm vượt sức chứa. |
| **Hậu điều kiện** | Khung giờ hợp lệ được dùng chung cho các kênh đặt lịch; lịch đã xác nhận được bảo toàn cho đến khi có xử lý phù hợp. |

<a id="uc1-06"></a>

### UC1.06 — Quản lý lịch hẹn tại quầy

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.06 — Quản lý lịch hẹn tại quầy |
| **Actor chính** | Nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền quản lý lịch; có khung giờ của đơn vị khám. |
| **Luồng chính** | **1.** Người dùng tra cứu hoặc nhập thông tin người bệnh để tạo/cập nhật lịch hẹn.<br>**2.** Hệ thống hiển thị lịch liên quan và các khung giờ còn chỗ.<br>**3.** Người dùng chọn thời gian, kiểm tra thông tin và yêu cầu lưu thay đổi.<br>**4.** Hệ thống kiểm tra lại sức chứa, lưu mã/trạng thái lịch và phản ánh trên các kênh. |
| **Luồng thay thế** | **1a.** Cần đổi hoặc hủy lịch: cập nhật theo quyền và điều kiện lịch; điều chỉnh các nhắc tương lai liên quan theo [UC5.05](#uc5-05).<br>**4a.** Khung giờ đã hết chỗ: chưa xác nhận lịch, yêu cầu chọn lại tại bước 2. |
| **Hậu điều kiện** | Lịch hẹn tại quầy được lưu nhất quán với app; đặt lịch chưa tự tạo lượt khám. |

<a id="uc1-07"></a>

### UC1.07 — Tiếp nhận và mở lượt khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.07 — Tiếp nhận và mở lượt khám |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền tiếp nhận; người bệnh đến khám và có thể xác định hồ sơ phù hợp. |
| **Luồng chính** | **1.** Người dùng chọn hồ sơ và kiểm tra thông tin cá nhân, lịch hẹn nếu có.<br>**2.** Hệ thống hiển thị các lượt liên quan để đối chiếu, tránh mở trùng.<br>**3.** Người dùng xác nhận tiếp nhận và yêu cầu mở hoặc liên kết lượt phù hợp.<br>**4.** Hệ thống lưu lượt với đúng hồ sơ và trạng thái chờ/đang xử lý theo thao tác được phép. |
| **Luồng thay thế** | **1a.** Chưa có hồ sơ: tạo qua [UC1.02](#uc1-02) theo quyền rồi quay lại đối chiếu.<br>**2a.** Đã có lượt phù hợp: sử dụng lượt đó sau đối chiếu; thông tin mơ hồ thì chưa mở hoặc gắn thêm lượt. |
| **Hậu điều kiện** | Có lượt khám đúng hồ sơ để cập nhật nội dung khám; chỉ mở hồ sơ để xem không làm bắt đầu lượt. |

<a id="uc1-08"></a>

### UC1.08 — Cập nhật dữ liệu lâm sàng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.08 — Cập nhật dữ liệu lâm sàng |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền nhập và đã chọn đúng bệnh án/lượt hoặc mốc thời gian cần ghi. |
| **Luồng chính** | **1.** Người dùng mở phần thông tin lâm sàng của bệnh án đang xử lý.<br>**2.** Người dùng ghi bệnh sử, triệu chứng, sinh hiệu, tiền sử, dị ứng và thuốc; bổ sung đánh giá lão khoa khi phù hợp.<br>**3.** Hệ thống kiểm tra dữ liệu và chỉ rõ thông tin chưa có, chưa đánh giá hoặc không hợp lệ.<br>**4.** Người dùng lưu; hệ thống ghi người/thời điểm và đánh dấu kết quả hỗ trợ liên quan cần xem lại nếu dữ liệu thay đổi. |
| **Luồng thay thế** | **2a.** Đánh giá không áp dụng hoặc chưa thực hiện: ghi đúng trạng thái theo biểu mẫu, không bắt mọi bệnh nhân làm đánh giá lão khoa.<br>**3a.** Dữ liệu chưa hợp lệ: chỉ rõ trường cần sửa; phần thiếu được giữ đúng trạng thái, không tự điền bình thường. |
| **Hậu điều kiện** | Dữ liệu lâm sàng được lưu trong cùng bệnh án để các module dùng chung; nhập dữ liệu chưa tự tạo kết luận đã xác nhận. |

<a id="uc1-09"></a>

### UC1.09 — Ghi nhận chỉ định cận lâm sàng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.09 — Ghi nhận chỉ định cận lâm sàng |
| **Actor chính** | Bác sĩ; nhân viên y tế có quyền nhập chỉ định đã được bác sĩ quyết định. |
| **Tiền điều kiện** | Đã đăng nhập, chọn đúng lượt được phép cập nhật; có quyết định chỉ định của bác sĩ. |
| **Luồng chính** | **1.** Người dùng mở phần chỉ định của lượt khám.<br>**2.** Người dùng chọn xét nghiệm/thăm dò và nhập nội dung chỉ định theo quyết định bác sĩ.<br>**3.** Hệ thống kiểm tra thông tin và hiển thị để đối chiếu với chỉ định đã có.<br>**4.** Người dùng lưu; hệ thống ghi chỉ định vào bệnh án, phân biệt người nhập và bác sĩ quyết định. |
| **Luồng thay thế** | **2a.** Mới có gợi ý Lab/Test: bác sĩ phải xem xét và quyết định trước khi ghi thành chỉ định.<br>**3a.** Thiếu thông tin bắt buộc hoặc không rõ quyết định bác sĩ: yêu cầu bổ sung, chưa lưu như chỉ định chính thức. |
| **Hậu điều kiện** | Chỉ định được ghi đúng lượt và thẩm quyền; chưa đồng nghĩa đã thực hiện xét nghiệm hoặc đã gửi lệnh sang LIS/RIS. |

<a id="uc1-10"></a>

### UC1.10 — Ghi nhận kết quả cận lâm sàng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.10 — Ghi nhận kết quả cận lâm sàng |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền nhập kết quả và có kết quả thực hiện từ nguồn xác định. |
| **Luồng chính** | **1.** Người dùng chọn đúng bệnh án, lượt khám và chỉ định liên quan khi có.<br>**2.** Người dùng nhập kết quả thực hiện, nguồn, thời điểm và đơn vị khi phù hợp.<br>**3.** Hệ thống kiểm tra cách biểu diễn, thông tin thiếu và quan hệ với kết quả đã có.<br>**4.** Người dùng lưu; hệ thống giữ lịch sử và đánh dấu các lần hỗ trợ bị ảnh hưởng cần xem lại. |
| **Luồng thay thế** | **3a.** Thiếu nguồn, đơn vị bắt buộc hoặc dữ liệu không hợp lệ: yêu cầu bổ sung, không dùng phần lỗi như kết quả hợp lệ.<br>**3b.** Là bản sửa của kết quả cũ: lưu quan hệ thay thế và lịch sử; dữ liệu nhận tự động từ viện đi qua [UC2.01](#uc2-01). |
| **Hậu điều kiện** | Kết quả thực hiện được lưu có nguồn và thời gian để đánh giá lại; gợi ý xét nghiệm không được ghi thành kết quả đo. |

<a id="uc1-11"></a>

### UC1.11 — Tra cứu lịch sử khám và điều trị

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.11 — Tra cứu lịch sử khám và điều trị |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền xem và đã chọn đúng hồ sơ. |
| **Luồng chính** | **1.** Người dùng mở lịch sử khám và điều trị.<br>**2.** Hệ thống hiển thị các lượt/đợt và thông tin theo thời gian.<br>**3.** Người dùng chọn lượt hoặc nội dung cần đối chiếu.<br>**4.** Hệ thống hiển thị dữ liệu, thuốc, kết luận và kế hoạch với thời điểm/phiên bản tương ứng. |
| **Luồng thay thế** | **2a.** Chưa có lịch sử: thông báo chưa có dữ liệu, giữ nguyên hồ sơ.<br>**4a.** Dữ liệu nội trú chưa được cung cấp: chỉ hiển thị liên kết/tóm tắt hiện có, không suy ra diễn biến điều trị chi tiết. |
| **Hậu điều kiện** | Người dùng xem được lịch sử trong phạm vi quyền; dữ liệu cũ được phân biệt với nội dung hiện hành. |

<a id="uc1-12"></a>

### UC1.12 — Hoàn tất lượt khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.12 — Hoàn tất lượt khám |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền hoàn tất và chọn đúng lượt chưa hoàn tất. |
| **Luồng chính** | **1.** Người dùng yêu cầu hoàn tất lượt khám.<br>**2.** Hệ thống kiểm tra dữ liệu đã lưu và các nội dung bắt buộc đã được xác nhận theo quy tắc của lượt.<br>**3.** Hệ thống hiển thị kết quả kiểm tra; người dùng xác nhận hoàn tất khi đủ điều kiện.<br>**4.** Hệ thống cập nhật trạng thái hoàn tất, ghi người/thời điểm và lưu lịch sử. |
| **Luồng thay thế** | **2a.** Còn dữ liệu chưa lưu hoặc thiếu xác nhận bắt buộc: nêu phần cần xử lý, giữ trạng thái hiện tại.<br>**3a.** Người dùng hủy hoặc lượt đã thay đổi: chưa hoàn tất, yêu cầu xem lại trạng thái mới khi cần. |
| **Hậu điều kiện** | Lượt đủ điều kiện được hoàn tất; hồ sơ vẫn dùng cho các lần tiếp theo. Xác nhận chuyên môn, công bố và ghi trả có trạng thái riêng. |

## 5. Nhóm 2 — Tích hợp và tiền xử lý dữ liệu

<a id="uc2-01"></a>

### UC2.01 — Tiếp nhận dữ liệu viện vào hồ sơ bệnh án

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.01 — Tiếp nhận dữ liệu viện vào hồ sơ bệnh án |
| **Actor chính** | HIS/EMR, LIS hoặc PACS/RIS cung cấp dữ liệu; dùng nguồn mô phỏng khi demo. |
| **Tiền điều kiện** | Nguồn gửi đã được cho phép; có dữ liệu cần tiếp nhận và bộ quy tắc kiểm tra/đối chiếu áp dụng. |
| **Luồng chính** | **1.** Nguồn gửi dữ liệu; hệ thống kiểm tra nguồn và lưu mã tham chiếu, thời điểm cùng dữ liệu gốc hoặc tham chiếu nguồn.<br>**2.** Hệ thống đọc dữ liệu và kiểm tra hợp lệ, phần thiếu theo [UC2.03](#uc2-03).<br>**3.** Hệ thống đối chiếu người bệnh và lượt/đợt theo [UC2.02](#uc2-02).<br>**4.** Hệ thống chuẩn hóa theo [UC2.04](#uc2-04), kiểm soát trùng và bản sửa theo [UC2.05](#uc2-05).<br>**5.** Hệ thống cập nhật phần đủ điều kiện vào đúng bệnh án, giữ nguồn/phiên bản và ghi kết quả tiếp nhận. |
| **Luồng thay thế** | **2a.** Không đọc được hoặc có dữ liệu sai: ghi rõ lỗi; phần lỗi chưa được cập nhật như dữ liệu hợp lệ.<br>**3a.** Không xác định được đúng hồ sơ/lượt: giữ chờ đối chiếu, không tự chọn hồ sơ hoặc tạo trùng.<br>**4a.** Chưa có quy tắc chuyển đổi hoặc bản sửa mâu thuẫn: giữ chờ xử lý; dữ liệu trùng được ghi nhận mà không nhân bản. |
| **Hậu điều kiện** | Dữ liệu đủ điều kiện có mặt trong đúng bệnh án với nguồn và lịch sử; dữ liệu chờ/lỗi có trạng thái riêng. Không bắt buộc một ca có đủ cả ba nhóm nguồn. |

<a id="uc2-02"></a>

### UC2.02 — Đối chiếu hồ sơ và lượt khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.02 — Đối chiếu hồ sơ và lượt khám |
| **Actor chính** | Kế thừa tác nhân của [UC2.01](#uc2-01); đây là hành vi được bao gồm, không có người khởi tạo độc lập. |
| **Tiền điều kiện** | Dữ liệu đã đọc được; có thông tin định danh nguồn và liên kết đã xác minh để đối chiếu khi có. |
| **Luồng chính** | **1.** Hệ thống lấy mã người bệnh, mã lượt/đợt và số định danh có trong dữ liệu nguồn.<br>**2.** Hệ thống tìm liên kết đã xác minh và hồ sơ/lượt phù hợp.<br>**3.** Hệ thống kiểm tra tính nhất quán giữa người bệnh, lượt/đợt và nguồn.<br>**4.** Hệ thống trả kết quả đối chiếu để [UC2.01](#uc2-01) tiếp tục hoặc giữ chờ. |
| **Luồng thay thế** | **2a.** Không khớp hoặc có nhiều khả năng: giữ chờ người có quyền xác minh, chưa gắn dữ liệu.<br>**3a.** Mã lượt thuộc người bệnh khác hoặc liên kết mâu thuẫn: báo lỗi, không tự tạo hồ sơ mới để bỏ qua xung đột. |
| **Hậu điều kiện** | Có liên kết đúng hồ sơ/lượt hoặc trạng thái chờ/lỗi rõ ràng; không gắn dữ liệu khi còn mơ hồ. |

<a id="uc2-03"></a>

### UC2.03 — Kiểm tra dữ liệu hợp lệ và dữ liệu thiếu

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.03 — Kiểm tra dữ liệu hợp lệ và dữ liệu thiếu |
| **Actor chính** | Kế thừa tác nhân của [UC2.01](#uc2-01); đây là hành vi được bao gồm. |
| **Tiền điều kiện** | Đã nhận dữ liệu nguồn và có đặc tả kiểm tra áp dụng cho loại dữ liệu đó. |
| **Luồng chính** | **1.** Hệ thống kiểm tra cấu trúc và khả năng đọc dữ liệu.<br>**2.** Hệ thống kiểm tra kiểu, trường bắt buộc, giá trị và đơn vị theo đặc tả.<br>**3.** Hệ thống phân biệt hợp lệ, không hợp lệ, chưa có và không áp dụng.<br>**4.** Hệ thống trả kết quả kiểm tra và danh sách lỗi/thiếu cho [UC2.01](#uc2-01). |
| **Luồng thay thế** | **1a.** Không đọc được cấu trúc: ghi lỗi và dừng xử lý phần dữ liệu đó.<br>**2a.** Sai hoặc thiếu dữ liệu: chỉ rõ trường và mức ảnh hưởng theo quy tắc; không thay phần thiếu bằng 0 hoặc giá trị bình thường. |
| **Hậu điều kiện** | Phần đủ điều kiện được nhận diện; phần lỗi/thiếu được giữ đúng trạng thái để xử lý tiếp, chưa tự kết luận lâm sàng. |

<a id="uc2-04"></a>

### UC2.04 — Chuẩn hóa dữ liệu

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.04 — Chuẩn hóa dữ liệu |
| **Actor chính** | Kế thừa tác nhân của [UC2.01](#uc2-01); đây là hành vi được bao gồm. |
| **Tiền điều kiện** | Có dữ liệu đủ điều kiện chuyển đổi và bộ ánh xạ/đơn vị/ngày giờ được phép áp dụng. |
| **Luồng chính** | **1.** Hệ thống xác định trường, mã, đơn vị và thời gian của dữ liệu nguồn.<br>**2.** Hệ thống chọn quy tắc chuẩn hóa tương ứng.<br>**3.** Hệ thống chuyển sang cách biểu diễn chung và giữ giá trị gốc, nguồn, phiên bản quy tắc.<br>**4.** Hệ thống kiểm tra dữ liệu sau chuyển đổi và trả kết quả cho [UC2.01](#uc2-01). |
| **Luồng thay thế** | **2a.** Không có hoặc có nhiều quy tắc mâu thuẫn: giữ chờ xử lý, không tự suy phép đổi.<br>**3a.** Dữ liệu đã đúng cách biểu diễn: kiểm tra rồi giữ nguyên; giá trị bất thường không được sửa thành bình thường. |
| **Hậu điều kiện** | Có dữ liệu chuẩn hóa truy được nguồn/quy tắc hoặc trạng thái chờ rõ ràng; chỉ phần đủ điều kiện được dùng để cập nhật bệnh án. |

<a id="uc2-05"></a>

### UC2.05 — Kiểm soát dữ liệu trùng và bản sửa

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.05 — Kiểm soát dữ liệu trùng và bản sửa |
| **Actor chính** | Kế thừa tác nhân của [UC2.01](#uc2-01); đây là hành vi được bao gồm. |
| **Tiền điều kiện** | Có dữ liệu nguồn, mã tham chiếu và lịch sử tiếp nhận để đối chiếu. |
| **Luồng chính** | **1.** Hệ thống xác định mã nguồn, đối tượng dữ liệu và thông tin phiên bản nếu có.<br>**2.** Hệ thống đối chiếu với các lần đã xử lý.<br>**3.** Hệ thống phân loại dữ liệu mới, dữ liệu trùng hoặc bản sửa có quan hệ xác định.<br>**4.** Hệ thống trả cách xử lý cho [UC2.01](#uc2-01) và lưu dấu vết đối chiếu. |
| **Luồng thay thế** | **3a.** Nhận lại đúng dữ liệu đã xử lý: ghi nhận lần nhận, không tạo bản bệnh án/kết quả thứ hai.<br>**3b.** Bản sửa không xác định được quan hệ hoặc mâu thuẫn phiên bản: giữ chờ; bản sửa đủ điều kiện phải giữ bản cũ và quan hệ thay thế. |
| **Hậu điều kiện** | Dữ liệu mới/bản sửa được xử lý có lịch sử; không coi bản đến sau luôn là bản đúng hoặc tạo trùng vì nhận lại. |

<a id="uc2-06"></a>

### UC2.06 — Ghi trả dữ liệu đã xác nhận

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.06 — Ghi trả dữ liệu đã xác nhận |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế có quyền ghi trả; HIS/EMR là hệ thống nhận. |
| **Tiền điều kiện** | Có nội dung đã được bác sĩ xác nhận và cho phép ghi trả; có liên kết hồ sơ/lượt và đích nhận hợp lệ. |
| **Luồng chính** | **1.** Người dùng yêu cầu ghi trả hoặc hệ thống nhận sự kiện ghi trả được cho phép sau xác nhận.<br>**2.** Hệ thống kiểm tra đúng bệnh án, phạm vi nội dung, phiên bản đã xác nhận và quyền gửi.<br>**3.** Hệ thống gửi đến HIS/EMR, giữ mã tham chiếu và phiên bản nội dung gửi.<br>**4.** Hệ thống nhận phản hồi và ghi trạng thái theo bằng chứng từ đích. |
| **Luồng thay thế** | **2a.** Là dự thảo, sai phiên bản hoặc chưa được phép gửi: từ chối ghi trả, nêu lý do.<br>**4a.** Đích từ chối: ghi lỗi/phản hồi để xử lý theo [UC2.09](#uc2-09).<br>**4b.** Thiếu phản hồi hoặc phản hồi chưa chứng minh đã lưu: ghi chưa rõ kết quả, kiểm tra qua [UC2.08](#uc2-08) trước khi gửi lại. |
| **Hậu điều kiện** | Có lần ghi trả truy được nội dung, đích, tham chiếu và kết quả. Xác nhận của bác sĩ không bị trình bày như bằng chứng HIS đã tiếp nhận; demo dùng đích mô phỏng. |

<a id="uc2-07"></a>

### UC2.07 — Tra cứu lịch sử gửi và nhận dữ liệu

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.07 — Tra cứu lịch sử gửi và nhận dữ liệu |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền tra lịch sử gửi/nhận trong phạm vi được giao. |
| **Luồng chính** | **1.** Người dùng chọn hồ sơ/lượt hoặc nhập tham chiếu, nguồn/đích, thời gian và trạng thái.<br>**2.** Hệ thống tìm các lần gửi/nhận được phép xem.<br>**3.** Người dùng chọn một lần trao đổi dữ liệu.<br>**4.** Hệ thống hiển thị trạng thái, phản hồi/lỗi và lịch sử xử lý liên quan. |
| **Luồng thay thế** | **2a.** Không có kết quả: thông báo và cho sửa điều kiện tra cứu.<br>**4a.** Dữ liệu chi tiết vượt quyền xem: chỉ cung cấp phần được phép, không tự cho quyền sửa hoặc gửi lại. |
| **Hậu điều kiện** | Tra được lịch sử phù hợp quyền; việc tra cứu không làm gửi lại dữ liệu hoặc thay đổi nội dung chuyên môn. |

<a id="uc2-08"></a>

### UC2.08 — Kiểm tra kết quả ghi trả dữ liệu

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.08 — Kiểm tra kết quả ghi trả dữ liệu |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế có quyền kiểm tra; HIS/EMR cung cấp tình trạng tại đích. |
| **Tiền điều kiện** | Có lần ghi trả và mã tham chiếu cần kiểm tra; người dùng có quyền hoặc có yêu cầu đối soát được cho phép. |
| **Luồng chính** | **1.** Người dùng yêu cầu kiểm tra lần ghi trả đã chọn.<br>**2.** Hệ thống truy vấn hoặc đối chiếu bằng chứng tại đích theo tham chiếu.<br>**3.** Hệ thống phân biệt đã tiếp nhận đúng nội dung, bị từ chối hoặc chưa rõ kết quả.<br>**4.** Hệ thống lưu bằng chứng và hiển thị tình trạng cùng hướng xử lý tiếp. |
| **Luồng thay thế** | **2a.** Đích chưa truy cập được hoặc chưa có bằng chứng đủ: giữ chưa rõ kết quả, không coi là chắc chắn thất bại.<br>**3a.** Đích đã nhận đúng bản: cập nhật trạng thái phù hợp, không gửi thêm một bản trùng; dữ liệu mâu thuẫn thì giữ chờ xử lý. |
| **Hậu điều kiện** | Tình trạng ghi trả được cập nhật theo bằng chứng; thao tác kiểm tra không tự gửi lại hoặc sửa nội dung đã xác nhận. |

<a id="uc2-09"></a>

### UC2.09 — Xử lý lại trao đổi dữ liệu bị lỗi

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.09 — Xử lý lại trao đổi dữ liệu bị lỗi |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền xử lý lại; có lần gửi/nhận bị lỗi và nguyên nhân đã được xem xét. |
| **Luồng chính** | **1.** Người dùng chọn lần bị lỗi và xem nguyên nhân, tham chiếu cùng các lần thử trước.<br>**2.** Người dùng khắc phục phần được phép; nếu nội dung chuyên môn đổi, phải có phiên bản/xác nhận tương ứng.<br>**3.** Hệ thống kiểm tra điều kiện xử lý lại; ghi trả chưa rõ kết quả phải kiểm tra qua [UC2.08](#uc2-08) trước.<br>**4.** Hệ thống xử lý lại qua luồng nhận [UC2.01](#uc2-01) hoặc gửi [UC2.06](#uc2-06), giữ lịch sử và kiểm soát trùng. |
| **Luồng thay thế** | **3a.** Nguyên nhân chưa khắc phục hoặc chưa đủ quyền/xác nhận: chưa xử lý lại, nêu việc còn thiếu.<br>**3b.** Đích đã lưu: cập nhật kết quả đối soát, không gửi trùng; vẫn chưa rõ thì giữ chờ.<br>**4a.** Tiếp tục lỗi: lưu kết quả lần thử mới và nguyên nhân, giữ các lần trước. |
| **Hậu điều kiện** | Có kết quả xử lý lại cùng lịch sử đầy đủ; không tạo bản trùng hoặc biến nội dung chuyên môn chưa xác nhận thành bản chính thức. |

## 6. Nhóm 3 — Hỗ trợ chuyên môn AI-CDSS

<a id="uc3-01"></a>

### UC3.01 — Hỗ trợ chẩn đoán (Diagnosis)

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.01 — Hỗ trợ chẩn đoán (Diagnosis) |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền hỗ trợ chẩn đoán cho bệnh án/lượt đang chọn; có dữ liệu bệnh án để kiểm tra. |
| **Luồng chính** | **1.** Bác sĩ yêu cầu hỗ trợ chẩn đoán cho ca đang xem.<br>**2.** Hệ thống tập hợp dữ liệu và kiểm tra đầu vào/điều kiện áp dụng qua [UC3.05](#uc3-05).<br>**3.** Diagnosis tạo nhận định, phân loại và các đầu ra được hỗ trợ theo quy tắc/phương pháp áp dụng.<br>**4.** Hệ thống lưu lần hỗ trợ, dữ liệu/phiên bản đã dùng, căn cứ và cảnh báo; hiển thị cho bác sĩ xem xét. |
| **Luồng thay thế** | **2a.** Thiếu dữ liệu hoặc ngoài điều kiện áp dụng: chỉ rõ giới hạn, chỉ tạo phần kết quả được phép hoặc thông báo chưa đánh giá được.<br>**3a.** Module lỗi hoặc hết thời gian: báo chưa đánh giá được, giữ dữ liệu đã nhập; không hiển thị như kết quả bình thường. |
| **Hậu điều kiện** | Có kết quả hỗ trợ hoặc trạng thái chưa đánh giá được; kết quả liên quan có thể dùng ở module sau, chưa là kết luận bác sĩ. Dự báo nguy cơ chỉ áp dụng khi có phương pháp và kiểm định phù hợp. |

<a id="uc3-02"></a>

### UC3.02 — Gợi ý cận lâm sàng (Lab/Test)

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.02 — Gợi ý cận lâm sàng (Lab/Test) |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, chọn đúng ca và có quyền yêu cầu Lab/Test; có dữ liệu bệnh án và các kết quả hỗ trợ liên quan khi có. |
| **Luồng chính** | **1.** Bác sĩ yêu cầu gợi ý cận lâm sàng.<br>**2.** Hệ thống lấy dữ liệu bệnh án, kết quả Diagnosis liên quan và xét nghiệm đã có, kiểm tra qua [UC3.05](#uc3-05).<br>**3.** Lab/Test đề xuất xét nghiệm/thăm dò, lý do và mức ưu tiên theo quy tắc áp dụng.<br>**4.** Hệ thống lưu lần hỗ trợ và hiển thị gợi ý để bác sĩ xem xét; chỉ định bác sĩ quyết định được ghi qua [UC1.09](#uc1-09). |
| **Luồng thay thế** | **2a.** Thiếu dữ liệu hoặc kết quả liên quan cần xem lại: nêu phần thiếu/phiên bản, không tự giả lập chỉ số.<br>**3a.** Đã có xét nghiệm: xét thời điểm và điều kiện sử dụng; không chặn xét nghiệm lặp chỉ vì đã từng làm.<br>**3b.** Module lỗi hoặc ngoài phạm vi: báo chưa đánh giá được, không tự phát chỉ định sang LIS/RIS. |
| **Hậu điều kiện** | Gợi ý có căn cứ/giới hạn được lưu; gợi ý chưa là chỉ định và không phải kết quả thực hiện. Kết quả thực đo mới được nhận qua [UC1.10](#uc1-10) hoặc [UC2.01](#uc2-01). |

<a id="uc3-03"></a>

### UC3.03 — Đề xuất phương án điều trị (Treatment)

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.03 — Đề xuất phương án điều trị (Treatment) |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền yêu cầu Treatment cho ca đang chọn; có dữ liệu bệnh án để kiểm tra. |
| **Luồng chính** | **1.** Bác sĩ yêu cầu đề xuất phương án điều trị.<br>**2.** Hệ thống tập hợp bệnh cảnh, phân loại, kết quả thực đo, bệnh đồng mắc, thuốc và các kết quả liên quan; kiểm tra qua [UC3.05](#uc3-05).<br>**3.** Treatment tạo phương án gợi ý cùng điều kiện cá thể hóa, yêu cầu theo dõi và giới hạn áp dụng.<br>**4.** Hệ thống lưu lần hỗ trợ và hiển thị để bác sĩ cân nhắc khi lập dự thảo qua [UC4.03](#uc4-03). |
| **Luồng thay thế** | **2a.** Chỉ có gợi ý xét nghiệm nhưng chưa có kết quả cần thiết: ghi thiếu dữ liệu thực đo, không dùng gợi ý như một giá trị đo.<br>**3a.** Chưa đủ điều kiện, ngoài phạm vi hoặc module lỗi: chỉ trả phần được phép kèm giới hạn hoặc báo chưa đánh giá được. |
| **Hậu điều kiện** | Có phương án hỗ trợ hoặc thông báo giới hạn; chưa tự tạo kế hoạch chính thức, đơn thuốc, lịch hẹn hay nhắc thuốc. |

<a id="uc3-04"></a>

### UC3.04 — Rà soát an toàn thuốc (MedSafety)

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.04 — Rà soát an toàn thuốc (MedSafety) |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền rà soát; có phương án thuốc và bệnh án/lượt liên quan để đối chiếu. |
| **Luồng chính** | **1.** Bác sĩ yêu cầu MedSafety rà soát phương án thuốc đang xem.<br>**2.** Hệ thống tập hợp thuốc đề xuất, thuốc đang dùng, dị ứng, bệnh đồng mắc và xét nghiệm; kiểm tra qua [UC3.05](#uc3-05).<br>**3.** MedSafety kiểm tra tương tác, chống chỉ định, trùng lặp, liều và nguy cơ theo quy tắc áp dụng.<br>**4.** Hệ thống lưu lần rà soát gắn đúng phiên bản thuốc/dữ liệu; hiển thị yếu tố liên quan, mức cảnh báo, căn cứ và gợi ý xử lý khi có. |
| **Luồng thay thế** | **2a.** Thiếu dữ liệu ảnh hưởng kiểm tra: nêu phần chưa đánh giá; không kết luận toàn bộ phương án an toàn.<br>**3a.** Phát hiện nguy cơ: hiển thị cảnh báo để bác sĩ xử lý, không tự ngừng/đổi thuốc hoặc đổi liều.<br>**3b.** Module lỗi hoặc chưa hỗ trợ tình huống: báo chưa đánh giá được, bảo toàn phương án đã nhập. |
| **Hậu điều kiện** | Có kết quả rà soát và giới hạn theo đúng phiên bản; không có cảnh báo chỉ có nghĩa không phát hiện trong phạm vi kiểm tra được, chưa thay quyết định bác sĩ. |

<a id="uc3-05"></a>

### UC3.05 — Kiểm tra đầu vào và điều kiện áp dụng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.05 — Kiểm tra đầu vào và điều kiện áp dụng |
| **Actor chính** | Kế thừa tác nhân của [UC3.01](#uc3-01)–[UC3.04](#uc3-04); đây là hành vi kiểm tra được bao gồm. |
| **Tiền điều kiện** | Có yêu cầu hỗ trợ, module đích và bộ điều kiện áp dụng/đầu vào tương ứng. |
| **Luồng chính** | **1.** Hệ thống xác định module, ca bệnh và phiên bản dữ liệu sẽ dùng.<br>**2.** Hệ thống kiểm tra đối tượng áp dụng, dữ liệu bắt buộc, đơn vị và thời điểm sử dụng theo đặc tả.<br>**3.** Hệ thống xác định phần đủ điều kiện, dữ liệu thiếu/sai và kết quả trước cần xem lại.<br>**4.** Hệ thống trả trạng thái được đánh giá, đánh giá có giới hạn hoặc chưa đánh giá được cho module gọi. |
| **Luồng thay thế** | **2a.** Ngoài đối tượng hoặc thiếu dữ liệu bắt buộc: nêu nguyên nhân, không tạo kết quả vượt điều kiện áp dụng.<br>**2b.** Chưa xác định được quy tắc áp dụng: báo chưa hỗ trợ; dữ liệu thiếu không được suy thành giá trị bình thường. |
| **Hậu điều kiện** | Module nhận được đầu vào và giới hạn rõ ràng; kiểm tra không tự bổ sung dữ liệu lâm sàng chưa có hoặc mở quyền truy cập mới. |

<a id="uc3-06"></a>

### UC3.06 — Xem kết quả, căn cứ và cảnh báo

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.06 — Xem kết quả, căn cứ và cảnh báo |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền xem kết quả hỗ trợ của bệnh án/lượt được chọn. |
| **Luồng chính** | **1.** Người dùng chọn module và lần hỗ trợ cần xem.<br>**2.** Hệ thống kiểm tra quyền và lấy kết quả cùng dữ liệu/phiên bản liên quan.<br>**3.** Hệ thống hiển thị gợi ý, căn cứ, cảnh báo, phần thiếu và trạng thái đánh giá.<br>**4.** Người dùng xem chi tiết để đối chiếu; bác sĩ có thể phản hồi qua [UC4.02](#uc4-02). |
| **Luồng thay thế** | **2a.** Chưa có kết quả hoặc lần chạy lỗi: hiển thị đúng trạng thái, không trình bày như đã đánh giá thành công.<br>**3a.** Dữ liệu liên quan đã thay đổi: chỉ rõ kết quả cần xem lại và cho yêu cầu [UC3.08](#uc3-08) theo quyền. |
| **Hậu điều kiện** | Kết quả được xem với căn cứ và giới hạn; thao tác xem không tự chấp nhận gợi ý hoặc xác nhận kế hoạch. |

<a id="uc3-07"></a>

### UC3.07 — Xem lại các lần hỗ trợ

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.07 — Xem lại các lần hỗ trợ |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền xem lịch sử hỗ trợ của bệnh án/lượt. |
| **Luồng chính** | **1.** Người dùng mở lịch sử hỗ trợ và chọn module hoặc thời gian cần xem.<br>**2.** Hệ thống liệt kê các lần chạy với thời điểm, trạng thái và phiên bản áp dụng.<br>**3.** Người dùng chọn một lần hỗ trợ.<br>**4.** Hệ thống hiển thị kết quả, đầu vào hoặc tham chiếu phiên bản, căn cứ/cảnh báo và phản hồi bác sĩ khi có. |
| **Luồng thay thế** | **2a.** Chưa có lần hỗ trợ: thông báo chưa có lịch sử.<br>**4a.** Lần chạy dùng dữ liệu/quy tắc cũ: ghi rõ phiên bản và thời điểm, không trình bày như kết quả hiện hành. |
| **Hậu điều kiện** | Tra được lần hỗ trợ cùng nguồn gốc; lịch sử cũ được bảo toàn và không tự kích hoạt đánh giá lại. |

<a id="uc3-08"></a>

### UC3.08 — Yêu cầu đánh giá lại

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.08 — Yêu cầu đánh giá lại |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền yêu cầu đánh giá lại; có ca bệnh và module/lần hỗ trợ cần xem xét lại. |
| **Luồng chính** | **1.** Người dùng chọn ca, module và yêu cầu đánh giá lại.<br>**2.** Hệ thống lấy dữ liệu hiện hành, kể cả kết quả thực hiện mới và đầu ra liên quan; kiểm tra qua [UC3.05](#uc3-05).<br>**3.** Hệ thống thực hiện lần đánh giá mới theo module được yêu cầu và phạm vi quyền.<br>**4.** Hệ thống lưu lần chạy mới, giữ lịch sử cũ và hiển thị phần kết quả/kế hoạch dự thảo cần bác sĩ xem lại. |
| **Luồng thay thế** | **2a.** Chưa đủ dữ liệu hoặc ngoài điều kiện: chỉ trả phần được phép hoặc thông báo chưa đánh giá được.<br>**3a.** Module lỗi hoặc hết thời gian: ghi trạng thái lần thử, giữ dữ liệu và kết quả cũ có nhãn thời điểm.<br>**4a.** Kế hoạch đã xác nhận chịu ảnh hưởng: bác sĩ xem xét điều chỉnh qua [UC4.07](#uc4-07), không tự sửa quyết định đã xác nhận. |
| **Hậu điều kiện** | Có lần đánh giá mới hoặc trạng thái lỗi/giới hạn; xác định đúng phiên bản hỗ trợ bác sĩ xem, không ghi đè lịch sử hoặc tự thay kế hoạch. |

## 7. Nhóm 4 — Quản lý kết luận và kế hoạch điều trị

<a id="uc4-01"></a>

### UC4.01 — Ghi, xác nhận kết luận và hướng xử trí

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.01 — Ghi, xác nhận kết luận và hướng xử trí |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền xác nhận chuyên môn và chọn đúng bệnh án/lượt đang xử lý. |
| **Luồng chính** | **1.** Bác sĩ xem dữ liệu khám, kết quả thực hiện và hỗ trợ liên quan.<br>**2.** Bác sĩ ghi kết luận hoặc tình trạng chưa đủ bằng chứng, cùng hướng xử trí phù hợp.<br>**3.** Hệ thống kiểm tra quyền, dữ liệu/phiên bản liên quan và nội dung cần bổ sung theo quy tắc.<br>**4.** Bác sĩ xác nhận; hệ thống lưu vào đúng bệnh án/lượt, ghi bác sĩ, thời điểm và lịch sử. |
| **Luồng thay thế** | **2a.** Chưa đủ bằng chứng: ghi rõ tình trạng đó và hướng xử trí bác sĩ quyết định, không ép thành chẩn đoán xác định.<br>**3a.** Thiếu điều kiện hoặc dữ liệu đã đổi: chỉ rõ nguyên nhân, yêu cầu xem lại trước xác nhận. |
| **Hậu điều kiện** | Kết luận/hướng xử trí do bác sĩ xác nhận được lưu trong bệnh án; nhập viện/chuyển tuyến chỉ ghi hướng hoặc tóm tắt, không triển khai quy trình nội trú chi tiết. |

<a id="uc4-02"></a>

### UC4.02 — Xem xét và phản hồi gợi ý hỗ trợ

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.02 — Xem xét và phản hồi gợi ý hỗ trợ |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền phản hồi và có gợi ý/lần hỗ trợ xác định để xem xét. |
| **Luồng chính** | **1.** Bác sĩ mở gợi ý cùng dữ liệu, căn cứ và cảnh báo liên quan.<br>**2.** Bác sĩ chọn chấp nhận, điều chỉnh hoặc từ chối gợi ý.<br>**3.** Bác sĩ ghi nội dung quyết định và lý do khi quy định yêu cầu.<br>**4.** Hệ thống lưu phản hồi gắn với đúng gợi ý, lần hỗ trợ, người và thời điểm. |
| **Luồng thay thế** | **1a.** Gợi ý cần xem lại do dữ liệu đổi: hiển thị cảnh báo; bác sĩ xem xét đánh giá lại qua [UC3.08](#uc3-08).<br>**3a.** Thiếu nội dung/lý do bắt buộc: yêu cầu bổ sung, chưa ghi nhận phản hồi hoàn tất. |
| **Hậu điều kiện** | Có phản hồi truy được phiên bản; chấp nhận gợi ý không tự xác nhận toàn bộ kế hoạch và không tự trở thành nhãn đúng để huấn luyện mô hình. |

<a id="uc4-03"></a>

### UC4.03 — Lập, sửa dự thảo kế hoạch điều trị

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.03 — Lập, sửa dự thảo kế hoạch điều trị |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền lập/sửa dự thảo và chọn đúng bệnh án/lượt. |
| **Luồng chính** | **1.** Người dùng mở dự thảo hiện có hoặc bắt đầu dự thảo kế hoạch.<br>**2.** Hệ thống hiển thị dữ liệu bệnh án, quyết định và gợi ý Treatment liên quan.<br>**3.** Người dùng lập/sửa phương án, hướng dẫn, thuốc và nội dung theo dõi phù hợp; sử dụng [UC4.04](#uc4-04), [UC4.05](#uc4-05) khi cần.<br>**4.** Hệ thống kiểm tra và lưu phiên bản dự thảo, giữ người/thời điểm cùng phần hỗ trợ cần xem lại. |
| **Luồng thay thế** | **1a.** Kế hoạch đã xác nhận: chuyển [UC4.07](#uc4-07) nếu có quyền, không sửa trực tiếp bản chính thức.<br>**4a.** Dữ liệu sai hoặc có xung đột sửa đồng thời: chỉ rõ nguyên nhân, yêu cầu bổ sung/xem bản mới trước lưu. |
| **Hậu điều kiện** | Dự thảo được lưu trong bệnh án để bác sĩ xem và xác nhận qua [UC4.06](#uc4-06); gợi ý AI hoặc thao tác lưu chưa làm kế hoạch thành chính thức. |

<a id="uc4-04"></a>

### UC4.04 — Lập phương án thuốc và yêu cầu rà soát

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.04 — Lập phương án thuốc và yêu cầu rà soát |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền lập phương án thuốc và có dự thảo kế hoạch của đúng ca. |
| **Luồng chính** | **1.** Người dùng nhập/sửa thuốc, liều, cách dùng và thông tin liên quan trong dự thảo.<br>**2.** Hệ thống kiểm tra thông tin và lưu phiên bản phương án thuốc.<br>**3.** Bác sĩ yêu cầu rà soát; hệ thống chuyển đúng phiên bản sang MedSafety theo [UC3.04](#uc3-04).<br>**4.** Hệ thống hiển thị cảnh báo, dữ liệu thiếu và trạng thái rà soát để bác sĩ xem xét trước xác nhận. |
| **Luồng thay thế** | **2a.** Thông tin không hợp lệ: chỉ rõ nội dung cần sửa; chưa có kết quả rà soát cho bản chưa đủ điều kiện.<br>**3a.** Module lỗi hoặc thiếu dữ liệu: hiển thị chưa/không đánh giá được phần tương ứng, giữ dự thảo.<br>**4a.** Thuốc/liều hoặc dữ liệu ảnh hưởng thay đổi: đánh dấu cần rà soát lại, không dùng kết quả cũ như kết quả cho bản mới. |
| **Hậu điều kiện** | Phương án thuốc và trạng thái rà soát gắn đúng phiên bản được lưu; bác sĩ quyết định thay đổi và xác nhận, hệ thống không tự sửa đơn. |

<a id="uc4-05"></a>

### UC4.05 — Lập kế hoạch theo dõi và tái khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.05 — Lập kế hoạch theo dõi và tái khám |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền nhập kế hoạch và có dự thảo của đúng bệnh án/lượt. |
| **Luồng chính** | **1.** Người dùng mở phần theo dõi và tái khám trong kế hoạch điều trị.<br>**2.** Người dùng ghi nội dung theo dõi, hướng dẫn, mốc hoặc điều kiện tái khám theo quyết định bác sĩ.<br>**3.** Hệ thống kiểm tra cách biểu diễn, thời gian và phần thông tin cần bổ sung.<br>**4.** Người dùng lưu nội dung vào dự thảo để bác sĩ xem và xác nhận cùng kế hoạch. |
| **Luồng thay thế** | **1a.** Muốn sửa kế hoạch đã xác nhận: chuyển [UC4.07](#uc4-07) theo quyền.<br>**3a.** Chưa xác định ngày cụ thể: lưu mốc dự kiến/điều kiện theo quyết định, không tạo một lịch hẹn đã xác nhận. |
| **Hậu điều kiện** | Nội dung theo dõi/tái khám là một phần của kế hoạch điều trị; việc đặt khung giờ thực hiện qua [UC1.06](#uc1-06) hoặc [UC5.01](#uc5-01), không tự phát sinh từ gợi ý Treatment. |

<a id="uc4-06"></a>

### UC4.06 — Xác nhận kế hoạch điều trị

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.06 — Xác nhận kế hoạch điều trị |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền xác nhận cho đúng bệnh án/lượt; có phiên bản dự thảo đã lưu để xem xét. |
| **Luồng chính** | **1.** Bác sĩ mở dự thảo; hệ thống hiển thị nội dung, dữ liệu liên quan, cảnh báo và phần chưa đánh giá.<br>**2.** Bác sĩ xem xét và yêu cầu xác nhận phiên bản đang xem.<br>**3.** Hệ thống kiểm tra quyền, phiên bản hiện hành và các điều kiện xác nhận đã quy định.<br>**4.** Hệ thống lưu bản được bác sĩ xác nhận, người/thời điểm và lịch sử; thông báo thành công. |
| **Luồng thay thế** | **2a.** Cần chỉnh sửa: quay về [UC4.03](#uc4-03) hoặc [UC4.04](#uc4-04), xem lại nội dung và rà soát phần bị ảnh hưởng trước xác nhận.<br>**3a.** Thiếu điều kiện hoặc phiên bản đã thay đổi: nêu nguyên nhân, giữ chưa xác nhận và yêu cầu xem lại.<br>**4a.** Lưu thất bại hoặc chưa rõ đã lưu: không báo thành công; kiểm tra trạng thái trước khi thử lại. |
| **Hậu điều kiện** | Bản kế hoạch cụ thể được xác nhận trong đúng bệnh án/lượt và có dấu vết; trạng thái công bố cho bệnh nhân và tiếp nhận tại HIS/EMR được theo dõi riêng. |

<a id="uc4-07"></a>

### UC4.07 — Điều chỉnh kế hoạch đã xác nhận

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.07 — Điều chỉnh kế hoạch đã xác nhận |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền điều chỉnh; có kế hoạch đã xác nhận cần xem xét lại. |
| **Luồng chính** | **1.** Bác sĩ mở kế hoạch hiện hành, chọn điều chỉnh và ghi lý do.<br>**2.** Hệ thống tạo dự thảo phiên bản điều chỉnh, giữ bản đã xác nhận trước đó.<br>**3.** Bác sĩ sửa nội dung và xem lại dữ liệu/cảnh báo; yêu cầu rà soát lại phần bị ảnh hưởng khi cần.<br>**4.** Bác sĩ xác nhận phiên bản mới qua [UC4.06](#uc4-06); hệ thống xác định bản hiện hành theo hiệu lực được phép. |
| **Luồng thay thế** | **3a.** Bác sĩ hủy hoặc lưu để làm tiếp: giữ bản điều chỉnh ở trạng thái dự thảo, chưa thay bản hiện hành.<br>**4a.** Chưa đủ điều kiện hoặc xung đột phiên bản: giữ dự thảo, xử lý theo [UC4.06](#uc4-06); chưa thay thế bản chính thức. |
| **Hậu điều kiện** | Bản điều chỉnh đủ điều kiện được xác nhận và giữ lịch sử; ghi trả, công bố và nhắc tương lai phải xét đúng phiên bản/hiệu lực được phép, không tự coi đã gửi hoặc công bố xong. |

<a id="uc4-08"></a>

### UC4.08 — Công bố kết quả và kế hoạch điều trị

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.08 — Công bố kết quả và kế hoạch điều trị |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền công bố; có nội dung đã xác nhận và đủ điều kiện cung cấp cho bệnh nhân. |
| **Luồng chính** | **1.** Người dùng chọn bệnh án/lượt và phần kết quả, kế hoạch thuốc, hướng dẫn/theo dõi được phép công bố.<br>**2.** Hệ thống kiểm tra phiên bản đã xác nhận, đối tượng nhận và phạm vi nội dung.<br>**3.** Người dùng xem trước và xác nhận công bố.<br>**4.** Hệ thống lưu phạm vi/phiên bản công bố, người/thời điểm và cho tài khoản liên kết hợp lệ xem theo [UC5.03](#uc5-03). |
| **Luồng thay thế** | **2a.** Nội dung là dự thảo, vượt phạm vi hoặc chưa đủ điều kiện: từ chối công bố phần đó, nêu lý do.<br>**4a.** Chưa có tài khoản liên kết hợp lệ: lưu nội dung công bố theo hồ sơ, chưa cấp quyền đọc cho tài khoản; việc truy cập chờ [UC1.04](#uc1-04). |
| **Hậu điều kiện** | Nội dung đủ điều kiện có trạng thái công bố riêng; không lộ ghi chú nội bộ/dự thảo. Trạng thái xác nhận bác sĩ và ghi trả HIS/EMR vẫn được hiển thị riêng. |

<a id="uc4-09"></a>

### UC4.09 — Cập nhật hoặc thu hồi nội dung đã công bố

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.09 — Cập nhật hoặc thu hồi nội dung đã công bố |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền cập nhật/thu hồi và xác định được nội dung đã công bố. |
| **Luồng chính** | **1.** Người dùng chọn nội dung cần thay thế hoặc thu hồi và ghi lý do.<br>**2.** Hệ thống kiểm tra quyền, phiên bản và điều kiện của bản thay thế khi có.<br>**3.** Người dùng xem phạm vi ảnh hưởng và xác nhận thao tác.<br>**4.** Hệ thống cập nhật trạng thái công bố, giữ lịch sử và phản ánh phần được xem/nhắc tương lai theo phiên bản, hiệu lực được phép. |
| **Luồng thay thế** | **2a.** Bản thay thế chưa xác nhận hoặc chưa đủ điều kiện: chưa công bố bản thay thế; thu hồi chỉ thực hiện nếu người dùng yêu cầu và có quyền.<br>**4a.** Thao tác thất bại: giữ trạng thái đã lưu gần nhất và thông báo kết quả, không báo thu hồi thành công khi chưa thực hiện. |
| **Hậu điều kiện** | Bản bị thu hồi không còn được truy cập như nội dung công bố; lịch sử bệnh án vẫn giữ. Thu hồi hiển thị không tự là quyết định ngừng thuốc; nhắc xét kế hoạch hiện hành được phép. |

## 8. Nhóm 5 — Hỗ trợ bệnh nhân ngoại trú

<a id="uc5-01"></a>

### UC5.01 — Đặt lịch khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC5.01 — Đặt lịch khám |
| **Actor chính** | Bệnh nhân. |
| **Tiền điều kiện** | Bệnh nhân đăng nhập bằng tài khoản hợp lệ; có khung giờ khám được mở cho kênh app. |
| **Luồng chính** | **1.** Bệnh nhân nhập/kiểm tra thông tin cơ bản, chọn khám mới/tái khám và cơ sở/đơn vị phù hợp.<br>**2.** Hệ thống hiển thị ngày và khung giờ còn chỗ.<br>**3.** Bệnh nhân chọn khung giờ, kiểm tra thông tin và yêu cầu đặt lịch.<br>**4.** Hệ thống kiểm tra lại sức chứa, lưu lịch và hiển thị mã/trạng thái để bệnh nhân theo dõi. |
| **Luồng thay thế** | **1a.** Thiếu thông tin bắt buộc: yêu cầu bổ sung; chưa có dữ liệu chuyên môn không bị xem là đã có kết quả khám.<br>**4a.** Chỗ cuối đã được người khác đặt: chưa xác nhận vượt sức chứa, yêu cầu chọn khung giờ khác.<br>**4b.** Gửi yêu cầu lặp hoặc mất phản hồi: kiểm tra lịch đã tạo trước khi tạo thêm, hiển thị đúng kết quả được lưu. |
| **Hậu điều kiện** | Lịch hẹn được lưu dùng chung với quầy; chưa tự mở lượt hoặc cấp quyền xem bệnh án. Không mặc định có thanh toán hay chọn bác sĩ khi chưa chốt. |

<a id="uc5-02"></a>

### UC5.02 — Xem lịch khám và trạng thái

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC5.02 — Xem lịch khám và trạng thái |
| **Actor chính** | Bệnh nhân. |
| **Tiền điều kiện** | Bệnh nhân đã đăng nhập; hệ thống xác định được các lịch thuộc tài khoản. |
| **Luồng chính** | **1.** Bệnh nhân mở danh sách lịch khám.<br>**2.** Hệ thống lấy các lịch của bệnh nhân và trạng thái hiện tại.<br>**3.** Bệnh nhân chọn lịch cần xem.<br>**4.** Hệ thống hiển thị thời gian, cơ sở/đơn vị, mã lịch và trạng thái/thay đổi liên quan. |
| **Luồng thay thế** | **2a.** Chưa có lịch: thông báo và cho chuyển [UC5.01](#uc5-01).<br>**4a.** Lịch đã thay đổi hoặc hủy: hiển thị trạng thái hiện tại, không trình bày lịch cũ như còn hiệu lực. |
| **Hậu điều kiện** | Bệnh nhân xem đúng lịch của mình; thao tác xem chưa tự xác nhận đã đến khám hoặc mở lượt. |

<a id="uc5-03"></a>

### UC5.03 — Xem kết quả và kế hoạch đã công bố

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC5.03 — Xem kết quả và kế hoạch đã công bố |
| **Actor chính** | Bệnh nhân. |
| **Tiền điều kiện** | Bệnh nhân đã đăng nhập và tài khoản đã được xác minh liên kết với hồ sơ theo [UC1.04](#uc1-04). |
| **Luồng chính** | **1.** Bệnh nhân mở lịch sử khám và chọn lượt/nội dung muốn xem.<br>**2.** Hệ thống kiểm tra liên kết, quyền hiện hành và phạm vi đã công bố theo [UC4.08](#uc4-08).<br>**3.** Hệ thống hiển thị kết quả, kế hoạch thuốc, hướng dẫn và theo dõi/tái khám được phép xem.<br>**4.** Bệnh nhân xem chi tiết với ngày khám, thời điểm áp dụng và dấu hiệu nhận biết kế hoạch hiện hành/bản cũ. |
| **Luồng thay thế** | **2a.** Chưa công bố hoặc liên kết/quyền không hợp lệ: không cung cấp nội dung, hướng dẫn xử lý phù hợp.<br>**3a.** Nội dung đã thu hồi/thay thế: áp dụng quyền và bản công bố hiện tại, không cho mở lại bản bị thu hồi qua liên kết cũ. |
| **Hậu điều kiện** | Bệnh nhân xem đúng phần được phép, phân biệt kế hoạch hiện hành; không được sửa dữ liệu lâm sàng hoặc xem dự thảo/ghi chú nội bộ. |

<a id="uc5-04"></a>

### UC5.04 — Nhận và xem thông báo

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC5.04 — Nhận và xem thông báo |
| **Actor chính** | Bệnh nhân. |
| **Tiền điều kiện** | Có sự kiện thông báo được chọn và người nhận hợp lệ; bệnh nhân đăng nhập khi mở danh sách/nội dung. |
| **Luồng chính** | **1.** Hệ thống nhận sự kiện liên quan lịch khám, công bố kết quả hoặc thay đổi kế hoạch.<br>**2.** Hệ thống xác định người nhận, tạo thông báo theo kênh áp dụng và tránh lặp cùng sự kiện.<br>**3.** Bệnh nhân mở danh sách hoặc thông báo nhận được.<br>**4.** Hệ thống kiểm tra quyền hiện hành trước khi mở nội dung, hiển thị và cập nhật trạng thái đọc phù hợp. |
| **Luồng thay thế** | **2a.** Kênh gửi lỗi: ghi đúng trạng thái tạo/gửi, không báo thiết bị đã nhận khi chưa có bằng chứng.<br>**4a.** Nội dung liên quan đã thu hồi hoặc người dùng mất quyền: chỉ hiển thị thông tin được phép, không mở lại nội dung cũ. |
| **Hậu điều kiện** | Thông báo đúng người có trạng thái phù hợp; đã đọc không chứng minh đã thực hiện hướng dẫn hoặc đã uống thuốc. |

<a id="uc5-05"></a>

### UC5.05 — Nhận nhắc lịch khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC5.05 — Nhận nhắc lịch khám |
| **Actor chính** | Bệnh nhân. |
| **Tiền điều kiện** | Có lịch hẹn đã xác nhận, người nhận hợp lệ và thời điểm/kênh nhắc được thiết lập. |
| **Luồng chính** | **1.** Hệ thống tạo nhắc tương lai từ lịch hẹn đã xác nhận.<br>**2.** Đến thời điểm nhắc, hệ thống kiểm tra lại lịch hiện hành, người nhận và hiệu lực nhắc.<br>**3.** Hệ thống gửi/hiển thị nhắc lịch theo kênh áp dụng, ghi đúng trạng thái.<br>**4.** Bệnh nhân mở nhắc để xem lịch hiện tại qua [UC5.02](#uc5-02). |
| **Luồng thay thế** | **2a.** Lịch đã đổi hoặc hủy: cập nhật/hủy nhắc tương lai tương ứng, không nhắc theo lịch cũ.<br>**3a.** Gửi thất bại hoặc chưa rõ kết quả: ghi đúng tình trạng và xử lý theo chính sách kênh, tránh tạo nhắc trùng. |
| **Hậu điều kiện** | Nhắc gắn đúng lịch hiện hành và trạng thái kênh kiểm thử; nhận nhắc không đồng nghĩa đã đến khám. |

<a id="uc5-06"></a>

### UC5.06 — Nhận nhắc thuốc theo kế hoạch

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC5.06 — Nhận nhắc thuốc theo kế hoạch |
| **Actor chính** | Bệnh nhân. |
| **Tiền điều kiện** | Có kế hoạch thuốc hiện hành đã xác nhận, được phép cung cấp, người nhận hợp lệ và đủ thông tin thời điểm dùng. |
| **Luồng chính** | **1.** Hệ thống lấy thuốc/lịch dùng từ phiên bản kế hoạch đủ điều kiện và tạo các nhắc tương lai.<br>**2.** Đến thời điểm nhắc, hệ thống kiểm tra lại phiên bản/hiệu lực kế hoạch, người nhận và điều kiện cung cấp.<br>**3.** Hệ thống gửi/hiển thị nhắc theo kênh áp dụng, ghi trạng thái thực hiện.<br>**4.** Bệnh nhân mở nhắc và xem kế hoạch thuốc đang được phép cung cấp. |
| **Luồng thay thế** | **1a.** Thiếu lịch dùng đủ rõ: báo cần bổ sung, chưa tạo nhắc cho phần đó và không tự suy giờ uống.<br>**2a.** Kế hoạch đổi/ngừng hoặc không còn đủ điều kiện cung cấp: cập nhật/hủy nhắc tương lai phù hợp, không nhắc theo bản cũ.<br>**3a.** Kênh gửi lỗi: ghi đúng tình trạng, không báo đã nhận hoặc đã uống thuốc. |
| **Hậu điều kiện** | Nhắc dựa trên kế hoạch/hiệu lực hiện hành được phép; không tự thay thuốc, xác nhận tuân thủ hoặc tạo nhật ký uống thuốc. |

## 9. Nhóm 6 — Quản trị hệ thống và dữ liệu dùng chung

<a id="uc6-01"></a>

### UC6.01 — Đăng ký tài khoản bệnh nhân

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.01 — Đăng ký tài khoản bệnh nhân |
| **Actor chính** | Bệnh nhân, thuộc tác nhân Người dùng trên sơ đồ. |
| **Tiền điều kiện** | Chức năng đăng ký đang được cung cấp; người đăng ký có thông tin để thực hiện cách xác minh được hỗ trợ. |
| **Luồng chính** | **1.** Bệnh nhân chọn đăng ký và nhập thông tin tài khoản theo biểu mẫu.<br>**2.** Hệ thống kiểm tra dữ liệu và khả năng tài khoản đã tồn tại.<br>**3.** Bệnh nhân thực hiện bước xác minh theo phương thức được áp dụng.<br>**4.** Hệ thống tạo/kích hoạt tài khoản bệnh nhân khi đủ điều kiện và thông báo kết quả. |
| **Luồng thay thế** | **2a.** Thông tin sai hoặc tài khoản đã tồn tại: nêu hướng xử lý, cho đăng nhập/khôi phục thay vì tạo trùng.<br>**3a.** Chưa xác minh được: chưa kích hoạt quyền cần xác minh, hướng dẫn thực hiện lại theo phương thức áp dụng. |
| **Hậu điều kiện** | Có tài khoản bệnh nhân đúng trạng thái; chưa có quyền xem bệnh án cho đến khi liên kết được xác minh qua [UC1.04](#uc1-04), không tự cấp vai trò nhân viên/bác sĩ. |

<a id="uc6-02"></a>

### UC6.02 — Đăng nhập, đăng xuất

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.02 — Đăng nhập, đăng xuất |
| **Actor chính** | Người dùng. |
| **Tiền điều kiện** | Khi đăng nhập: có tài khoản/phương thức xác thực được hỗ trợ. Khi đăng xuất: có phiên đang sử dụng. |
| **Luồng chính** | **1.** Người dùng chọn đăng nhập và cung cấp thông tin theo phương thức áp dụng.<br>**2.** Hệ thống xác thực, kiểm tra trạng thái tài khoản và quyền hiện hành.<br>**3.** Hệ thống tạo phiên hợp lệ theo quyền được cấp.<br>**4.** Hệ thống hiển thị các chức năng được phép để người dùng bắt đầu sử dụng. |
| **Luồng thay thế** | **1a.** Người dùng chọn đăng xuất từ phiên đang sử dụng: hệ thống kết thúc phiên, trở về màn hình truy cập và yêu cầu xác thực lại cho thao tác được bảo vệ.<br>**2a.** Xác thực thất bại hoặc tài khoản bị khóa: từ chối tạo phiên, thông báo phù hợp.<br>**3a.** Phiên hết hiệu lực: yêu cầu xác thực lại, chưa thực hiện thao tác được bảo vệ. |
| **Hậu điều kiện** | Đăng nhập thành công có phiên theo đúng quyền; đăng xuất kết thúc phiên. Đã đăng nhập không tự có quyền xem mọi hồ sơ. |

<a id="uc6-03"></a>

### UC6.03 — Cập nhật thông tin tài khoản

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.03 — Cập nhật thông tin tài khoản |
| **Actor chính** | Người dùng. |
| **Tiền điều kiện** | Đã đăng nhập và được phép cập nhật các trường cá nhân của tài khoản mình. |
| **Luồng chính** | **1.** Người dùng mở thông tin tài khoản.<br>**2.** Người dùng sửa các trường được phép.<br>**3.** Hệ thống kiểm tra dữ liệu và yêu cầu xác minh lại khi thay đổi thuộc trường cần xác minh.<br>**4.** Hệ thống lưu phần đủ điều kiện và ghi lịch sử thay đổi. |
| **Luồng thay thế** | **2a.** Yêu cầu đổi vai trò, quyền hoặc liên kết bệnh án ngoài phạm vi tự sửa: chuyển quy trình có thẩm quyền, chưa áp dụng thay đổi.<br>**3a.** Dữ liệu không hợp lệ hoặc chưa xác minh được: chỉ rõ phần chưa được cập nhật. |
| **Hậu điều kiện** | Thông tin tài khoản được cập nhật đúng quyền; không tự ghi đè thông tin bệnh án hoặc thay đổi liên kết/chức danh lâm sàng. |

<a id="uc6-04"></a>

### UC6.04 — Khôi phục truy cập tài khoản

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.04 — Khôi phục truy cập tài khoản |
| **Actor chính** | Người dùng; người hỗ trợ có quyền tham gia nếu phương thức áp dụng yêu cầu. |
| **Tiền điều kiện** | Có yêu cầu khôi phục tài khoản và một phương thức xác minh được hỗ trợ. |
| **Luồng chính** | **1.** Người dùng yêu cầu khôi phục truy cập.<br>**2.** Hệ thống hoặc người hỗ trợ có quyền thực hiện xác minh qua kênh/bằng chứng phù hợp với tài khoản.<br>**3.** Khi xác minh đạt yêu cầu, hệ thống cho thực hiện bước khôi phục theo phương thức áp dụng.<br>**4.** Hệ thống ghi kết quả/nhật ký và hướng dẫn đăng nhập lại. |
| **Luồng thay thế** | **2a.** Thiếu bằng chứng hoặc chỉ có CCCD/mã hồ sơ: chưa cho khôi phục hay đổi liên kết, hướng dẫn xác minh thêm.<br>**3a.** Tài khoản do nguồn xác thực khác quản lý: chuyển đúng cách khôi phục của nguồn, không tự đặt lại thông tin xác thực của nguồn đó. |
| **Hậu điều kiện** | Khôi phục đúng tài khoản khi đủ bằng chứng; không tự mở khóa, đổi quyền hoặc đổi liên kết bệnh án vượt thẩm quyền. |

<a id="uc6-05"></a>

### UC6.05 — Quản lý tài khoản người dùng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.05 — Quản lý tài khoản người dùng |
| **Actor chính** | Người quản trị được phân quyền cho công việc tương ứng. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền quản lý tài khoản trong phạm vi được giao. |
| **Luồng chính** | **1.** Người quản trị tra cứu tài khoản hoặc chọn cấp tài khoản nhân viên.<br>**2.** Hệ thống hiển thị thông tin và trạng thái được phép quản lý.<br>**3.** Người quản trị tạo/cập nhật, khóa hoặc mở khóa theo thẩm quyền.<br>**4.** Hệ thống kiểm tra, lưu trạng thái và áp dụng kiểm soát truy cập theo chính sách phiên, ghi nhật ký. |
| **Luồng thay thế** | **3a.** Tài khoản do nguồn ngoài quản lý: xử lý phạm vi quyền của sản phẩm theo chính sách, không tự sửa nguồn xác thực bên ngoài.<br>**4a.** Thông tin trùng, sai hoặc vượt thẩm quyền: từ chối phần thay đổi và nêu lý do. |
| **Hậu điều kiện** | Tài khoản có trạng thái đúng thẩm quyền; tài khoản khóa bị chặn theo chính sách. Cấp tài khoản không tự đủ để xác nhận chuyên môn. |

<a id="uc6-06"></a>

### UC6.06 — Quản lý vai trò và quyền truy cập

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.06 — Quản lý vai trò và quyền truy cập |
| **Actor chính** | Người quản trị được phân quyền cho công việc tương ứng. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền thiết lập/cấp/thu hồi quyền trong phạm vi quản trị. |
| **Luồng chính** | **1.** Người quản trị chọn vai trò hoặc người dùng cần quản lý quyền.<br>**2.** Hệ thống hiển thị quyền thao tác và phạm vi hồ sơ hiện có.<br>**3.** Người quản trị thiết lập, cấp, thay đổi hoặc thu hồi quyền theo công việc được giao.<br>**4.** Hệ thống kiểm tra thẩm quyền, lưu thay đổi và áp dụng với các yêu cầu tiếp theo theo chính sách phiên, ghi nhật ký. |
| **Luồng thay thế** | **4a.** Cấp quyền vượt thẩm quyền hoặc không hợp lệ: từ chối và giữ cấu hình quyền trước đó.<br>**4b.** Phiên/màn hình cũ còn mở sau thu hồi: yêu cầu mới phải kiểm tra quyền hiện hành cả ở giao tiếp dữ liệu và tệp. |
| **Hậu điều kiện** | Quyền và phạm vi hồ sơ được cập nhật có dấu vết; quyền kỹ thuật không mặc nhiên là quyền bác sĩ xác nhận chuyên môn. |

<a id="uc6-07"></a>

### UC6.07 — Quản lý danh mục dùng chung

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.07 — Quản lý danh mục dùng chung |
| **Actor chính** | Người quản trị được phân quyền cho công việc tương ứng. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền quản lý danh mục; nội dung chuyên môn có nguồn và cách rà soát phù hợp. |
| **Luồng chính** | **1.** Người quản trị chọn danh mục thuốc, xét nghiệm, đơn vị đo, cơ sở/khoa hoặc mã ánh xạ.<br>**2.** Hệ thống hiển thị các mục, trạng thái và phiên bản khi có.<br>**3.** Người quản trị thêm/sửa hoặc ngừng sử dụng mục theo thẩm quyền, kèm nguồn chuyên môn khi cần.<br>**4.** Hệ thống kiểm tra và lưu nội dung đủ điều kiện áp dụng, giữ lịch sử tham chiếu. |
| **Luồng thay thế** | **3a.** Ngừng mã đã được dùng: không cho chọn mới sau khi ngừng, vẫn đọc được dữ liệu lịch sử.<br>**4a.** Mã trùng, ánh xạ mâu thuẫn hoặc nội dung chuyên môn chưa được rà soát: chưa cho áp dụng, nêu lý do. |
| **Hậu điều kiện** | Danh mục đủ điều kiện được dùng thống nhất; sửa danh mục không tự viết lại dữ liệu lịch sử hoặc phê duyệt quy tắc lâm sàng mới. |

<a id="uc6-08"></a>

### UC6.08 — Quản lý thiết lập và phiên bản áp dụng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.08 — Quản lý thiết lập và phiên bản áp dụng |
| **Actor chính** | Người quản trị được phân quyền cho công việc tương ứng. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền quản lý thiết lập tương ứng; phiên bản chuyên môn phải đủ thẩm quyền rà soát trước áp dụng. |
| **Luồng chính** | **1.** Người quản trị chọn thiết lập kết nối, chính sách nhắc hoặc phiên bản quy tắc/mô hình.<br>**2.** Hệ thống hiển thị giá trị/phiên bản hiện hành và phạm vi áp dụng.<br>**3.** Người quản trị nhập thay đổi, chọn phiên bản đủ điều kiện và yêu cầu áp dụng.<br>**4.** Hệ thống kiểm tra, lưu người/thời điểm và phiên bản áp dụng; các lần xử lý sau dùng đúng thiết lập được phép. |
| **Luồng thay thế** | **3a.** Cần trở lại phiên bản cũ: chỉ chọn bản còn được phép, lưu một thay đổi mới; không xóa lịch sử áp dụng.<br>**4a.** Thiết lập sai hoặc phiên bản chưa được rà soát/cho phép: chưa áp dụng, giữ cấu hình đang hợp lệ. |
| **Hậu điều kiện** | Có thiết lập/phiên bản áp dụng truy được lịch sử; kết quả cũ giữ thông tin phiên bản đã dùng. Phản hồi bác sĩ không tự kích hoạt huấn luyện lại. |

<a id="uc6-09"></a>

### UC6.09 — Tra cứu nhật ký hệ thống

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.09 — Tra cứu nhật ký hệ thống |
| **Actor chính** | Người quản trị được phân quyền cho công việc tương ứng. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền tra nhật ký trong phạm vi được giao; có sự kiện được hệ thống ghi nhận. |
| **Luồng chính** | **1.** Người quản trị chọn tiêu chí theo người, thời gian, thao tác hoặc đối tượng.<br>**2.** Hệ thống tìm các sự kiện được phép xem.<br>**3.** Người quản trị chọn sự kiện cần kiểm tra.<br>**4.** Hệ thống hiển thị thao tác, kết quả, thay đổi trước/sau và tham chiếu gửi/nhận khi có, che phần không được phép. |
| **Luồng thay thế** | **2a.** Không có kết quả: thông báo và cho sửa điều kiện tra cứu.<br>**4a.** Chi tiết có dữ liệu nhạy cảm vượt quyền: giới hạn hiển thị; không lộ mật khẩu, mã xác thực hoặc bệnh án ngoài phạm vi. |
| **Hậu điều kiện** | Tra được sự kiện phù hợp quyền mà không sửa/xóa nhật ký; các thao tác, thay đổi và lỗi quyền được ghi theo danh mục sự kiện đã chọn. |

<a id="uc6-10"></a>

### UC6.10 — Mở đúng bệnh án/lượt khám từ HIS/EMR

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.10 — Mở đúng bệnh án/lượt khám từ HIS/EMR |
| **Actor chính** | Bác sĩ hoặc nhân viên y tế; HIS/EMR cung cấp ngữ cảnh mở ca. |
| **Tiền điều kiện** | Có ngữ cảnh người bệnh/lượt từ nguồn HIS/EMR được phép; có cơ chế xác thực và kiểm tra quyền áp dụng. |
| **Luồng chính** | **1.** Người dùng chọn mở hệ thống từ màn hình ca bệnh tại HIS/EMR.<br>**2.** HIS/EMR truyền ngữ cảnh; hệ thống kiểm tra nguồn/thông tin truyền sang và xác thực người dùng.<br>**3.** Hệ thống đối chiếu đúng hồ sơ/lượt và kiểm tra quyền truy cập hiện hành.<br>**4.** Hệ thống mở đúng ca với các chức năng được phép, ghi dấu vết truy cập. |
| **Luồng thay thế** | **2a.** Phiên hết hạn: yêu cầu xác thực lại và kiểm tra lại ngữ cảnh trước mở ca.<br>**2b.** Nguồn/ngữ cảnh giả mạo hoặc không hợp lệ: từ chối truy cập, ghi sự kiện phù hợp.<br>**3a.** Không khớp hồ sơ/lượt hoặc không đủ quyền: chưa mở ca, nêu hướng xử lý được phép. |
| **Hậu điều kiện** | Mở đúng ca sau xác thực/đối chiếu; tham số URL hoặc CCCD đơn lẻ không đủ cấp quyền. Demo dùng màn hình HIS/EMR mô phỏng, chưa khẳng định có SSO hay kết nối viện thật. |

## 10. Nội dung cần cụ thể hóa khi duyệt và thiết kế

Các bảng mô tả hành vi mục tiêu của bản dự thảo. Cụm “theo quy tắc/điều kiện đã quy định” không có nghĩa quy tắc đã được bệnh viện xác nhận. Các chi tiết sau phải được làm rõ trước triển khai và nghiệm thu phần phụ thuộc; vẫn giữ các mã vấn đề hiện có, không tạo quyết định chuyên môn mới.

| Nhóm vấn đề hiện có | Nội dung cần làm rõ |
|---|---|
| Q01–Q04 | Định danh, cách xác minh liên kết tài khoản, phân công/quyền theo việc, điều kiện lịch và hoàn tất lượt. |
| Q05–Q08, Q12 | Bộ trường/đơn vị, hợp đồng đầu vào–đầu ra và quy tắc từng module, dữ liệu nguồn, điều kiện xét nghiệm lặp và dự báo nguy cơ. |
| Q06, Q10–Q11 | Cách xử lý bản sửa/xung đột, tập nội dung được ghi trả, bằng chứng HIS tiếp nhận, điều kiện xác nhận và hiệu lực kế hoạch. |
| Q09, Q13–Q16 | Phạm vi lưu dữ liệu gốc, kênh/chính sách nhắc, nội dung bệnh nhân được xem, dữ liệu thật và vòng đời quy tắc/mô hình. |

Bộ đếm biến trên sơ đồ thầy và Excel từng có chênh lệch đã ghi nhận: riêng Diagnosis là 84/21 so với 87/13; nhãn tổng 211 so với 206 dòng biến. Tài liệu này không chọn một bộ đếm làm hợp đồng cuối cùng; Q05/Q07 phải đối chiếu từng biến trước triển khai module.

## 11. Căn cứ và quản lý phiên bản

- Bộ mô hình/sơ đồ Use Case nhóm 1–2 v0.2, nhóm 3–4 v0.1, nhóm 5–6 v0.1: 12/9/8/9/6/10 Use Case. Tên/mã được giữ để đối chiếu; nội dung từng luồng là bản đặc tả dự thảo mới, không tự coi chi tiết sơ đồ hoặc quyền đã được duyệt.

- FR tổng hợp v0.2 (FR01–FR46), phạm vi tích hợp theo sơ đồ thầy và các quyết định làm việc hiện hành. Không ghi các đầu ra dự báo, quy tắc y khoa hoặc giao diện kết nối chưa có căn cứ thành chức năng đã được kiểm chứng.

- [Bài giảng môn học — mục 2.2.2.1 và phần thực hành Bước 5](https://fossbk-spec.github.io/ktpmud-book/ch02_yeu_cau_thiet_ke_c4#_2-2-mo-hinh-hoa-yeu-cau-va-kien-truc-he-thong): tham khảo khung sáu trường. Việc chọn 54 bảng và 12 ca trình bày là cách tổ chức tài liệu của nhóm, không phải số lượng bài giảng bắt buộc cho riêng đồ án này.

Bản hướng dẫn Khung-va-danh-muc-dac-ta-Use-case-v0.1.md được giữ làm lịch sử. Bản v0.2 thay mẫu dài bằng sáu trường, đặc tả đủ 54 mã hiện có và tách file trọng tâm phục vụ báo cáo. RTM tiếp tục là phần riêng. Chưa thay FR/NFR, sơ đồ hay trạng thái xác nhận của bệnh viện.
