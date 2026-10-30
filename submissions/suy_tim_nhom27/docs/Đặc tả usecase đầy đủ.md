# Đặc tả Use Case — Hệ thống quản lý bệnh nhân suy tim

**Phiên bản:** 0.3 · 
**Ngày cập nhật:** 31/10/2026 · 
**Trạng thái:** đặc tả cập nhật theo phạm vi và bộ sơ đồ mới; các chi tiết tiếp tục được rà soát trước khi triển khai/nghiệm thu, chưa phải xác nhận của bệnh viện.

## 1. Phạm vi và cách sử dụng

Tài liệu đặc tả đầy đủ **56 Use Case thuộc sáu nhóm**, đồng bộ mã/tên với bộ sơ đồ tổng quan và chi tiết ngày 30/10/2026. Mỗi bảng giữ sáu trường: tên Use Case, tác nhân chính, tiền điều kiện, luồng chính, luồng thay thế và hậu điều kiện. Sơ đồ tổng quan không được đặc tả lặp thành một bộ mã khác.

Trình tự xây dựng: ưu tiên nền tảng ở nhóm 1, 2 và 6, bắt đầu từ nhập tay trên biểu mẫu rồi nhập file vào cùng dữ liệu. AI và quyết định/kế hoạch chuyên môn phát triển sau khi biểu mẫu, dữ liệu ổn định; phần bệnh nhân triển khai sau luồng chính. Các ca gắn với tài khoản bệnh nhân ở nhóm 1/6 cũng thuộc giai đoạn bệnh nhân. Có trong đặc tả không đồng nghĩa đã chạy trên web demo hoặc đã đạt kiểm thử.

## 2. Quy ước dùng chung

1. **Vai trò và quyền:** phạm vi hiện tại dùng Bác sĩ và Admin; Bệnh nhân được bổ sung theo lộ trình. Mỗi thao tác kiểm tra quyền hiện hành và phạm vi hồ sơ ở cả giao diện, API và truy cập tệp. Admin quản trị tài khoản, quyền, biểu mẫu, cấu hình nhập và thông tin hành chính theo quyền; phần lâm sàng chỉ đọc, không được nhập/xác nhận thay Bác sĩ. Không tự thêm vai trò tiếp đón, người chăm sóc hoặc nhân viên y tế khác.

2. **Hồ sơ và lượt khám:** mỗi người có mã BN-xxxxx ổn định, liên kết nhiều lượt có mã riêng. CCCD là thông tin định danh khi có, không thay mã BN/mã lượt. Hành chính thuộc hồ sơ; nội dung khám, kết quả, thuốc, ICD và quyết định gắn với lượt hoặc thời điểm thích hợp. Trang tổng quan có thể tổng hợp lịch sử nhưng không làm mất nguồn, thời gian hoặc quan hệ với lượt. Tài khoản truy cập khác hồ sơ bệnh nhân và chỉ xem phần được công bố sau liên kết xác minh.

3. **Nguồn file và nơi lưu:** Bác sĩ nhận file xuất từ HIS, tải lên, xem trước và xác nhận nhập vào bệnh án của sản phẩm; phần còn thiếu được bổ sung tay. Không mặc định file đã đầy đủ, đã chuẩn hóa hoặc đủ để chạy AI. Không mô phỏng HIS/LIS/PACS, mở ca từ HIS, nhận dữ liệu qua API viện hoặc ghi trả HIS trong demo. HIS trên sơ đồ là nguồn file; không phải người xác nhận nhập. Kết nối thật chỉ xem xét riêng khi có quyết định, giao diện và quyền phù hợp.

4. **Dữ liệu thiếu:** NULL/chưa biết/chưa đánh giá khác 0, Không, không áp dụng hoặc danh sách đã xác nhận rỗng, tùy kiểu trường. Chỉ yêu cầu trường bắt buộc cho đúng thao tác; lưu nháp không đồng nghĩa đủ điều kiện chạy module hoặc hoàn tất lượt. Không tự điền dữ liệu lâm sàng bình thường, biến gợi ý xét nghiệm thành kết quả đo hoặc dùng giá trị cũ như kết quả mới.

5. **Mẫu và phiên bản:** Admin quản lý định nghĩa trường và phiên bản mẫu; Bác sĩ nhập giá trị vào mẫu đã gắn với lượt. Mẫu mới áp dụng cho lượt mới theo cấu hình. Lượt cũ giữ đúng cấu trúc, ý nghĩa và dữ liệu của phiên bản đã dùng; chuyển mẫu nếu có phải được đối chiếu và ghi lịch sử. Cấu hình nhập file cũng có phạm vi/phiên bản để truy vết.

6. **Lưu và thử lại:** lưu đúng người/lượt, nguồn, đơn vị và thời điểm khi phù hợp. Sửa đồng thời phải phát hiện xung đột; không ghi đè âm thầm. Lưu lỗi/chưa rõ kết quả không báo thành công. Thử lại cùng thao tác đã ghi không được nhân bản; lần nhập mới từ cùng file sau khi dữ liệu đích đổi phải đối chiếu lại. Các thao tác thuộc phạm vi kiểm toán có nhật ký, bảo vệ dữ liệu nhạy cảm.

7. **Bốn module hỗ trợ:** Diagnosis → Lab/Test → Treatment → MedSafety dùng đầu ra liên quan và dữ liệu bệnh án; không buộc mọi ca chạy đủ bốn module. Các module là thành phần trong hệ thống, không là tác nhân AI bên ngoài. Gợi ý phải gắn đầu vào/phiên bản, căn cứ và giới hạn áp dụng. Dự báo nguy cơ chỉ bật khi có phương pháp và kiểm định phù hợp; chưa mặc định có bốn mô hình học máy đã huấn luyện.

8. **Quyết định bác sĩ:** Bác sĩ xem xét và xác nhận kết luận/kế hoạch. Hệ thống không tự kê đơn, đổi liều hoặc ngừng thuốc. Nhập dữ liệu, phản hồi một gợi ý, xác nhận kế hoạch, hoàn tất lượt và công bố cho bệnh nhân là các trạng thái riêng. Điều chỉnh bản đã xác nhận tạo dự thảo mới, xác nhận lại khi đủ điều kiện; không xóa bản cũ hoặc tự học lại từ phản hồi.

9. **Bệnh nhân và nhắc:** bệnh nhân chỉ xem nội dung được phép của mình; không xem dự thảo/ghi chú nội bộ hoặc sửa lâm sàng. Mốc tái khám dự kiến trong kế hoạch chưa phải lịch hẹn đã xác nhận. Nhắc theo bản/lịch hiện hành, cập nhật khi thay đổi, không suy giờ uống khi thiếu và không coi đã đọc/nhận nhắc là đã uống. Kênh nhắc khi app đóng cần được đặc tả khi triển khai; không mặc định đã có dịch vụ push.

10. **Giới hạn chuyên môn:** không đi sâu nội trú, giường bệnh, thực hiện thuốc hằng ngày; chỉ giữ liên kết/tóm tắt được cung cấp. Chưa triển khai người chăm sóc, nhật ký tuân thủ, thanh toán hoặc chọn bác sĩ. Lão khoa bổ sung khi phù hợp; không giới hạn toàn hệ thống ở người cao tuổi. Quy tắc y khoa, ngưỡng và điều kiện bắt buộc phải có nguồn và được rà soát trước khi nghiệm thu phần tương ứng.

**Quan hệ trên sơ đồ:** [UC2.01](#uc2-01) bao gồm các hành vi [UC2.02](#uc2-02)–[UC2.05](#uc2-05); bốn ca hỗ trợ [UC3.01](#uc3-01)–[UC3.04](#uc3-04) bao gồm [UC3.05](#uc3-05). Tác nhân của hành vi dùng chung kế thừa ca gọi, không có một tác nhân “Hệ thống” mới. `include` không biểu diễn chuỗi dữ liệu giữa bốn module. [UC4.07](#uc4-07) có thể kết thúc ở lưu nháp; xác nhận sau là [UC4.06](#uc4-06), không ép mọi lần chỉnh phải xác nhận bằng quan hệ `include`. Các liên kết trong bảng giúp tra nội dung, không tự tạo thêm cạnh trên sơ đồ.

## 3. Mục lục sáu nhóm

### Nhóm 1. Quản lý hồ sơ bệnh án, lượt khám (12 Use Case)

- [UC1.01 — Tra cứu hồ sơ bệnh nhân](#uc1-01)
- [UC1.02 — Tạo hồ sơ bệnh nhân](#uc1-02)
- [UC1.03 — Cập nhật thông tin hành chính](#uc1-03)
- [UC1.04 — Liên kết tài khoản bệnh nhân với hồ sơ](#uc1-04)
- [UC1.05 — Quản lý khung giờ khám](#uc1-05)
- [UC1.06 — Quản lý lịch hẹn khám](#uc1-06)
- [UC1.07 — Tiếp nhận và quản lý lượt khám](#uc1-07)
- [UC1.08 — Cập nhật dữ liệu lâm sàng](#uc1-08)
- [UC1.09 — Ghi nhận chỉ định cận lâm sàng](#uc1-09)
- [UC1.10 — Ghi nhận kết quả cận lâm sàng](#uc1-10)
- [UC1.11 — Tra cứu lịch sử khám và điều trị](#uc1-11)
- [UC1.12 — Hoàn tất lượt khám](#uc1-12)

### Nhóm 2. Tiếp nhận và tiền xử lý dữ liệu (9 Use Case)

- [UC2.01 — Tải file và xem trước dữ liệu nhập](#uc2-01)
- [UC2.02 — Đối chiếu hồ sơ và lượt khám](#uc2-02)
- [UC2.03 — Kiểm tra dữ liệu hợp lệ và dữ liệu thiếu](#uc2-03)
- [UC2.04 — Chuẩn hóa dữ liệu](#uc2-04)
- [UC2.05 — Kiểm soát dữ liệu trùng và bản sửa](#uc2-05)
- [UC2.07 — Tra cứu lịch sử và kết quả nhập file](#uc2-07)
- [UC2.09 — Xử lý lại lần nhập bị lỗi](#uc2-09)
- [UC2.10 — Xác nhận nhập dữ liệu vào bệnh án](#uc2-10)
- [UC2.11 — Quản lý cấu hình nhập file](#uc2-11)

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
- [UC4.04 — Lập phương án thuốc dự thảo](#uc4-04)
- [UC4.05 — Lập kế hoạch theo dõi và tái khám](#uc4-05)
- [UC4.06 — Xác nhận kế hoạch điều trị](#uc4-06)
- [UC4.07 — Lập bản điều chỉnh kế hoạch đã xác nhận](#uc4-07)
- [UC4.08 — Công bố kết quả và kế hoạch điều trị](#uc4-08)
- [UC4.09 — Cập nhật hoặc thu hồi nội dung đã công bố](#uc4-09)

### Nhóm 5. Hỗ trợ bệnh nhân ngoại trú (6 Use Case)

- [UC5.01 — Đặt lịch khám](#uc5-01)
- [UC5.02 — Xem lịch khám và trạng thái](#uc5-02)
- [UC5.03 — Xem kết quả và kế hoạch đã công bố](#uc5-03)
- [UC5.04 — Nhận và xem thông báo](#uc5-04)
- [UC5.05 — Nhận nhắc lịch khám](#uc5-05)
- [UC5.06 — Nhận nhắc thuốc theo kế hoạch](#uc5-06)

### Nhóm 6. Quản trị hệ thống và dữ liệu dùng chung (12 Use Case)

- [UC6.01 — Đăng ký tài khoản bệnh nhân](#uc6-01)
- [UC6.02 — Đăng nhập, đăng xuất](#uc6-02)
- [UC6.03 — Cập nhật thông tin tài khoản](#uc6-03)
- [UC6.04 — Khôi phục truy cập tài khoản](#uc6-04)
- [UC6.05 — Quản lý tài khoản người dùng](#uc6-05)
- [UC6.06 — Quản lý vai trò và quyền truy cập](#uc6-06)
- [UC6.07 — Quản lý danh mục dùng chung](#uc6-07)
- [UC6.08 — Quản lý phiên bản biểu mẫu](#uc6-08)
- [UC6.09 — Tra cứu nhật ký hệ thống](#uc6-09)
- [UC6.11 — Quản lý biểu mẫu và trường dữ liệu](#uc6-11)
- [UC6.12 — Sao lưu dữ liệu](#uc6-12)
- [UC6.13 — Khôi phục dữ liệu](#uc6-13)

<a id="nhom-1"></a>

## 4. Nhóm 1 — Quản lý hồ sơ bệnh án, lượt khám

<a id="uc1-01"></a>

### UC1.01 — Tra cứu hồ sơ bệnh nhân

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.01 — Tra cứu hồ sơ bệnh nhân |
| **Actor chính** | Bác sĩ hoặc Admin, trong phạm vi được cấp. |
| **Tiền điều kiện** | Người dùng đã đăng nhập và có quyền tra cứu trong phạm vi được giao. |
| **Luồng chính** | **1.** Người dùng nhập mã hồ sơ, số định danh cá nhân khi có hoặc thông tin người bệnh.<br>**2.** Hệ thống tìm các hồ sơ phù hợp trong phạm vi được phép xem.<br>**3.** Người dùng đối chiếu thông tin và chọn hồ sơ.<br>**4.** Hệ thống hiển thị thông tin hành chính, tóm tắt theo lượt gần nhất và danh sách lượt khám theo quyền; dữ liệu có thời điểm/nguồn để đối chiếu. |
| **Luồng thay thế** | **2a.** Không có kết quả: thông báo không tìm thấy; người dùng sửa tiêu chí hoặc chuyển [UC1.02](#uc1-02) nếu có quyền.<br>**3a.** Có nhiều hồ sơ phù hợp: yêu cầu đối chiếu thêm thông tin, chưa tự chọn một hồ sơ. |
| **Hậu điều kiện** | Hiển thị đúng hồ sơ được phép xem; việc tra cứu không tự mở hoặc bắt đầu lượt khám. |

<a id="uc1-02"></a>

### UC1.02 — Tạo hồ sơ bệnh nhân

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.02 — Tạo hồ sơ bệnh nhân |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Bác sĩ đã đăng nhập, có quyền tạo hồ sơ và đã tra cứu để hạn chế trùng. |
| **Luồng chính** | **1.** Bác sĩ nhập thông tin hành chính tối thiểu theo mẫu, số định danh cá nhân và mã nguồn nếu có.<br>**2.** Hệ thống kiểm tra trường bắt buộc, kiểu dữ liệu và dấu hiệu trùng định danh.<br>**3.** Bác sĩ đối chiếu các hồ sơ nghi trùng; nếu không phải cùng người, xác nhận tạo mới.<br>**4.** Hệ thống cấp mã BN-xxxxx duy nhất, ổn định, lưu người/thời điểm tạo và hiển thị hồ sơ. |
| **Luồng thay thế** | **2a.** Thông tin bắt buộc chưa hợp lệ: chỉ rõ trường cần bổ sung, chưa tạo hồ sơ.<br>**2b.** Có hồ sơ cùng định danh hoặc nghi trùng: yêu cầu đối chiếu, không gộp chỉ theo tên. Dùng hồ sơ có sẵn khi xác minh đúng người.<br>**1a.** Chưa có CCCD hoặc dữ liệu khám: để NULL theo quy định trường; không bắt có kết quả chuyên môn mới cho tạo hồ sơ. |
| **Hậu điều kiện** | Có hồ sơ bệnh nhân với mã BN riêng, dùng để liên kết nhiều lượt khám. Chưa tự mở lượt hoặc cấp quyền cho tài khoản bệnh nhân; dữ liệu chuyên môn và ICD được lưu theo lượt phù hợp. |

<a id="uc1-03"></a>

### UC1.03 — Cập nhật thông tin hành chính

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.03 — Cập nhật thông tin hành chính |
| **Actor chính** | Bác sĩ hoặc Admin, trong phạm vi được cấp. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền cập nhật và đã chọn đúng hồ sơ. |
| **Luồng chính** | **1.** Người dùng mở thông tin hành chính của hồ sơ.<br>**2.** Người dùng bổ sung hoặc sửa thông tin cần thiết.<br>**3.** Hệ thống kiểm tra dữ liệu, dấu hiệu trùng và xung đột với liên kết định danh hiện có.<br>**4.** Người dùng lưu; hệ thống cập nhật, giữ mã hồ sơ và lịch sử thay đổi. |
| **Luồng thay thế** | **3a.** Thông tin không hợp lệ: chỉ rõ trường cần sửa, quay lại bước 2.<br>**3b.** Thay đổi định danh gây trùng hoặc mâu thuẫn liên kết: giữ dữ liệu hiện tại, yêu cầu xác minh theo quyền trước khi cập nhật. |
| **Hậu điều kiện** | Thông tin hành chính được cập nhật có dấu vết, giữ mã BN. Admin không được sửa giá trị chuyên môn qua chức năng này; dữ liệu hành chính đã ghi nhận tại lượt cũ không tự bị viết lại. |

<a id="uc1-04"></a>

### UC1.04 — Liên kết tài khoản bệnh nhân với hồ sơ

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.04 — Liên kết tài khoản bệnh nhân với hồ sơ |
| **Actor chính** | Bác sĩ hoặc Admin, trong phạm vi được cấp. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền liên kết; có tài khoản bệnh nhân và hồ sơ cần đối chiếu. |
| **Luồng chính** | **1.** Người dùng chọn tài khoản và hồ sơ bệnh nhân cần liên kết.<br>**2.** Hệ thống hiển thị thông tin đối chiếu và tình trạng liên kết hiện có.<br>**3.** Người dùng xác minh chủ tài khoản với hồ sơ theo cách đã thống nhất và xác nhận liên kết.<br>**4.** Hệ thống lưu liên kết, người/thời điểm thực hiện và cấp phạm vi xem tương ứng. |
| **Luồng thay thế** | **2a.** Có liên kết mâu thuẫn: dừng thay thế và yêu cầu người có quyền xử lý; CCCD nhập đơn lẻ không đủ để tự liên kết.<br>**3a.** Chưa đủ bằng chứng hoặc thông tin không khớp: giữ chờ xác minh, chưa cấp quyền xem. |
| **Hậu điều kiện** | Tài khoản đã xác minh được liên kết đúng hồ sơ và chỉ xem nội dung được công bố; không tạo một bệnh án chuyên môn thứ hai. |

<a id="uc1-05"></a>

### UC1.05 — Quản lý khung giờ khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.05 — Quản lý khung giờ khám |
| **Actor chính** | Admin được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền quản lý khung giờ của đơn vị khám. |
| **Luồng chính** | **1.** Người dùng chọn cơ sở/đơn vị khám và khoảng ngày cần quản lý.<br>**2.** Hệ thống hiển thị khung giờ, sức chứa và số lịch đã xác nhận.<br>**3.** Người dùng tạo hoặc cập nhật khung giờ và sức chứa.<br>**4.** Hệ thống kiểm tra, lưu thay đổi và cập nhật khả năng đặt lịch trên các kênh đặt lịch đã triển khai. |
| **Luồng thay thế** | **4a.** Khung giờ hoặc sức chứa không hợp lệ: báo lý do, quay lại bước 3.<br>**4b.** Thay đổi ảnh hưởng lịch đã xác nhận: chỉ rõ các lịch liên quan và yêu cầu xử lý theo quy tắc lịch; chưa tự hủy hoặc làm vượt sức chứa. |
| **Hậu điều kiện** | Khung giờ hợp lệ được dùng chung cho các kênh đặt lịch; lịch đã xác nhận được bảo toàn cho đến khi có xử lý phù hợp. |

<a id="uc1-06"></a>

### UC1.06 — Quản lý lịch hẹn khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.06 — Quản lý lịch hẹn khám |
| **Actor chính** | Bác sĩ hoặc Admin, trong phạm vi được cấp. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền quản lý lịch; có khung giờ của đơn vị khám. |
| **Luồng chính** | **1.** Người dùng tra cứu hoặc nhập thông tin người bệnh để tạo/cập nhật lịch hẹn.<br>**2.** Hệ thống hiển thị lịch liên quan và các khung giờ còn chỗ.<br>**3.** Người dùng chọn thời gian, kiểm tra thông tin và yêu cầu lưu thay đổi.<br>**4.** Hệ thống kiểm tra lại sức chứa, lưu mã/trạng thái lịch và phản ánh trên các kênh. |
| **Luồng thay thế** | **1a.** Cần đổi hoặc hủy lịch: cập nhật theo quyền và điều kiện lịch; điều chỉnh các nhắc tương lai liên quan theo [UC5.05](#uc5-05).<br>**4a.** Khung giờ đã hết chỗ: chưa xác nhận lịch, yêu cầu chọn lại tại bước 2. |
| **Hậu điều kiện** | Lịch hẹn được quản lý trên cùng dữ liệu với kênh bệnh nhân khi triển khai. Lịch hẹn và lượt khám có mã/trạng thái riêng; không tự tạo lượt chỉ từ việc đặt lịch. |

<a id="uc1-07"></a>

### UC1.07 — Tiếp nhận và quản lý lượt khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.07 — Tiếp nhận và quản lý lượt khám |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền tiếp nhận; người bệnh đến khám và có thể xác định hồ sơ phù hợp. |
| **Luồng chính** | **1.** Người dùng chọn hồ sơ và kiểm tra thông tin cá nhân, lịch hẹn nếu có.<br>**2.** Hệ thống hiển thị các lượt liên quan để đối chiếu, tránh mở trùng.<br>**3.** Người dùng xác nhận tiếp nhận và yêu cầu mở hoặc liên kết lượt phù hợp.<br>**4.** Hệ thống lưu lượt với đúng hồ sơ và mã lượt, thời điểm, mã nguồn khi có và trạng thái chờ/đang xử lý theo thao tác được phép. |
| **Luồng thay thế** | **1a.** Chưa có hồ sơ: tạo qua [UC1.02](#uc1-02) theo quyền rồi quay lại đối chiếu.<br>**2a.** Đã có lượt phù hợp: sử dụng lượt đó sau đối chiếu; thông tin mơ hồ thì chưa mở hoặc gắn thêm lượt.<br>**3a.** Chỉ mở xem hồ sơ hoặc lịch hẹn: chưa tạo/bắt đầu lượt. Bổ sung liên kết mã nguồn vào lượt đã có phải được đối chiếu, không tạo lượt trùng. |
| **Hậu điều kiện** | Có lượt khám đúng hồ sơ để cập nhật nội dung khám; chỉ mở hồ sơ để xem không làm bắt đầu lượt. |

<a id="uc1-08"></a>

### UC1.08 — Cập nhật dữ liệu lâm sàng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.08 — Cập nhật dữ liệu lâm sàng |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Bác sĩ đã đăng nhập, có quyền cập nhật đúng hồ sơ/lượt và mẫu/phiên bản đã gắn với lượt. |
| **Luồng chính** | **1.** Bác sĩ mở biểu mẫu, kiểm tra mã BN, người bệnh và lượt đang thao tác.<br>**2.** Hệ thống hiển thị giá trị đã có theo nhóm trường của đúng mẫu; Bác sĩ nhập bệnh sử, triệu chứng, sinh hiệu, tiền sử, dị ứng, thuốc và đánh giá phù hợp.<br>**3.** Bác sĩ kiểm tra dữ liệu, bổ sung phần thiếu và chọn lưu.<br>**4.** Hệ thống kiểm tra kiểu, giá trị và phiên bản đích; lưu vào bệnh án với người, nguồn và thời điểm, cho phép mở lại; đánh dấu hỗ trợ bị ảnh hưởng cần xem lại. |
| **Luồng thay thế** | **2a.** Chưa biết/chưa đánh giá: giữ NULL theo kiểu trường; không tự đổi thành Không, 0 hoặc danh sách đã xác nhận rỗng. Đánh giá lão khoa chỉ áp dụng khi phù hợp.<br>**3a.** Lưu nháp được phép thiếu trường chưa bắt buộc cho thao tác này; yêu cầu chạy module, hoàn tất lượt hoặc xác nhận chuyên môn có điều kiện riêng.<br>**4a.** Sai kiểu/giá trị hoặc có sửa đồng thời: chỉ rõ trường/xung đột, chưa ghi đè. Lỗi lưu hoặc chưa rõ kết quả không báo thành công. |
| **Hậu điều kiện** | Dữ liệu đã lưu mở lại đúng lượt/mẫu và phiên bản. Bác sĩ nhập giá trị; không sửa định nghĩa trường. Thao tác này chưa tự hoàn tất lượt hoặc sinh kết luận/đầu ra AI. |

<a id="uc1-09"></a>

### UC1.09 — Ghi nhận chỉ định cận lâm sàng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.09 — Ghi nhận chỉ định cận lâm sàng |
| **Actor chính** | Bác sĩ được phân quyền; đây là người quyết định và ghi nhận chỉ định trong phạm vi hiện tại. |
| **Tiền điều kiện** | Đã đăng nhập, chọn đúng lượt được phép cập nhật; có quyết định chỉ định của bác sĩ. |
| **Luồng chính** | **1.** Người dùng mở phần chỉ định của lượt khám.<br>**2.** Người dùng chọn xét nghiệm/thăm dò và nhập nội dung chỉ định theo quyết định bác sĩ.<br>**3.** Hệ thống kiểm tra thông tin và hiển thị để đối chiếu với chỉ định đã có.<br>**4.** Người dùng lưu; hệ thống ghi chỉ định do Bác sĩ quyết định vào đúng lượt, lưu người/thời điểm và phân biệt với gợi ý Lab/Test. |
| **Luồng thay thế** | **2a.** Mới có gợi ý Lab/Test: bác sĩ phải xem xét và quyết định trước khi ghi thành chỉ định.<br>**3a.** Thiếu thông tin bắt buộc hoặc không rõ quyết định bác sĩ: yêu cầu bổ sung, chưa lưu như chỉ định chính thức. |
| **Hậu điều kiện** | Chỉ định được ghi đúng lượt và thẩm quyền; chưa đồng nghĩa đã thực hiện xét nghiệm hoặc đã gửi lệnh sang LIS/RIS. |

<a id="uc1-10"></a>

### UC1.10 — Ghi nhận kết quả cận lâm sàng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.10 — Ghi nhận kết quả cận lâm sàng |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền nhập kết quả và có kết quả thực hiện từ nguồn xác định. |
| **Luồng chính** | **1.** Người dùng chọn đúng bệnh án, lượt khám và chỉ định liên quan khi có.<br>**2.** Người dùng nhập kết quả thực hiện, nguồn, thời điểm và đơn vị khi phù hợp.<br>**3.** Hệ thống kiểm tra cách biểu diễn, thông tin thiếu và quan hệ với kết quả đã có.<br>**4.** Người dùng lưu; hệ thống giữ lịch sử và đánh dấu các lần hỗ trợ bị ảnh hưởng cần xem lại. |
| **Luồng thay thế** | **3a.** Thiếu nguồn, đơn vị bắt buộc hoặc dữ liệu không hợp lệ: yêu cầu bổ sung, không dùng phần lỗi như kết quả hợp lệ.<br>**3b.** Là bản sửa của kết quả cũ: lưu quan hệ thay thế và lịch sử; dữ liệu từ file phải qua [UC2.01](#uc2-01) để xem trước và [UC2.10](#uc2-10) để xác nhận nhập vào bệnh án. |
| **Hậu điều kiện** | Kết quả thực hiện được lưu có nguồn và thời gian để đánh giá lại; gợi ý xét nghiệm không được ghi thành kết quả đo. |

<a id="uc1-11"></a>

### UC1.11 — Tra cứu lịch sử khám và điều trị

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.11 — Tra cứu lịch sử khám và điều trị |
| **Actor chính** | Bác sĩ hoặc Admin, trong phạm vi được cấp. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền xem và đã chọn đúng hồ sơ. |
| **Luồng chính** | **1.** Người dùng mở lịch sử khám và điều trị.<br>**2.** Hệ thống hiển thị các lượt/đợt và thông tin theo thời gian.<br>**3.** Người dùng chọn lượt hoặc nội dung cần đối chiếu.<br>**4.** Hệ thống hiển thị dữ liệu, thuốc, kết luận và kế hoạch với thời điểm/phiên bản tương ứng. |
| **Luồng thay thế** | **2a.** Chưa có lịch sử: thông báo chưa có dữ liệu, giữ nguyên hồ sơ.<br>**4a.** Dữ liệu nội trú chưa được cung cấp: chỉ hiển thị liên kết/tóm tắt hiện có, không suy ra diễn biến điều trị chi tiết. |
| **Hậu điều kiện** | Người dùng xem được lịch sử trong phạm vi quyền; dữ liệu cũ được phân biệt với nội dung hiện hành. Admin chỉ đọc phần chuyên môn, không được sửa qua màn hình lịch sử. |

<a id="uc1-12"></a>

### UC1.12 — Hoàn tất lượt khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC1.12 — Hoàn tất lượt khám |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền hoàn tất và chọn đúng lượt chưa hoàn tất. |
| **Luồng chính** | **1.** Người dùng yêu cầu hoàn tất lượt khám.<br>**2.** Hệ thống kiểm tra dữ liệu đã lưu và các nội dung bắt buộc đã được xác nhận theo quy tắc của lượt.<br>**3.** Hệ thống hiển thị kết quả kiểm tra; người dùng xác nhận hoàn tất khi đủ điều kiện.<br>**4.** Hệ thống cập nhật trạng thái hoàn tất, ghi người/thời điểm và lưu lịch sử. |
| **Luồng thay thế** | **2a.** Còn dữ liệu chưa lưu hoặc thiếu xác nhận bắt buộc: nêu phần cần xử lý, giữ trạng thái hiện tại.<br>**3a.** Người dùng hủy hoặc lượt đã thay đổi: chưa hoàn tất, yêu cầu xem lại trạng thái mới khi cần. |
| **Hậu điều kiện** | Lượt đủ điều kiện được hoàn tất; hồ sơ vẫn dùng cho các lần tiếp theo. Lưu dữ liệu, xác nhận chuyên môn, hoàn tất lượt và công bố là các trạng thái riêng; không yêu cầu HIS tiếp nhận. |

<a id="nhom-2"></a>

## 5. Nhóm 2 — Tiếp nhận và tiền xử lý dữ liệu

<a id="uc2-01"></a>

### UC2.01 — Tải file và xem trước dữ liệu nhập

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.01 — Tải file và xem trước dữ liệu nhập |
| **Actor chính** | Bác sĩ khởi tạo thao tác; HIS là nguồn file, không thao tác trực tiếp trên sản phẩm. |
| **Tiền điều kiện** | Bác sĩ đã đăng nhập, có quyền nhập file; có tệp từ HIS và đặc tả/cấu hình đọc phù hợp. Không yêu cầu kết nối trực tiếp HIS. |
| **Luồng chính** | **1.** Bác sĩ chọn tải file, chỉ định nguồn và cấu hình ánh xạ phù hợp.<br>**2.** Hệ thống đọc file, tạo mã lần nhập và lưu thông tin nguồn, thời điểm, người tải cùng dữ liệu gốc hoặc tham chiếu theo chính sách.<br>**3.** Hệ thống thực hiện [UC2.02](#uc2-02)–[UC2.05](#uc2-05): đối chiếu hồ sơ/lượt, kiểm tra dữ liệu, chuẩn hóa, nhận diện trùng/bản sửa.<br>**4.** Hệ thống hiển thị hồ sơ/lượt dự kiến, giá trị trong file so với giá trị hiện có, dữ liệu thiếu/lỗi và xung đột.<br>**5.** Bác sĩ kiểm tra kết quả; chuyển [UC2.10](#uc2-10) nếu muốn xác nhận nhập, hoặc dừng mà chưa ghi giá trị vào bệnh án. |
| **Luồng thay thế** | **2a.** Không đọc được hoặc không đúng đặc tả: báo lỗi tệp hoặc vị trí liên quan; không báo đã nhập thành công.<br>**3a.** Thiếu/mâu thuẫn mã hồ sơ hoặc mã lượt: giữ chờ hoặc báo lỗi; không tự gắn theo tên hoặc theo lượt đang mở.<br>**3b.** Chưa có quy tắc chuyển đổi hoặc dữ liệu sai: nêu phần chưa đủ điều kiện; không tự điền giá trị lâm sàng bình thường. |
| **Hậu điều kiện** | Có lần nhập và bản xem trước với kết quả kiểm tra; chưa ghi dữ liệu khám khi chỉ tải/xem trước. HIS là nguồn file qua Bác sĩ; không dựng HIS/LIS/PACS mô phỏng hoặc gọi API viện. |

<a id="uc2-02"></a>

### UC2.02 — Đối chiếu hồ sơ và lượt khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.02 — Đối chiếu hồ sơ và lượt khám |
| **Actor chính** | Kế thừa Bác sĩ của [UC2.01](#uc2-01); hành vi được bao gồm, không khởi tạo độc lập. |
| **Tiền điều kiện** | Đã đọc được file theo đặc tả; có mã hồ sơ/mã nguồn, mã lượt hoặc dữ liệu liên kết để đối chiếu. |
| **Luồng chính** | **1.** Hệ thống lấy mã người bệnh, mã lượt và nguồn ghi trong file theo ánh xạ.<br>**2.** Hệ thống tra liên kết mã nguồn đã xác minh với hồ sơ BN và lượt trong sản phẩm.<br>**3.** Hệ thống kiểm tra mã lượt thuộc đúng người bệnh, nguồn và phiên bản đích.<br>**4.** Hệ thống trả đích đối chiếu được hoặc danh sách phần chưa khớp cho [UC2.01](#uc2-01) hiển thị. |
| **Luồng thay thế** | **2a.** Không khớp hoặc có nhiều khả năng: giữ chờ xác minh, không tự chọn hồ sơ/lượt hay tạo trùng.<br>**3a.** Mã lượt thuộc người khác hoặc liên kết mâu thuẫn: chặn ghi; sửa liên kết qua thao tác có quyền và đối chiếu lại. |
| **Hậu điều kiện** | Xác định được đúng đích hoặc trạng thái chưa đối chiếu được. Kết quả đối chiếu không tự cấp quyền hoặc ghi dữ liệu lâm sàng. |

<a id="uc2-03"></a>

### UC2.03 — Kiểm tra dữ liệu hợp lệ và dữ liệu thiếu

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.03 — Kiểm tra dữ liệu hợp lệ và dữ liệu thiếu |
| **Actor chính** | Kế thừa Bác sĩ của [UC2.01](#uc2-01); hành vi được bao gồm, không khởi tạo độc lập. |
| **Tiền điều kiện** | Đã đọc dữ liệu từ file và có đặc tả kiểm tra áp dụng cho loại dữ liệu đó. |
| **Luồng chính** | **1.** Hệ thống kiểm tra cấu trúc và khả năng đọc dữ liệu.<br>**2.** Hệ thống kiểm tra kiểu, trường bắt buộc, giá trị và đơn vị theo đặc tả.<br>**3.** Hệ thống phân biệt hợp lệ, không hợp lệ, chưa có và không áp dụng; báo theo dòng/trường để xử lý.<br>**4.** Hệ thống trả kết quả kiểm tra và danh sách lỗi/thiếu cho [UC2.01](#uc2-01). |
| **Luồng thay thế** | **1a.** Không đọc được cấu trúc: ghi lỗi và dừng xử lý phần dữ liệu đó.<br>**2a.** Sai hoặc thiếu dữ liệu: chỉ rõ trường và mức ảnh hưởng theo quy tắc; không thay NULL bằng 0, Không hoặc giá trị bình thường; không dùng dữ liệu lỗi như đã hợp lệ. |
| **Hậu điều kiện** | Phần đủ điều kiện được nhận diện; phần lỗi/thiếu được giữ đúng trạng thái để xử lý tiếp, chưa tự kết luận lâm sàng. |

<a id="uc2-04"></a>

### UC2.04 — Chuẩn hóa dữ liệu

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.04 — Chuẩn hóa dữ liệu |
| **Actor chính** | Kế thừa Bác sĩ của [UC2.01](#uc2-01); hành vi được bao gồm, không khởi tạo độc lập. |
| **Tiền điều kiện** | Có dữ liệu đủ điều kiện chuyển đổi và bộ ánh xạ/đơn vị/ngày giờ được phép áp dụng. |
| **Luồng chính** | **1.** Hệ thống xác định trường, mã, đơn vị và thời gian của dữ liệu nguồn.<br>**2.** Hệ thống chọn quy tắc chuẩn hóa tương ứng.<br>**3.** Hệ thống chuyển sang cách biểu diễn chung và giữ giá trị gốc, nguồn, phiên bản quy tắc.<br>**4.** Hệ thống kiểm tra dữ liệu sau chuyển đổi và trả kết quả cho [UC2.01](#uc2-01). |
| **Luồng thay thế** | **2a.** Không có hoặc có nhiều quy tắc mâu thuẫn: giữ chờ xử lý, không tự suy phép đổi.<br>**3a.** Dữ liệu đã đúng cách biểu diễn: kiểm tra rồi giữ nguyên; giá trị bất thường không được sửa thành bình thường. |
| **Hậu điều kiện** | Có dữ liệu chuẩn hóa truy được nguồn/quy tắc hoặc trạng thái chờ rõ ràng; chỉ phần đủ điều kiện được đưa vào xem trước và được ghi sau xác nhận [UC2.10](#uc2-10). |

<a id="uc2-05"></a>

### UC2.05 — Kiểm soát dữ liệu trùng và bản sửa

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.05 — Kiểm soát dữ liệu trùng và bản sửa |
| **Actor chính** | Kế thừa Bác sĩ của [UC2.01](#uc2-01); hành vi được bao gồm, không khởi tạo độc lập. |
| **Tiền điều kiện** | Có dữ liệu file đã đọc/đối chiếu và lịch sử lần nhập, phiên bản dữ liệu đích để so sánh. |
| **Luồng chính** | **1.** Hệ thống xác định nguồn, nội dung, đối tượng và mã thao tác/lần nhập để đối chiếu với lịch sử.<br>**2.** Hệ thống phân biệt thử lại cùng thao tác với lần nhập mới, dữ liệu trùng, bản sửa hoặc xung đột.<br>**3.** Hệ thống so sánh giá trị nguồn và phiên bản bệnh án hiện hành; đánh dấu phần giữ nguyên, thay đổi hoặc cần xử lý.<br>**4.** Hệ thống trả kết quả cho xem trước; khi xác nhận nhập, kiểm tra lại để không nhân bản hoặc ghi đè bản mới âm thầm. |
| **Luồng thay thế** | **2a.** Cùng thao tác đã ghi nhưng mất phản hồi: trả trạng thái đã lưu, không ghi thêm lần nữa.<br>**2b.** Tạo lần nhập mới từ cùng file sau khi dữ liệu đích đổi: đối chiếu lại với đích mới; không tự coi là thao tác cũ đã xử lý.<br>**3a.** Bản sửa mâu thuẫn hoặc không rõ quan hệ: giữ chờ, không coi dữ liệu đến sau mặc nhiên đúng. |
| **Hậu điều kiện** | Có thông tin trùng/bản sửa/xung đột để Bác sĩ xem xét tại [UC2.10](#uc2-10); không tự sửa dữ liệu lâm sàng hoặc làm mất lịch sử. |

<a id="uc2-07"></a>

### UC2.07 — Tra cứu lịch sử và kết quả nhập file

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.07 — Tra cứu lịch sử và kết quả nhập file |
| **Actor chính** | Bác sĩ hoặc Admin, trong phạm vi được cấp. |
| **Tiền điều kiện** | Bác sĩ hoặc Admin đã đăng nhập, có quyền xem lịch sử nhập trong phạm vi được giao. |
| **Luồng chính** | **1.** Người dùng lọc theo mã lần nhập, nguồn, hồ sơ/lượt, thời gian hoặc trạng thái.<br>**2.** Hệ thống liệt kê các lần nhập và kết quả được phép xem.<br>**3.** Người dùng chọn lần cần kiểm tra.<br>**4.** Hệ thống hiển thị cấu hình/phiên bản đã dùng, phần đã ghi/chưa ghi, lỗi, xung đột, người và thời điểm cùng lần xử lý liên quan. |
| **Luồng thay thế** | **2a.** Không có kết quả: thông báo và cho sửa bộ lọc.<br>**4a.** Phản hồi lưu chưa rõ: hiển thị trạng thái cần kiểm tra, không suy là thành công.<br>**4b.** Chi tiết vượt quyền: che hoặc từ chối phần tương ứng; Admin xem lịch sử không được xác nhận nhập lâm sàng thay Bác sĩ. |
| **Hậu điều kiện** | Truy được nguồn, kết quả và dấu vết từng lần nhập; thao tác tra cứu không sửa bệnh án, cấu hình hoặc trạng thái đã lưu. |

<a id="uc2-09"></a>

### UC2.09 — Xử lý lại lần nhập bị lỗi

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.09 — Xử lý lại lần nhập bị lỗi |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Bác sĩ có quyền; có lần nhập lỗi/chờ được xác định và nguyên nhân cần khắc phục. |
| **Luồng chính** | **1.** Bác sĩ mở lần nhập để xem phần chưa ghi và nguyên nhân qua [UC2.07](#uc2-07).<br>**2.** Bác sĩ sửa thông tin đích/nguồn được phép hoặc dùng file đã sửa; lỗi ánh xạ chung do Admin xử lý qua [UC2.11](#uc2-11).<br>**3.** Hệ thống kiểm tra trạng thái lần trước, dữ liệu nguồn và phiên bản đích; đọc, đối chiếu và hiển thị lại xem trước.<br>**4.** Bác sĩ kiểm tra phần đủ điều kiện và xác nhận qua [UC2.10](#uc2-10); hệ thống lưu kết quả lần xử lý mới gắn với lịch sử cũ. |
| **Luồng thay thế** | **2a.** Chưa có dữ liệu hoặc cấu hình đủ điều kiện: giữ chờ, không tự điền bù dữ liệu chuyên môn.<br>**3a.** Lần trước đã ghi nhưng mất phản hồi: trả kết quả đã ghi; không thực hiện lại phần đó như thao tác mới.<br>**3b.** Đích đã đổi hoặc còn xung đột: yêu cầu đối chiếu lại, không dùng bản xem trước cũ để ghi đè. |
| **Hậu điều kiện** | Lần nhập được xử lý lại có lịch sử và kết quả rõ; không nhân bản dữ liệu hoặc bỏ qua xác nhận, kiểm tra quyền/phiên bản. |

<a id="uc2-10"></a>

### UC2.10 — Xác nhận nhập dữ liệu vào bệnh án

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.10 — Xác nhận nhập dữ liệu vào bệnh án |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Bác sĩ có quyền ghi dữ liệu vào đúng hồ sơ/lượt; đã xem trước qua [UC2.01](#uc2-01), có ánh xạ và đích đối chiếu được. |
| **Luồng chính** | **1.** Hệ thống hiển thị mã BN, lượt khám, giá trị từ file, giá trị hiện có, phần thiếu/lỗi và xung đột.<br>**2.** Bác sĩ chọn phần đủ điều kiện, kiểm tra dữ liệu sẽ giữ/thay thế và yêu cầu xác nhận nhập.<br>**3.** Hệ thống kiểm tra lại quyền, cấu hình áp dụng, dữ liệu trùng/bản sửa và phiên bản đích tại thời điểm ghi.<br>**4.** Hệ thống lưu đúng phần được xác nhận vào bệnh án sản phẩm; giữ nguồn, mã lần nhập, người/thời điểm, phiên bản và kết quả từng phần. |
| **Luồng thay thế** | **1a.** Không xác định chắc hồ sơ/lượt hoặc thiếu quy tắc: giữ chờ/báo lỗi; không cho ghi theo suy đoán.<br>**2a.** NULL trong file không tự xóa giá trị đang có. Phần chưa đủ điều kiện không ghi như hợp lệ.<br>**3a.** Đích hoặc cấu hình liên quan đổi sau xem trước: yêu cầu kiểm tra lại bản xem trước và xác nhận lại.<br>**4a.** Lưu lỗi/chưa rõ kết quả: không báo thành công; thử lại cùng thao tác kiểm tra kết quả cũ để không nhân bản. |
| **Hậu điều kiện** | Dữ liệu được xác nhận nằm trong đúng bệnh án/lượt của sản phẩm, truy được phần đã ghi/chưa ghi. Đây là xác nhận nhập dữ liệu, khác xác nhận quyết định lâm sàng và không gửi trả HIS. |

<a id="uc2-11"></a>

### UC2.11 — Quản lý cấu hình nhập file

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC2.11 — Quản lý cấu hình nhập file |
| **Actor chính** | Admin được phân quyền. |
| **Tiền điều kiện** | Admin đã đăng nhập, có quyền quản lý cấu hình; có đặc tả file/nguồn và cấu trúc mẫu đích để đối chiếu. |
| **Luồng chính** | **1.** Admin chọn hoặc tạo cấu hình nguồn/ánh xạ nhập file.<br>**2.** Admin thiết lập cột nguồn, mã trường đích, quy tắc kiểu/đơn vị/ngày giờ và cách nhận diện mã hồ sơ/lượt theo đặc tả.<br>**3.** Hệ thống kiểm tra cấu hình, cho xem trước kết quả trên tệp mẫu, chỉ rõ ánh xạ thiếu/trùng/mâu thuẫn.<br>**4.** Admin lưu bản hợp lệ và phạm vi áp dụng; hệ thống giữ phiên bản để các lần nhập truy được cấu hình đã dùng. |
| **Luồng thay thế** | **3a.** Không có trường đích, sai kiểu hoặc quy tắc chuyển đổi chưa rõ: báo lỗi/giữ chưa áp dụng, không tự suy ra ánh xạ.<br>**4a.** Cập nhật cấu hình: tạo phiên bản mới, không đổi dấu vết các lần nhập đã hoàn tất; lần nhập chờ chịu ảnh hưởng phải kiểm tra lại trước xác nhận. |
| **Hậu điều kiện** | Có cấu hình nhập file được quản lý theo phiên bản. Admin thay cấu hình dùng chung, không nhập/sửa giá trị lâm sàng hoặc xác nhận nhập thay Bác sĩ; sửa cấu trúc mẫu qua [UC6.11](#uc6-11)/[UC6.08](#uc6-08). |

<a id="nhom-3"></a>

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
| **Hậu điều kiện** | Gợi ý có căn cứ/giới hạn được lưu; gợi ý chưa là chỉ định và không phải kết quả thực hiện. Kết quả thực đo mới được nhận qua [UC1.10](#uc1-10) hoặc [UC2.10](#uc2-10). |

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
| **Actor chính** | Kế thừa Bác sĩ của [UC3.01](#uc3-01)–[UC3.04](#uc3-04); hành vi kiểm tra được bao gồm. |
| **Tiền điều kiện** | Có yêu cầu hỗ trợ, module đích và bộ điều kiện áp dụng/đầu vào tương ứng. |
| **Luồng chính** | **1.** Hệ thống xác định module, ca bệnh và phiên bản dữ liệu sẽ dùng.<br>**2.** Hệ thống kiểm tra đối tượng áp dụng, dữ liệu bắt buộc, kiểu, đơn vị, nguồn/thời điểm và phiên bản quy tắc/mô hình được phép theo đặc tả.<br>**3.** Hệ thống xác định phần đủ điều kiện, dữ liệu thiếu/sai và kết quả trước cần xem lại.<br>**4.** Hệ thống trả trạng thái được đánh giá, đánh giá có giới hạn hoặc chưa đánh giá được cho module gọi. |
| **Luồng thay thế** | **2a.** Ngoài đối tượng hoặc thiếu dữ liệu bắt buộc: nêu nguyên nhân, không tạo kết quả vượt điều kiện áp dụng.<br>**2b.** Chưa xác định được quy tắc áp dụng: báo chưa hỗ trợ; dữ liệu thiếu không được suy thành giá trị bình thường. |
| **Hậu điều kiện** | Module nhận được đầu vào và giới hạn rõ ràng; kiểm tra không tự bổ sung dữ liệu lâm sàng chưa có hoặc mở quyền truy cập mới. |

<a id="uc3-06"></a>

### UC3.06 — Xem kết quả, căn cứ và cảnh báo

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.06 — Xem kết quả, căn cứ và cảnh báo |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền xem kết quả hỗ trợ của bệnh án/lượt được chọn. |
| **Luồng chính** | **1.** Người dùng chọn module và lần hỗ trợ cần xem.<br>**2.** Hệ thống kiểm tra quyền và lấy kết quả cùng dữ liệu/phiên bản liên quan.<br>**3.** Hệ thống hiển thị gợi ý, căn cứ, cảnh báo, phần thiếu và trạng thái đánh giá.<br>**4.** Người dùng xem chi tiết để đối chiếu; bác sĩ có thể phản hồi qua [UC4.02](#uc4-02). |
| **Luồng thay thế** | **2a.** Chưa có kết quả hoặc lần chạy lỗi: hiển thị đúng trạng thái, không trình bày như đã đánh giá thành công.<br>**3a.** Dữ liệu liên quan đã thay đổi: chỉ rõ kết quả cần xem lại và cho yêu cầu [UC3.08](#uc3-08) theo quyền. |
| **Hậu điều kiện** | Kết quả được xem với căn cứ và giới hạn; thao tác xem không tự chấp nhận gợi ý hoặc xác nhận kế hoạch. |

<a id="uc3-07"></a>

### UC3.07 — Xem lại các lần hỗ trợ

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.07 — Xem lại các lần hỗ trợ |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền xem lịch sử hỗ trợ của bệnh án/lượt. |
| **Luồng chính** | **1.** Người dùng mở lịch sử hỗ trợ và chọn module hoặc thời gian cần xem.<br>**2.** Hệ thống liệt kê các lần chạy với thời điểm, trạng thái và phiên bản áp dụng.<br>**3.** Người dùng chọn một lần hỗ trợ.<br>**4.** Hệ thống hiển thị kết quả, đầu vào hoặc tham chiếu phiên bản, căn cứ/cảnh báo và phản hồi bác sĩ khi có. |
| **Luồng thay thế** | **2a.** Chưa có lần hỗ trợ: thông báo chưa có lịch sử.<br>**4a.** Lần chạy dùng dữ liệu/quy tắc cũ: ghi rõ phiên bản và thời điểm, không trình bày như kết quả hiện hành. |
| **Hậu điều kiện** | Tra được lần hỗ trợ cùng nguồn gốc; lịch sử cũ được bảo toàn và không tự kích hoạt đánh giá lại. |

<a id="uc3-08"></a>

### UC3.08 — Yêu cầu đánh giá lại

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC3.08 — Yêu cầu đánh giá lại |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền yêu cầu đánh giá lại; có ca bệnh và module/lần hỗ trợ cần xem xét lại. |
| **Luồng chính** | **1.** Người dùng chọn ca, module và yêu cầu đánh giá lại.<br>**2.** Hệ thống lấy dữ liệu hiện hành, kể cả kết quả thực hiện mới và đầu ra liên quan; kiểm tra qua [UC3.05](#uc3-05).<br>**3.** Hệ thống thực hiện lần đánh giá mới theo module được yêu cầu và phạm vi quyền.<br>**4.** Hệ thống lưu lần chạy mới, giữ lịch sử cũ và hiển thị phần kết quả/kế hoạch dự thảo cần bác sĩ xem lại. |
| **Luồng thay thế** | **2a.** Chưa đủ dữ liệu hoặc ngoài điều kiện: chỉ trả phần được phép hoặc thông báo chưa đánh giá được.<br>**3a.** Module lỗi hoặc hết thời gian: ghi trạng thái lần thử, giữ dữ liệu và kết quả cũ có nhãn thời điểm.<br>**4a.** Kế hoạch đã xác nhận chịu ảnh hưởng: bác sĩ xem xét điều chỉnh qua [UC4.07](#uc4-07), không tự sửa quyết định đã xác nhận. |
| **Hậu điều kiện** | Có lần đánh giá mới hoặc trạng thái lỗi/giới hạn; xác định đúng phiên bản hỗ trợ bác sĩ xem, không ghi đè lịch sử hoặc tự thay kế hoạch. |

<a id="nhom-4"></a>

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
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền lập/sửa dự thảo và chọn đúng bệnh án/lượt. |
| **Luồng chính** | **1.** Người dùng mở dự thảo hiện có hoặc bắt đầu dự thảo kế hoạch.<br>**2.** Hệ thống hiển thị dữ liệu bệnh án, quyết định và gợi ý Treatment liên quan.<br>**3.** Bác sĩ lập/sửa phương án, hướng dẫn, thuốc và nội dung theo dõi phù hợp; sử dụng [UC4.04](#uc4-04), [UC4.05](#uc4-05) khi cần.<br>**4.** Hệ thống kiểm tra và lưu phiên bản dự thảo, giữ người/thời điểm cùng phần hỗ trợ cần xem lại. |
| **Luồng thay thế** | **1a.** Kế hoạch đã xác nhận: chuyển [UC4.07](#uc4-07) nếu có quyền, không sửa trực tiếp bản chính thức.<br>**4a.** Dữ liệu sai hoặc có xung đột sửa đồng thời: chỉ rõ nguyên nhân, yêu cầu bổ sung/xem bản mới trước lưu. |
| **Hậu điều kiện** | Dự thảo được lưu trong bệnh án để bác sĩ xem và xác nhận qua [UC4.06](#uc4-06); gợi ý AI hoặc thao tác lưu chưa làm kế hoạch thành chính thức. |

<a id="uc4-04"></a>

### UC4.04 — Lập phương án thuốc dự thảo

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.04 — Lập phương án thuốc dự thảo |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Bác sĩ có quyền cập nhật dự thảo kế hoạch của đúng hồ sơ/lượt. |
| **Luồng chính** | **1.** Bác sĩ mở phần thuốc trong dự thảo và nhập/sửa thuốc, liều, cách dùng, thời điểm dùng cùng thông tin liên quan theo phạm vi dữ liệu.<br>**2.** Hệ thống kiểm tra dữ liệu và chỉ rõ phần thiếu hoặc không hợp lệ.<br>**3.** Bác sĩ lưu phương án; hệ thống ghi phiên bản thuốc cùng người/thời điểm.<br>**4.** Hệ thống thể hiện trạng thái chưa rà soát/cần xem lại khi có thay đổi; Bác sĩ có thể yêu cầu [UC3.04](#uc3-04) cho đúng phiên bản trước khi xác nhận kế hoạch. |
| **Luồng thay thế** | **2a.** Chưa đủ thông tin bắt buộc cho thao tác: chỉ rõ phần cần bổ sung, không ghi như đơn chính thức.<br>**4a.** MedSafety chưa chạy, lỗi hoặc thiếu dữ liệu: giữ dự thảo, nêu chưa đánh giá được; không gắn nhãn an toàn.<br>**4b.** Thuốc, liều hoặc dữ liệu ảnh hưởng thay đổi: kết quả rà soát cũ cần xem lại, không áp dụng như đánh giá của bản mới. |
| **Hậu điều kiện** | Có phương án thuốc dự thảo gắn đúng phiên bản. Lập thuốc và rà soát MedSafety là hai ca liên quan; không bắt buộc mọi lần lưu nháp phải chạy module và không tự xác nhận đơn. |

<a id="uc4-05"></a>

### UC4.05 — Lập kế hoạch theo dõi và tái khám

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.05 — Lập kế hoạch theo dõi và tái khám |
| **Actor chính** | Bác sĩ được phân quyền. |
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
| **Hậu điều kiện** | Bản kế hoạch cụ thể được xác nhận trong đúng bệnh án/lượt và có dấu vết; công bố cho bệnh nhân là thao tác riêng qua [UC4.08](#uc4-08). Không ghi trả hoặc chờ HIS tiếp nhận trong demo. |

<a id="uc4-07"></a>

### UC4.07 — Lập bản điều chỉnh kế hoạch đã xác nhận

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.07 — Lập bản điều chỉnh kế hoạch đã xác nhận |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Bác sĩ có quyền điều chỉnh, có kế hoạch đã xác nhận và đúng phiên bản cần xem xét. |
| **Luồng chính** | **1.** Bác sĩ mở bản kế hoạch đã xác nhận, chọn lập bản điều chỉnh và ghi lý do.<br>**2.** Hệ thống tạo dự thảo phiên bản mới, giữ nguyên bản đã xác nhận và lịch sử hiệu lực.<br>**3.** Bác sĩ sửa nội dung, kiểm tra dữ liệu/cảnh báo và rà soát lại phần bị ảnh hưởng khi cần.<br>**4.** Bác sĩ lưu dự thảo; hệ thống lưu người/thời điểm và liên hệ với bản gốc để có thể tiếp tục chỉnh hoặc xác nhận sau qua [UC4.06](#uc4-06). |
| **Luồng thay thế** | **3a.** Bác sĩ hủy thay đổi: không thay bản đã xác nhận; lưu nháp chưa làm bản mới có hiệu lực.<br>**4a.** Xung đột phiên bản hoặc lỗi lưu: yêu cầu đối chiếu/kiểm tra trạng thái, không ghi đè bản chính thức. |
| **Hậu điều kiện** | Có bản điều chỉnh ở trạng thái dự thảo hoặc không thay đổi nếu hủy. Chỉ sau [UC4.06](#uc4-06) thành công mới xác định bản hiện hành theo hiệu lực; không dùng include để ép mọi lần chỉnh phải xác nhận. Lưu nháp chưa thay bản kế hoạch hoặc các nhắc đang có hiệu lực. |

<a id="uc4-08"></a>

### UC4.08 — Công bố kết quả và kế hoạch điều trị

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.08 — Công bố kết quả và kế hoạch điều trị |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền công bố; có nội dung đã xác nhận và đủ điều kiện cung cấp cho bệnh nhân. |
| **Luồng chính** | **1.** Người dùng chọn bệnh án/lượt và phần kết quả, kế hoạch thuốc, hướng dẫn/theo dõi được phép công bố.<br>**2.** Hệ thống kiểm tra phiên bản đã xác nhận, đối tượng nhận và phạm vi nội dung.<br>**3.** Người dùng xem trước và xác nhận công bố.<br>**4.** Hệ thống lưu phạm vi/phiên bản công bố, người/thời điểm và cho tài khoản liên kết hợp lệ xem theo [UC5.03](#uc5-03). |
| **Luồng thay thế** | **2a.** Nội dung là dự thảo, vượt phạm vi hoặc chưa đủ điều kiện: từ chối công bố phần đó, nêu lý do.<br>**4a.** Chưa có tài khoản liên kết hợp lệ: lưu nội dung công bố theo hồ sơ, chưa cấp quyền đọc cho tài khoản; việc truy cập chờ [UC1.04](#uc1-04). |
| **Hậu điều kiện** | Nội dung đủ điều kiện có trạng thái công bố riêng; không lộ ghi chú nội bộ/dự thảo. Xác nhận chuyên môn và công bố là hai trạng thái riêng; chưa có ghi trả HIS trong phạm vi demo. |

<a id="uc4-09"></a>

### UC4.09 — Cập nhật hoặc thu hồi nội dung đã công bố

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC4.09 — Cập nhật hoặc thu hồi nội dung đã công bố |
| **Actor chính** | Bác sĩ được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập, có quyền cập nhật/thu hồi và xác định được nội dung đã công bố. |
| **Luồng chính** | **1.** Người dùng chọn nội dung cần thay thế hoặc thu hồi và ghi lý do.<br>**2.** Hệ thống kiểm tra quyền, phiên bản và điều kiện của bản thay thế khi có.<br>**3.** Người dùng xem phạm vi ảnh hưởng và xác nhận thao tác.<br>**4.** Hệ thống cập nhật trạng thái công bố, giữ lịch sử và phản ánh phần được xem/nhắc tương lai theo phiên bản, hiệu lực được phép. |
| **Luồng thay thế** | **2a.** Bản thay thế chưa xác nhận hoặc chưa đủ điều kiện: chưa công bố bản thay thế; thu hồi chỉ thực hiện nếu người dùng yêu cầu và có quyền.<br>**4a.** Thao tác thất bại: giữ trạng thái đã lưu gần nhất và thông báo kết quả, không báo thu hồi thành công khi chưa thực hiện. |
| **Hậu điều kiện** | Bản bị thu hồi không còn được truy cập như nội dung công bố; lịch sử bệnh án vẫn giữ. Thu hồi hiển thị không tự là quyết định ngừng thuốc; nhắc xét kế hoạch hiện hành được phép. |

<a id="nhom-5"></a>

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
| **Hậu điều kiện** | Lịch hẹn dùng chung dữ liệu với [UC1.06](#uc1-06); chưa tự mở lượt hoặc cấp quyền xem bệnh án. Không mặc định có thanh toán hay chọn bác sĩ khi chưa chốt. |

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

<a id="nhom-6"></a>

## 9. Nhóm 6 — Quản trị hệ thống và dữ liệu dùng chung

<a id="uc6-01"></a>

### UC6.01 — Đăng ký tài khoản bệnh nhân

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.01 — Đăng ký tài khoản bệnh nhân |
| **Actor chính** | Bệnh nhân. |
| **Tiền điều kiện** | Chức năng bệnh nhân đã được triển khai theo giai đoạn; người đăng ký có thông tin để thực hiện cách xác minh được hỗ trợ. |
| **Luồng chính** | **1.** Bệnh nhân chọn đăng ký và nhập thông tin tài khoản theo biểu mẫu.<br>**2.** Hệ thống kiểm tra dữ liệu và khả năng tài khoản đã tồn tại.<br>**3.** Bệnh nhân thực hiện bước xác minh theo phương thức được áp dụng.<br>**4.** Hệ thống tạo/kích hoạt tài khoản bệnh nhân khi đủ điều kiện và thông báo kết quả. |
| **Luồng thay thế** | **2a.** Thông tin sai hoặc tài khoản đã tồn tại: nêu hướng xử lý, cho đăng nhập/khôi phục thay vì tạo trùng.<br>**3a.** Chưa xác minh được: chưa kích hoạt quyền cần xác minh, hướng dẫn thực hiện lại theo phương thức áp dụng. |
| **Hậu điều kiện** | Có tài khoản bệnh nhân đúng trạng thái; chưa có quyền xem bệnh án cho đến khi liên kết được xác minh qua [UC1.04](#uc1-04), không tự cấp vai trò nhân viên/bác sĩ. |

<a id="uc6-02"></a>

### UC6.02 — Đăng nhập, đăng xuất

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.02 — Đăng nhập, đăng xuất |
| **Actor chính** | Bác sĩ, Admin hoặc Bệnh nhân, theo vai trò; Bệnh nhân triển khai ở giai đoạn sau. |
| **Tiền điều kiện** | Khi đăng nhập: có tài khoản/phương thức xác thực được hỗ trợ. Khi đăng xuất: có phiên đang sử dụng. |
| **Luồng chính** | **1.** Người dùng mở trang đăng nhập dùng chung và cung cấp thông tin tài khoản.<br>**2.** Hệ thống xác thực, kiểm tra trạng thái tài khoản và quyền hiện hành.<br>**3.** Hệ thống tạo phiên hợp lệ theo quyền được cấp.<br>**4.** Hệ thống hiển thị các chức năng được phép để người dùng bắt đầu sử dụng. |
| **Luồng thay thế** | **1a.** Người dùng chọn đăng xuất từ phiên đang sử dụng: hệ thống kết thúc phiên, trở về màn hình truy cập và yêu cầu xác thực lại cho thao tác được bảo vệ.<br>**2a.** Xác thực thất bại hoặc tài khoản bị khóa: từ chối tạo phiên, thông báo phù hợp.<br>**3a.** Phiên hết hiệu lực: yêu cầu xác thực lại, chưa thực hiện thao tác được bảo vệ. |
| **Hậu điều kiện** | Đăng nhập thành công có phiên theo đúng quyền; đăng xuất kết thúc phiên. Bác sĩ/Admin vào đúng chức năng theo vai trò, không có trang chọn cổng riêng. Phần tài khoản bệnh nhân bổ sung theo lộ trình; đăng nhập không tự cấp quyền xem mọi hồ sơ. |

<a id="uc6-03"></a>

### UC6.03 — Cập nhật thông tin tài khoản

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.03 — Cập nhật thông tin tài khoản |
| **Actor chính** | Bác sĩ, Admin hoặc Bệnh nhân, theo vai trò; Bệnh nhân triển khai ở giai đoạn sau. |
| **Tiền điều kiện** | Đã đăng nhập và được phép cập nhật các trường cá nhân của tài khoản mình. |
| **Luồng chính** | **1.** Người dùng mở thông tin tài khoản.<br>**2.** Người dùng sửa các trường được phép.<br>**3.** Hệ thống kiểm tra dữ liệu và yêu cầu xác minh lại khi thay đổi thuộc trường cần xác minh.<br>**4.** Hệ thống lưu phần đủ điều kiện và ghi lịch sử thay đổi. |
| **Luồng thay thế** | **2a.** Yêu cầu đổi vai trò, quyền hoặc liên kết bệnh án ngoài phạm vi tự sửa: chuyển quy trình có thẩm quyền, chưa áp dụng thay đổi.<br>**3a.** Dữ liệu không hợp lệ hoặc chưa xác minh được: chỉ rõ phần chưa được cập nhật. |
| **Hậu điều kiện** | Thông tin tài khoản được cập nhật đúng quyền; không tự ghi đè thông tin bệnh án hoặc thay đổi liên kết/chức danh lâm sàng. |

<a id="uc6-04"></a>

### UC6.04 — Khôi phục truy cập tài khoản

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.04 — Khôi phục truy cập tài khoản |
| **Actor chính** | Bác sĩ, Admin hoặc Bệnh nhân, theo vai trò; Bệnh nhân triển khai ở giai đoạn sau. |
| **Tiền điều kiện** | Có yêu cầu khôi phục tài khoản và một phương thức xác minh được hỗ trợ. |
| **Luồng chính** | **1.** Người dùng yêu cầu khôi phục truy cập.<br>**2.** Hệ thống hoặc Admin có quyền thực hiện xác minh qua kênh/bằng chứng phù hợp với tài khoản.<br>**3.** Khi xác minh đạt yêu cầu, hệ thống cho thực hiện bước khôi phục theo phương thức áp dụng.<br>**4.** Hệ thống ghi kết quả/nhật ký và hướng dẫn đăng nhập lại. |
| **Luồng thay thế** | **2a.** Thiếu bằng chứng hoặc chỉ có CCCD/mã hồ sơ: chưa cho khôi phục hay đổi liên kết, hướng dẫn xác minh thêm.<br>**3a.** Mã/bằng chứng xác minh hết hiệu lực hoặc không hợp lệ: chưa đặt lại truy cập, thực hiện lại đúng cơ chế đã đặc tả; hỗ trợ của Admin phải có dấu vết. |
| **Hậu điều kiện** | Khôi phục đúng tài khoản khi đủ bằng chứng; không tự mở khóa, đổi quyền hoặc đổi liên kết bệnh án vượt thẩm quyền. |

<a id="uc6-05"></a>

### UC6.05 — Quản lý tài khoản người dùng

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.05 — Quản lý tài khoản người dùng |
| **Actor chính** | Admin được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền quản lý tài khoản trong phạm vi được giao. |
| **Luồng chính** | **1.** Người quản trị tra cứu tài khoản hoặc chọn cấp tài khoản nhân viên.<br>**2.** Hệ thống hiển thị thông tin và trạng thái được phép quản lý.<br>**3.** Người quản trị tạo/cập nhật, khóa hoặc mở khóa theo thẩm quyền.<br>**4.** Hệ thống kiểm tra, lưu trạng thái và áp dụng kiểm soát truy cập theo chính sách phiên, ghi nhật ký. |
| **Luồng thay thế** | **3a.** Cấp vai trò chuyên môn: phải đáp ứng quy trình phân quyền đã thống nhất; quyền Admin không tự cho phép quyết định hoặc xác nhận lâm sàng.<br>**4a.** Thông tin trùng, sai hoặc vượt thẩm quyền: từ chối phần thay đổi và nêu lý do. |
| **Hậu điều kiện** | Tài khoản có trạng thái đúng thẩm quyền; tài khoản khóa bị chặn theo chính sách. Cấp tài khoản không tự đủ để xác nhận chuyên môn. |

<a id="uc6-06"></a>

### UC6.06 — Quản lý vai trò và quyền truy cập

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.06 — Quản lý vai trò và quyền truy cập |
| **Actor chính** | Admin được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền thiết lập/cấp/thu hồi quyền trong phạm vi quản trị. |
| **Luồng chính** | **1.** Người quản trị chọn vai trò hoặc người dùng cần quản lý quyền.<br>**2.** Hệ thống hiển thị quyền thao tác và phạm vi hồ sơ hiện có.<br>**3.** Người quản trị thiết lập, cấp, thay đổi hoặc thu hồi quyền theo công việc được giao.<br>**4.** Hệ thống kiểm tra thẩm quyền, lưu thay đổi và áp dụng với các yêu cầu tiếp theo theo chính sách phiên, ghi nhật ký. |
| **Luồng thay thế** | **4a.** Cấp quyền vượt thẩm quyền hoặc không hợp lệ: từ chối và giữ cấu hình quyền trước đó.<br>**4b.** Phiên/màn hình cũ còn mở sau thu hồi: yêu cầu mới phải kiểm tra quyền hiện hành cả ở giao tiếp dữ liệu và tệp. |
| **Hậu điều kiện** | Quyền và phạm vi hồ sơ được cập nhật có dấu vết; quyền kỹ thuật không mặc nhiên là quyền bác sĩ xác nhận chuyên môn. |

<a id="uc6-07"></a>

### UC6.07 — Quản lý danh mục dùng chung

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.07 — Quản lý danh mục dùng chung |
| **Actor chính** | Admin được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền quản lý danh mục; nội dung chuyên môn có nguồn và cách rà soát phù hợp. |
| **Luồng chính** | **1.** Người quản trị chọn danh mục thuốc, xét nghiệm, đơn vị đo, cơ sở/khoa hoặc mã ánh xạ.<br>**2.** Hệ thống hiển thị các mục, trạng thái và phiên bản khi có.<br>**3.** Người quản trị thêm/sửa hoặc ngừng sử dụng mục theo thẩm quyền, kèm nguồn chuyên môn khi cần.<br>**4.** Hệ thống kiểm tra và lưu nội dung đủ điều kiện áp dụng, giữ lịch sử tham chiếu. |
| **Luồng thay thế** | **3a.** Ngừng mã đã được dùng: không cho chọn mới sau khi ngừng, vẫn đọc được dữ liệu lịch sử.<br>**4a.** Mã trùng, ánh xạ mâu thuẫn hoặc nội dung chuyên môn chưa được rà soát: chưa cho áp dụng, nêu lý do. |
| **Hậu điều kiện** | Danh mục đủ điều kiện được dùng thống nhất; sửa danh mục không tự viết lại dữ liệu lịch sử hoặc phê duyệt quy tắc lâm sàng mới. |

<a id="uc6-08"></a>

### UC6.08 — Quản lý phiên bản biểu mẫu

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.08 — Quản lý phiên bản biểu mẫu |
| **Actor chính** | Admin được phân quyền. |
| **Tiền điều kiện** | Admin có quyền quản lý phiên bản; đã có cấu trúc mẫu hợp lệ, bao gồm phần được tạo/chỉnh qua [UC6.11](#uc6-11). |
| **Luồng chính** | **1.** Admin mở danh sách phiên bản của mẫu, xem bản đang áp dụng và các lượt đã gắn từng bản.<br>**2.** Admin chọn bản hợp lệ để áp dụng cho lượt mới hoặc ngừng áp dụng cho lượt mới theo quyền.<br>**3.** Hệ thống kiểm tra cấu trúc, các trường tham chiếu, phạm vi và xung đột trước khi thay đổi bản mặc định.<br>**4.** Admin xác nhận; hệ thống lưu trạng thái áp dụng, người/thời điểm và lịch sử, dùng đúng bản được chọn khi tạo lượt mới. |
| **Luồng thay thế** | **2a.** Muốn dùng lại bản cũ: chỉ chọn bản còn đủ điều kiện, tạo một thay đổi áp dụng mới và giữ lịch sử.<br>**3a.** Bản chưa hợp lệ hoặc trường tham chiếu mâu thuẫn: chưa áp dụng, giữ cấu hình hợp lệ trước đó.<br>**4a.** Lượt cũ vẫn ghim phiên bản đã dùng. Chuyển mẫu cho lượt cũ nếu phát triển phải là thao tác rõ ràng, có đối chiếu dữ liệu và lịch sử; không tự chuyển toàn bộ. |
| **Hậu điều kiện** | Phiên bản áp dụng được quản lý và truy vết. Thay bản mặc định không đổi ngầm nghĩa, đơn vị, kiểu hoặc giá trị lịch sử; cấu hình nhập file thuộc [UC2.11](#uc2-11). |

<a id="uc6-09"></a>

### UC6.09 — Tra cứu nhật ký hệ thống

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.09 — Tra cứu nhật ký hệ thống |
| **Actor chính** | Admin được phân quyền. |
| **Tiền điều kiện** | Đã đăng nhập và có quyền tra nhật ký trong phạm vi được giao; có sự kiện được hệ thống ghi nhận. |
| **Luồng chính** | **1.** Người quản trị chọn tiêu chí theo người, thời gian, thao tác hoặc đối tượng.<br>**2.** Hệ thống tìm các sự kiện được phép xem.<br>**3.** Người quản trị chọn sự kiện cần kiểm tra.<br>**4.** Hệ thống hiển thị thao tác, kết quả, thay đổi trước/sau và mã lần nhập, hồ sơ/lượt và phiên bản liên quan khi có, che phần không được phép. |
| **Luồng thay thế** | **2a.** Không có kết quả: thông báo và cho sửa điều kiện tra cứu.<br>**4a.** Chi tiết có dữ liệu nhạy cảm vượt quyền: giới hạn hiển thị; không lộ mật khẩu, mã xác thực hoặc bệnh án ngoài phạm vi. |
| **Hậu điều kiện** | Tra được sự kiện phù hợp quyền mà không sửa/xóa nhật ký; các thao tác, thay đổi và lỗi quyền được ghi theo danh mục sự kiện đã chọn. |

<a id="uc6-11"></a>

### UC6.11 — Quản lý biểu mẫu và trường dữ liệu

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.11 — Quản lý biểu mẫu và trường dữ liệu |
| **Actor chính** | Admin được phân quyền. |
| **Tiền điều kiện** | Admin đăng nhập, có quyền quản lý cấu trúc mẫu và xác định được mẫu cần chỉnh. |
| **Luồng chính** | **1.** Admin mở cấu trúc nhóm/trường của mẫu bệnh án.<br>**2.** Admin thêm hoặc sửa mã, nhãn, kiểu dữ liệu, đơn vị, lựa chọn, thứ tự hiển thị và trạng thái theo phạm vi được phép.<br>**3.** Hệ thống kiểm tra cấu hình, mã trùng, kiểu/giá trị lựa chọn và cho xem trước biểu mẫu.<br>**4.** Admin lưu bản hợp lệ; hệ thống tạo phiên bản cấu trúc mới, giữ lịch sử; quản lý bản áp dụng cho lượt mới qua [UC6.08](#uc6-08). |
| **Luồng thay thế** | **3a.** Cấu hình không hợp lệ hoặc trùng mã: chỉ rõ lỗi, chưa áp dụng.<br>**2a.** Sửa/ngừng dùng trường đã có dữ liệu: không xóa giá trị hoặc đổi ngầm nghĩa của trường trên mẫu cũ; tạo phiên bản phù hợp.<br>**4a.** Lưu lỗi hoặc xung đột: không báo thành công; Bác sĩ tiếp tục dùng mẫu hợp lệ đã gắn với lượt. |
| **Hậu điều kiện** | Có cấu trúc mẫu/phiên bản mới dùng chung theo quy trình áp dụng. Admin chỉnh định nghĩa trường; Bác sĩ nhập giá trị tại [UC1.08](#uc1-08)/[UC1.10](#uc1-10), không sửa định nghĩa hoặc làm mất dữ liệu cũ. |

<a id="uc6-12"></a>

### UC6.12 — Sao lưu dữ liệu

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.12 — Sao lưu dữ liệu |
| **Actor chính** | Admin được phân quyền. |
| **Tiền điều kiện** | Admin có quyền sao lưu; đã xác định phạm vi ứng dụng, nơi lưu và cách kiểm tra bản sao. |
| **Luồng chính** | **1.** Admin chọn tạo bản sao theo phạm vi dữ liệu đã xác định.<br>**2.** Hệ thống kiểm tra quyền và thu thập dữ liệu nhất quán: hồ sơ/lượt, mẫu/phiên bản, tài khoản/quyền, lần nhập, nhật ký và các tệp/tham chiếu cần thiết.<br>**3.** Hệ thống tạo bản sao, lưu thời điểm, phiên bản ứng dụng/cấu trúc và thông tin cần đối chiếu.<br>**4.** Hệ thống kiểm tra khả năng đọc/tính đầy đủ theo phương pháp được đặc tả, ghi kết quả và nhật ký cho Admin tra cứu. |
| **Luồng thay thế** | **2a.** Không đủ quyền, không truy cập được nơi lưu hoặc không thu được dữ liệu nhất quán: dừng/báo lỗi, không báo có bản sao hợp lệ.<br>**3a.** Tạo tệp thất bại hoặc thiếu thành phần: đánh dấu lỗi, không thay nhãn bản lỗi thành thành công.<br>**4a.** Tạo bản sao xong chưa chứng minh khôi phục được: thực hiện thử qua [UC6.13](#uc6-13) trên môi trường riêng. |
| **Hậu điều kiện** | Có bản sao và kết quả kiểm tra truy được theo quyền. Kho/volume đang chứa dữ liệu hoạt động không tự là bản sao lưu, và tạo sao lưu chưa đồng nghĩa đã thử khôi phục đạt. |

<a id="uc6-13"></a>

### UC6.13 — Khôi phục dữ liệu

| Thành phần | Nội dung |
|---|---|
| **Tên Use Case** | UC6.13 — Khôi phục dữ liệu |
| **Actor chính** | Admin được phân quyền. |
| **Tiền điều kiện** | Admin có quyền khôi phục kỹ thuật; có bản sao và phạm vi đích hợp lệ. Thử nghiệm khôi phục thực hiện trên môi trường riêng trước khi đánh giá sử dụng. |
| **Luồng chính** | **1.** Admin chọn bản sao, kiểm tra thông tin phiên bản/phạm vi và đích khôi phục.<br>**2.** Hệ thống kiểm tra quyền, khả năng đọc, tính đầy đủ và tương thích cần thiết; hiển thị phạm vi dữ liệu bị tác động.<br>**3.** Admin xác nhận thao tác kỹ thuật; hệ thống khôi phục các thành phần được phép trong phạm vi đã chọn và ghi quá trình xử lý.<br>**4.** Hệ thống đối chiếu hồ sơ/lượt, mẫu/phiên bản, tài khoản/quyền, nguồn/lần nhập và các tệp cần thiết; báo kết quả kiểm tra, lưu nhật ký. |
| **Luồng thay thế** | **2a.** Bản sao hỏng, thiếu thành phần hoặc không tương thích: chưa khôi phục, nêu lỗi và không báo thành công.<br>**3a.** Admin hủy hoặc đích không đúng phạm vi: không ghi dữ liệu đích.<br>**3b.** Khôi phục bị lỗi/gián đoạn: báo đúng trạng thái, kiểm tra dữ liệu đích trước khi xử lý tiếp; không cho coi trạng thái dở dang là hoàn tất. |
| **Hậu điều kiện** | Có kết quả khôi phục được đối chiếu và nhật ký hoặc trạng thái lỗi rõ. Đây là quyền kỹ thuật có phạm vi riêng, không cấp quyền sửa/xác nhận bệnh án hằng ngày và không tự biến dự thảo thành quyết định bác sĩ. |

## 10. Nội dung cần cụ thể hóa trước triển khai và nghiệm thu

Cụm “theo quy tắc/điều kiện đã đặc tả” không có nghĩa điều kiện đó đã được bệnh viện xác nhận. Nhóm tiếp tục làm rõ theo giai đoạn; không tự đặt ngưỡng y khoa hoặc giả định đã có đủ dữ liệu.

| Phần phụ thuộc | Nội dung cần chốt |
|---|---|
| Hồ sơ và quyền | Hành chính tối thiểu; đối chiếu trùng; liên kết mã nguồn/tài khoản; phạm vi hồ sơ và quyền từng thao tác. |
| Lượt khám và lịch | Chuyển trạng thái và điều kiện hoàn tất; sức chứa, xác nhận/đổi/hủy lịch; không gộp lịch hẹn với lượt. |
| Nhập file | Cấu trúc, định danh người/lượt, ánh xạ cột, đơn vị, ngày giờ; phần thiếu/lỗi, bản sửa, chọn giữ/thay và kết quả ghi từng phần. |
| Mẫu và danh mục | Kiểu/trạng thái từng trường, định nghĩa NULL/Không/rỗng, quy tắc phát hành và áp dụng phiên bản; xử lý chuyển mẫu khi cần. |
| AI-CDSS | Đối tượng, bộ đầu vào/đầu ra, nguồn/phiên bản quy tắc hoặc mô hình, điều kiện đánh giá lại và bộ ca có kết quả kỳ vọng được chuyên môn rà soát. |
| Quyết định và công bố | Điều kiện xác nhận/hiệu lực kế hoạch, lý do điều chỉnh, nội dung chia sẻ và cơ chế thay thế/thu hồi. |
| Thông báo và nhắc | Sự kiện tạo thông báo, thời điểm/kênh, quyền xem, chống trùng, trạng thái gửi/nhận và cập nhật khi lịch/kế hoạch đổi. |
| Sao lưu và khôi phục | Phạm vi nhất quán, thành phần tệp, nơi lưu, quyền kỹ thuật, cách kiểm tra bản sao và khôi phục thử trên môi trường riêng. |
