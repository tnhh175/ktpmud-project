# User Story kiểm tra INVEST và tiêu chí nghiệm thu BDD

**Phiên bản:** 1.0 · **Ngày cập nhật:** 31/10/2026

Tài liệu gồm 33 User Story, bảng kiểm INVEST và 50 Scenario BDD dự kiến của Hệ thống quản lý bệnh nhân suy tim. Giữ các mã US và BDD01–BDD45 đã có; BDD46–BDD50 bổ sung tiêu chí trực tiếp cho đăng ký, đăng nhập và cập nhật/quản lý tài khoản. Đây là đặc tả nghiệm thu, chưa phải kết quả kiểm thử đã chạy đạt.

Tài liệu đi cùng [SRS v1.0](SRS-v1.0.md) và [Đặc tả Use Case đầy đủ](<Đặc tả usecase đầy đủ.md>). FR và các quan hệ truy vết được quản lý tại [RTM trong SRS](SRS-v1.0.md#truy-vet), không lặp cột FR trong bảng Story.

## Mục lục

- [1 Phạm vi và cách sử dụng](#quy-uoc)
- [2 Danh mục User Story](#user-stories)
- [3 Bảng kiểm INVEST](#invest)
- [4 Liên kết Story với tiêu chí nghiệm thu](#story-bdd)
- [5 Kịch bản Gherkin BDD](#bdd)
- [6 Điều kiện trước kiểm thử](#dieu-kien)

<a id="quy-uoc"></a>

## 1 Phạm vi và cách sử dụng

Ưu tiên P1/P2/P3 kế thừa SRS; mức ưu tiên không thay thứ tự xây. Nhóm 1, 2, 6 được làm trước, nhập tay rồi nhập file; AI và kế hoạch sau khi dữ liệu ổn định; bệnh nhân sau luồng chính. Các Story tổng hợp sẽ được tách thành công việc nhỏ khi lập Sprint, không tự đổi mã đang dùng trong report.

Nhân viên y tế là tác nhân nghiệp vụ theo quyền; demo vẫn dùng Bác sĩ/Admin. Admin không tự có quyền nhập/xác nhận lâm sàng. Bác sĩ quyết định chuyên môn cuối cùng. HIS/EMR cung cấp file, Bác sĩ xem trước và xác nhận ghi vào bệnh án sản phẩm; không mô phỏng nguồn viện hoặc ghi trả HIS. Lưu dữ liệu, xác nhận chuyên môn và công bố cho bệnh nhân là các thao tác khác nhau.

<a id="user-stories"></a>

## 2 Danh mục User Story

### Nhóm 1 Hồ sơ bệnh án và lượt khám

| Mã | Là | Tôi muốn | Để | Ưu tiên |
| --- | --- | --- | --- | --- |
| <a id="us-001"></a>US-001 | Bác sĩ hoặc nhân viên y tế theo quyền | Tra cứu, tạo và bổ sung hồ sơ đúng người bệnh | Duy trì thông tin nhận diện để khám và cập nhật | P1 |
| <a id="us-002"></a>US-002 | Bác sĩ hoặc nhân viên y tế theo quyền | Liên kết tài khoản bệnh nhân sau xác minh | Cấp đúng quyền xem phần đã công bố | P3 |
| <a id="us-003"></a>US-003 | Nhân viên y tế được giao quản lý lịch | Quản lý khung giờ, sức chứa và lịch hẹn | Tiếp nhận đăng ký trên cùng dữ liệu lịch | P1 |
| <a id="us-004"></a>US-004 | Bác sĩ; nhân viên y tế hỗ trợ tiếp nhận theo quyền | Mở lượt, cập nhật trạng thái và hoàn tất khi đủ điều kiện | Theo dõi công việc khám đúng hồ sơ và lượt | P1 |
| <a id="us-005"></a>US-005 | Bác sĩ hoặc nhân viên y tế theo quyền | Nhập, lưu và mở lại dữ liệu khám trên biểu mẫu | Có dữ liệu chung đáng tin cậy cho lượt khám | P1 |
| <a id="us-006"></a>US-006 | Bác sĩ | Ghi chỉ định và kết quả cận lâm sàng thực tế | Có căn cứ đánh giá, phân biệt với gợi ý của AI | P1 |
| <a id="us-007"></a>US-007 | Bác sĩ hoặc nhân viên y tế theo quyền | Tra cứu lịch sử khám, thuốc và điều trị | Đối chiếu diễn biến đúng hồ sơ, lượt và thời điểm | P1 |

### Nhóm 2 Tiếp nhận và tiền xử lý dữ liệu

| Mã | Là | Tôi muốn | Để | Ưu tiên |
| --- | --- | --- | --- | --- |
| <a id="us-008"></a>US-008 | Bác sĩ | Nhập và đối chiếu file từ HIS với đúng hồ sơ và lượt | Tận dụng dữ liệu có sẵn và nhận biết phần thiếu | P1 |
| <a id="us-009"></a>US-009 | Bác sĩ | Tra lịch sử nhận và kiểm tra kết quả từng lần nhập | Biết phần đã ghi, còn chờ hoặc cần xử lý | P1 |
| <a id="us-011"></a>US-011 | Bác sĩ | Xử lý lại lần nhập lỗi sau khi khắc phục | Bổ sung dữ liệu mà không nhân bản hoặc ghi đè âm thầm | P1 |
| <a id="us-036"></a>US-036 | Bác sĩ | Xem trước và xác nhận phần dữ liệu được nhập vào bệnh án | Kiểm soát giá trị mới, xung đột và đích nhận | P1 |

### Nhóm 3 Hỗ trợ chuyên môn AI CDSS

| Mã | Là | Tôi muốn | Để | Ưu tiên |
| --- | --- | --- | --- | --- |
| <a id="us-012"></a>US-012 | Bác sĩ | Nhận hỗ trợ Diagnosis kèm căn cứ và giới hạn | Có thêm cơ sở xem xét kết luận | P2 |
| <a id="us-013"></a>US-013 | Bác sĩ | Nhận gợi ý Lab/Test kèm lý do và ưu tiên | Cân nhắc chỉ định cận lâm sàng cần thiết | P2 |
| <a id="us-014"></a>US-014 | Bác sĩ | Nhận gợi ý Treatment và yêu cầu theo dõi liên quan | Xây dựng phương án từ dữ liệu thực đo và bệnh cảnh | P2 |
| <a id="us-015"></a>US-015 | Bác sĩ | Rà soát MedSafety theo phương án thuốc đang xem | Nhận biết nguy cơ và phần chưa kiểm tra được | P2 |
| <a id="us-016"></a>US-016 | Bác sĩ; nhân viên y tế được quyền xem | Tra các lần hỗ trợ; Bác sĩ yêu cầu đánh giá lại khi cần | Dùng kết quả gắn đúng dữ liệu và phiên bản hiện hành | P2 |

### Nhóm 4 Kết luận và kế hoạch điều trị

| Mã | Là | Tôi muốn | Để | Ưu tiên |
| --- | --- | --- | --- | --- |
| <a id="us-017"></a>US-017 | Bác sĩ | Ghi kết luận, hướng xử trí và phản hồi gợi ý | Lưu rõ quyết định chuyên môn trong bệnh án | P1 |
| <a id="us-018"></a>US-018 | Bác sĩ | Lập dự thảo phương án, thuốc, hướng dẫn và theo dõi | Chuẩn bị kế hoạch cụ thể trước khi xác nhận | P1 |
| <a id="us-019"></a>US-019 | Bác sĩ | Xác nhận và lưu đúng phiên bản kế hoạch | Có kế hoạch chính thức đã được tôi xem xét | P1 |
| <a id="us-020"></a>US-020 | Bác sĩ | Điều chỉnh kế hoạch bằng phiên bản mới và xác nhận lại | Cập nhật điều trị đúng hiệu lực và giữ lịch sử | P1 |
| <a id="us-021"></a>US-021 | Bác sĩ | Công bố phần kết quả và kế hoạch được phép | Cung cấp đúng thông tin đã xác nhận cho bệnh nhân | P1 |
| <a id="us-022"></a>US-022 | Bác sĩ | Thay thế hoặc thu hồi nội dung đã công bố | Kiểm soát bản được xem và giữ lịch sử chia sẻ | P1 |

### Nhóm 5 Hỗ trợ bệnh nhân ngoại trú

| Mã | Là | Tôi muốn | Để | Ưu tiên |
| --- | --- | --- | --- | --- |
| <a id="us-023"></a>US-023 | Bệnh nhân | Đặt và xem lịch khám, tái khám | Chủ động thời gian và biết trạng thái lịch hẹn | P3 |
| <a id="us-024"></a>US-024 | Bệnh nhân | Xem kết quả, thuốc và hướng dẫn đã công bố cho mình | Nắm thông tin và kế hoạch đang áp dụng | P3 |
| <a id="us-025"></a>US-025 | Bệnh nhân | Nhận thông báo, nhắc khám và nhắc thuốc | Nhớ các mốc trong kế hoạch được phép cung cấp | P3 |

### Nhóm 6 Quản trị hệ thống và dữ liệu dùng chung

| Mã | Là | Tôi muốn | Để | Ưu tiên |
| --- | --- | --- | --- | --- |
| <a id="us-026"></a>US-026 | Bệnh nhân | Đăng ký và xác minh tài khoản | Sử dụng chức năng bệnh nhân được cấp | P3 |
| <a id="us-027"></a>US-027 | Người dùng theo vai trò | Đăng nhập, đăng xuất và cập nhật tài khoản được phép | Sử dụng hệ thống đúng quyền và bảo vệ phiên | P1 |
| <a id="us-028"></a>US-028 | Người dùng theo vai trò | Khôi phục truy cập qua xác minh hoặc Admin có quyền | Lấy lại tài khoản mà không cấp nhầm quyền bệnh án | P1 |
| <a id="us-029"></a>US-029 | Admin | Quản lý tài khoản và cấp, đổi, thu hồi quyền | Giới hạn thao tác theo vai trò và phạm vi hồ sơ | P1 |
| <a id="us-030"></a>US-030 | Admin | Quản lý trường và phiên bản mẫu bệnh án | Điều chỉnh biểu mẫu dùng chung mà giữ lượt cũ | P1 |
| <a id="us-031"></a>US-031 | Admin | Quản lý cấu hình nhập file và danh mục đối chiếu | Áp dụng quy tắc nhất quán, có phạm vi và phiên bản | P1 |
| <a id="us-033"></a>US-033 | Admin | Tra nhật ký theo người, thời gian, thao tác và đối tượng | Kiểm tra thay đổi và xử lý sự cố theo quyền | P1 |
| <a id="us-035"></a>US-035 | Admin | Sao lưu và thử khôi phục dữ liệu | Khôi phục được hồ sơ và cấu trúc khi có sự cố | P1 |

<a id="invest"></a>

## 3 Bảng kiểm INVEST

I: có thể thực hiện/kiểm tra tương đối độc lập; N: có thể thảo luận; V: có giá trị người dùng; E: đủ rõ để ước lượng; S: đủ nhỏ cho Sprint; T: có thể xác định kết quả kiểm thử. **✓** là phù hợp sơ bộ về cách viết; **△** là cần làm rõ/tách khi chọn vào Sprint. Không có dấu nào chứng minh đã triển khai hoặc kiểm thử đạt. E đều để △ vì nhóm chưa ước lượng công việc; không tự gán Story Point hoặc thời gian.

| Story | I | N | V | E | S | T |
| --- | --- | --- | --- | --- | --- | --- |
| [US-001](#us-001) | ✓ | ✓ | ✓ | △ | △ | △ |
| [US-002](#us-002) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-003](#us-003) | ✓ | ✓ | ✓ | △ | △ | △ |
| [US-004](#us-004) | △ | ✓ | ✓ | △ | △ | △ |
| [US-005](#us-005) | △ | ✓ | ✓ | △ | △ | ✓ |
| [US-006](#us-006) | △ | ✓ | ✓ | △ | △ | ✓ |
| [US-007](#us-007) | ✓ | ✓ | ✓ | △ | ✓ | ✓ |
| [US-008](#us-008) | △ | ✓ | ✓ | △ | △ | △ |
| [US-009](#us-009) | △ | ✓ | ✓ | △ | ✓ | ✓ |
| [US-011](#us-011) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-012](#us-012) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-013](#us-013) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-014](#us-014) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-015](#us-015) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-016](#us-016) | △ | ✓ | ✓ | △ | △ | ✓ |
| [US-017](#us-017) | △ | ✓ | ✓ | △ | △ | ✓ |
| [US-018](#us-018) | △ | ✓ | ✓ | △ | △ | △ |
| [US-019](#us-019) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-020](#us-020) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-021](#us-021) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-022](#us-022) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-023](#us-023) | △ | ✓ | ✓ | △ | △ | △ |
| [US-024](#us-024) | △ | ✓ | ✓ | △ | ✓ | ✓ |
| [US-025](#us-025) | △ | ✓ | ✓ | △ | △ | △ |
| [US-026](#us-026) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-027](#us-027) | ✓ | ✓ | ✓ | △ | △ | ✓ |
| [US-028](#us-028) | △ | ✓ | ✓ | △ | ✓ | △ |
| [US-029](#us-029) | ✓ | ✓ | ✓ | △ | △ | ✓ |
| [US-030](#us-030) | △ | ✓ | ✓ | △ | △ | ✓ |
| [US-031](#us-031) | △ | ✓ | ✓ | △ | △ | △ |
| [US-033](#us-033) | ✓ | ✓ | ✓ | △ | ✓ | ✓ |
| [US-035](#us-035) | △ | ✓ | ✓ | △ | △ | △ |
| [US-036](#us-036) | △ | ✓ | ✓ | △ | ✓ | △ |

Các dấu △ được xử lý theo nhóm sau:

| Phần cần làm rõ | Cách xử lý trước Sprint |
| --- | --- |
| Story gồm nhiều thao tác | Tách task hoặc Story con như tạo/tra cứu/sửa, nhập/xem trước, cấu trúc/phát hành mẫu, sao lưu/khôi phục; giữ mã tổng hợp để truy vết. |
| Phụ thuộc hồ sơ, dữ liệu, quyền | Nêu dữ liệu tiền điều kiện có thể chuẩn bị riêng; phân định phần làm ở Sprint trước, không buộc mọi kiểm thử đi qua cả chuỗi UI. |
| Quy tắc hoặc tiêu chí chưa chốt | Làm rõ xác minh, chuyển trạng thái, điều kiện xác nhận, cấu trúc file và quy tắc chuyên môn trước kiểm thử phần tương ứng. |
| Ước lượng | Nhóm thực hiện ước lượng sau khi có cấu trúc dữ liệu/API và phạm vi được chọn; chưa suy từ dấu ✓ rằng công việc đã đủ nhỏ hoặc cam kết xong. |

<a id="story-bdd"></a>

## 4 Liên kết Story với tiêu chí nghiệm thu

Một Scenario có thể dùng chung cho nhiều Story. Bảng này liệt kê tiêu chí trực tiếp, không tự tạo quan hệ bằng cách lấy mọi BDD của FR gán cho mọi Story liên quan. Phạm vi ngoại lệ chi tiết tiếp tục đối chiếu Use Case và Test Case khi triển khai.

| Story | Tiêu chí nghiệm thu |
| --- | --- |
| [US-001](#us-001) | [BDD01](#bdd01), [BDD40](#bdd40) |
| [US-002](#us-002) | [BDD20](#bdd20), [BDD14](#bdd14) |
| [US-003](#us-003) | [BDD39](#bdd39), [BDD10](#bdd10) |
| [US-004](#us-004) | [BDD17](#bdd17) |
| [US-005](#us-005) | [BDD02](#bdd02), [BDD09](#bdd09), [BDD43](#bdd43) |
| [US-006](#us-006) | [BDD18](#bdd18), [BDD21](#bdd21) |
| [US-007](#us-007) | [BDD18](#bdd18) |
| [US-008](#us-008) | [BDD15](#bdd15), [BDD03](#bdd03), [BDD16](#bdd16) |
| [US-009](#us-009) | [BDD44](#bdd44), [BDD05](#bdd05) |
| [US-011](#us-011) | [BDD05](#bdd05), [BDD06](#bdd06), [BDD41](#bdd41) |
| [US-012](#us-012) | [BDD12](#bdd12), [BDD38](#bdd38) |
| [US-013](#us-013) | [BDD21](#bdd21), [BDD12](#bdd12) |
| [US-014](#us-014) | [BDD22](#bdd22), [BDD12](#bdd12) |
| [US-015](#us-015) | [BDD23](#bdd23), [BDD12](#bdd12) |
| [US-016](#us-016) | [BDD24](#bdd24), [BDD45](#bdd45) |
| [US-017](#us-017) | [BDD25](#bdd25) |
| [US-018](#us-018) | [BDD26](#bdd26), [BDD23](#bdd23) |
| [US-019](#us-019) | [BDD42](#bdd42), [BDD13](#bdd13), [BDD41](#bdd41) |
| [US-020](#us-020) | [BDD27](#bdd27), [BDD13](#bdd13), [BDD42](#bdd42) |
| [US-021](#us-021) | [BDD28](#bdd28), [BDD14](#bdd14) |
| [US-022](#us-022) | [BDD29](#bdd29), [BDD14](#bdd14) |
| [US-023](#us-023) | [BDD10](#bdd10), [BDD39](#bdd39) |
| [US-024](#us-024) | [BDD14](#bdd14), [BDD20](#bdd20) |
| [US-025](#us-025) | [BDD30](#bdd30), [BDD31](#bdd31), [BDD32](#bdd32) |
| [US-026](#us-026) | [BDD46](#bdd46), [BDD47](#bdd47), [BDD20](#bdd20) |
| [US-027](#us-027) | [BDD50](#bdd50), [BDD19](#bdd19), [BDD48](#bdd48) |
| [US-028](#us-028) | [BDD33](#bdd33) |
| [US-029](#us-029) | [BDD49](#bdd49), [BDD37](#bdd37), [BDD08](#bdd08) |
| [US-030](#us-030) | [BDD07](#bdd07), [BDD35](#bdd35), [BDD08](#bdd08) |
| [US-031](#us-031) | [BDD36](#bdd36) |
| [US-033](#us-033) | [BDD34](#bdd34) |
| [US-035](#us-035) | [BDD11](#bdd11) |
| [US-036](#us-036) | [BDD03](#bdd03), [BDD04](#bdd04), [BDD05](#bdd05), [BDD06](#bdd06), [BDD41](#bdd41) |

<a id="bdd"></a>

## 5 Kịch bản Gherkin BDD

Các khối dưới dùng cú pháp Gherkin với Feature, Scenario, Given, When, Then và tag truy vết. Nội dung vẫn ở mức tiêu chí hành vi; dữ liệu cụ thể, endpoint, mã lỗi và step definitions được bổ sung khi tạo bộ kiểm thử chạy được. Chưa tuyên bố đây là bộ test tự động hoặc đã phủ mọi nhánh của toàn sản phẩm.

<a id="bdd01"></a>

### BDD01 Tạo hồ sơ có mã BN

```gherkin
Feature: Tạo hồ sơ có mã BN
  @US_001 @BDD01
  Scenario: BDD01 Tạo hồ sơ có mã BN
    Given Bác sĩ có quyền, thông tin người bệnh chưa có mã
    When Tạo hồ sơ với hành chính tối thiểu đã quy định
    Then Cấp mã BN duy nhất, lưu người/thời điểm; chưa buộc có dữ liệu khám.
```

<a id="bdd02"></a>

### BDD02 Lưu và mở lại dữ liệu theo mẫu

```gherkin
Feature: Lưu và mở lại dữ liệu theo mẫu
  @US_005 @BDD02
  Scenario: BDD02 Lưu và mở lại dữ liệu theo mẫu
    Given Có lượt theo mẫu hiện hành; một trường chưa biết, trường khác là Không/0 hợp lệ
    When Nhập, lưu rồi mở lại lượt khám
    Then Giữ đúng dữ liệu đã lưu, đúng lượt và phiên bản mẫu; phân biệt NULL, Không và 0.
```

<a id="bdd03"></a>

### BDD03 Chặn nhập sai người bệnh hoặc lượt

```gherkin
Feature: Chặn nhập sai người bệnh hoặc lượt
  @US_008 @US_036 @BDD03
  Scenario: BDD03 Chặn nhập sai người bệnh hoặc lượt
    Given file có mã người bệnh/lượt không khớp
    When Yêu cầu xem trước hoặc xác nhận nhập
    Then Nêu phần chưa đối chiếu được; không ghi vào lượt đang mở theo suy đoán.
```

<a id="bdd04"></a>

### BDD04 Xác nhận phần dữ liệu nhập hợp lệ

```gherkin
Feature: Xác nhận phần dữ liệu nhập hợp lệ
  @US_036 @BDD04
  Scenario: BDD04 Xác nhận phần dữ liệu nhập hợp lệ
    Given Tệp có phần hợp lệ, NULL và giá trị khác dữ liệu đích
    When Bác sĩ xem trước, chọn phần và xác nhận
    Then Chỉ ghi phần được phép; NULL không tự xóa giá trị đang có; lưu kết quả từng phần và lịch sử.
```

<a id="bdd05"></a>

### BDD05 Thử lại thao tác đã lưu

```gherkin
Feature: Thử lại thao tác đã lưu
  @US_009 @US_011 @US_036 @BDD05
  Scenario: BDD05 Thử lại thao tác đã lưu
    Given Lần nhập đã ghi nhưng phản hồi bị mất
    When Thử lại cùng thao tác
    Then Trả đúng trạng thái đã ghi, không tạo bản trùng; cho tra cứu mã lần nhập.
```

<a id="bdd06"></a>

### BDD06 Nhập lại sau khi đích đã thay đổi

```gherkin
Feature: Nhập lại sau khi đích đã thay đổi
  @US_011 @US_036 @BDD06
  Scenario: BDD06 Nhập lại sau khi đích đã thay đổi
    Given Đã nhập tệp, sau đó bác sĩ sửa dữ liệu đích
    When Tạo lần nhập mới từ cùng nội dung tệp
    Then Đối chiếu với phiên bản đích mới; không nhận nhầm là thao tác thử lại và bỏ qua giá trị đã chọn.
```

<a id="bdd07"></a>

### BDD07 Giữ phiên bản mẫu của lượt cũ

```gherkin
Feature: Giữ phiên bản mẫu của lượt cũ
  @US_030 @BDD07
  Scenario: BDD07 Giữ phiên bản mẫu của lượt cũ
    Given Lượt A dùng mẫu v1; Admin lưu mẫu v2
    When Mở lượt A và tạo lượt B
    Then A giữ v1 và dữ liệu; B nhận v2; không đổi ngầm cấu trúc lịch sử.
```

<a id="bdd08"></a>

### BDD08 Từ chối thao tác khác quyền

```gherkin
Feature: Từ chối thao tác khác quyền
  @US_029 @US_030 @BDD08
  Scenario: BDD08 Từ chối thao tác khác quyền
    Given Admin được quản lý mẫu nhưng không ghi dữ liệu khám
    When Admin gọi thao tác cập nhật lâm sàng hoặc bác sĩ sửa định nghĩa mẫu
    Then Hệ thống từ chối đúng quyền ở cả giao diện và API; hồ sơ chung vẫn tra cứu được theo quyền.
```

<a id="bdd09"></a>

### BDD09 Chặn ghi đè phiên bản cũ

```gherkin
Feature: Chặn ghi đè phiên bản cũ
  @US_005 @BDD09
  Scenario: BDD09 Chặn ghi đè phiên bản cũ
    Given Hai phiên cùng mở một phiên bản dữ liệu
    When Phiên thứ nhất lưu, phiên thứ hai lưu bản cũ
    Then Phát hiện xung đột, yêu cầu đối chiếu; không ghi đè âm thầm.
```

<a id="bdd10"></a>

### BDD10 Không đặt vượt sức chứa

```gherkin
Feature: Không đặt vượt sức chứa
  @US_003 @US_023 @BDD10
  Scenario: BDD10 Không đặt vượt sức chứa
    Given Khung giờ chỉ còn một chỗ
    When Hai yêu cầu đặt được xử lý đồng thời
    Then Không xác nhận vượt sức chứa; lịch hẹn không tự mở lượt khám.
```

<a id="bdd11"></a>

### BDD11 Khôi phục và đối chiếu bản sao

```gherkin
Feature: Khôi phục và đối chiếu bản sao
  @US_035 @BDD11
  Scenario: BDD11 Khôi phục và đối chiếu bản sao
    Given Có bản sao gồm bệnh án, mẫu và dữ liệu phụ thuộc
    When Khôi phục vào môi trường riêng
    Then Mở và đối chiếu được hồ sơ/lượt/mẫu, quyền và tệp cần thiết; thiếu/hỏng phải báo lỗi, không báo hoàn tất giả.
```

<a id="bdd12"></a>

### BDD12 Không đánh giá khi chưa đủ điều kiện

```gherkin
Feature: Không đánh giá khi chưa đủ điều kiện
  @US_012 @US_013 @US_014 @US_015 @BDD12
  Scenario: BDD12 Không đánh giá khi chưa đủ điều kiện
    Given Module chưa triển khai hoặc thiếu điều kiện đầu vào
    When Yêu cầu hỗ trợ chuyên môn
    Then Báo chưa đánh giá được; giữ dữ liệu khám; không sinh kết luận hoặc nhãn an toàn giả.
```

<a id="bdd13"></a>

### BDD13 Từ chối xác nhận kế hoạch cũ

```gherkin
Feature: Từ chối xác nhận kế hoạch cũ
  @US_019 @US_020 @BDD13
  Scenario: BDD13 Từ chối xác nhận kế hoạch cũ
    Given Có dự thảo kế hoạch nhưng phiên bản dữ liệu hoặc kế hoạch đã thay đổi
    When Bác sĩ xác nhận bản cũ
    Then Chặn xác nhận bản cũ, yêu cầu xem lại; chưa công bố hoặc lưu bản cũ như đã được xác nhận.
```

<a id="bdd14"></a>

### BDD14 Giới hạn nội dung bệnh nhân được xem

```gherkin
Feature: Giới hạn nội dung bệnh nhân được xem
  @US_002 @US_021 @US_022 @US_024 @BDD14
  Scenario: BDD14 Giới hạn nội dung bệnh nhân được xem
    Given Tài khoản bệnh nhân đã liên kết và có nội dung công bố
    When Xem kết quả của mình hoặc yêu cầu hồ sơ người khác
    Then Chỉ xem phần được cấp của mình; chặn hồ sơ khác và dự thảo; bản bị thu hồi không còn truy cập được.
```

<a id="bdd15"></a>

### BDD15 Từ chối file không đọc được

```gherkin
Feature: Từ chối file không đọc được
  @US_008 @BDD15
  Scenario: BDD15 Từ chối file không đọc được
    Given File sai cấu trúc hoặc không đọc được
    When Bác sĩ tải lên để xem trước
    Then Nêu lỗi đọc hoặc vị trí sai; không ghi dữ liệu; giữ thông tin lần nhập theo khả năng đọc được.
```

<a id="bdd16"></a>

### BDD16 Chuẩn hóa có quy tắc và dấu vết

```gherkin
Feature: Chuẩn hóa có quy tắc và dấu vết
  @US_008 @BDD16
  Scenario: BDD16 Chuẩn hóa có quy tắc và dấu vết
    Given Có ánh xạ và quy tắc đổi đơn vị, ngày giờ đã xác định
    When Hệ thống kiểm tra dữ liệu file
    Then Hiển thị giá trị gốc, giá trị chuẩn hóa và nguồn; phần thiếu quy tắc không bị tự chuyển đổi hoặc điền bình thường.
```

<a id="bdd17"></a>

### BDD17 Từ chối hoàn tất lượt còn thiếu điều kiện

```gherkin
Feature: Từ chối hoàn tất lượt còn thiếu điều kiện
  @US_004 @BDD17
  Scenario: BDD17 Từ chối hoàn tất lượt còn thiếu điều kiện
    Given Một lượt chưa đáp ứng điều kiện hoàn tất đã đặc tả
    When Bác sĩ yêu cầu hoàn tất
    Then Nêu điều kiện còn thiếu, giữ trạng thái; mở xem bệnh án không tự mở hoặc hoàn tất lượt.
```

<a id="bdd18"></a>

### BDD18 Tra cứu đúng lịch sử và thời điểm

```gherkin
Feature: Tra cứu đúng lịch sử và thời điểm
  @US_006 @US_007 @BDD18
  Scenario: BDD18 Tra cứu đúng lịch sử và thời điểm
    Given Một bệnh nhân có nhiều lượt và thuốc ở các thời điểm khác nhau
    When Người có quyền tra cứu lịch sử
    Then Thấy đúng lượt, nguồn, thời điểm và phiên bản; dữ liệu cũ không được trình bày như kết quả mới.
```

<a id="bdd19"></a>

### BDD19 Chặn tài khoản hoặc phiên không hợp lệ

```gherkin
Feature: Chặn tài khoản hoặc phiên không hợp lệ
  @US_027 @BDD19
  Scenario: BDD19 Chặn tài khoản hoặc phiên không hợp lệ
    Given Tài khoản bị khóa hoặc phiên không còn hợp lệ
    When Đăng nhập hoặc gọi thao tác cần quyền
    Then Từ chối truy cập; tài khoản hợp lệ dùng một trang đăng nhập và nhận đúng vai trò; đăng xuất làm mất hiệu lực phiên theo thiết kế.
```

<a id="bdd20"></a>

### BDD20 Chưa liên kết thì chưa được xem bệnh án

```gherkin
Feature: Chưa liên kết thì chưa được xem bệnh án
  @US_002 @US_024 @US_026 @BDD20
  Scenario: BDD20 Chưa liên kết thì chưa được xem bệnh án
    Given Tài khoản bệnh nhân chưa được liên kết xác minh
    When Yêu cầu xem bệnh án bằng mã CCCD hoặc mã BN
    Then Không cấp quyền chỉ từ mã định danh; sau xác minh chỉ thấy nội dung được công bố đúng hồ sơ.
```

<a id="bdd21"></a>

### BDD21 Gợi ý Lab Test khác chỉ định và kết quả

```gherkin
Feature: Gợi ý Lab Test khác chỉ định và kết quả
  @US_006 @US_013 @BDD21
  Scenario: BDD21 Gợi ý Lab Test khác chỉ định và kết quả
    Given Có dữ liệu và điều kiện áp dụng Lab/Test được phép
    When Bác sĩ yêu cầu gợi ý cận lâm sàng
    Then Có gợi ý, lý do và ưu tiên; chưa sinh chỉ định chính thức hoặc kết quả đo; chỉ định bác sĩ được ghi riêng.
```

<a id="bdd22"></a>

### BDD22 Gợi ý Treatment từ dữ liệu thực đo

```gherkin
Feature: Gợi ý Treatment từ dữ liệu thực đo
  @US_014 @BDD22
  Scenario: BDD22 Gợi ý Treatment từ dữ liệu thực đo
    Given Có dữ liệu thực đo và ngữ cảnh điều trị đủ cho phạm vi Treatment
    When Bác sĩ yêu cầu gợi ý
    Then Hiển thị phương án, điều kiện cá thể hóa, giới hạn và yêu cầu theo dõi; không coi xét nghiệm mới đề xuất là đã có kết quả.
```

<a id="bdd23"></a>

### BDD23 MedSafety nêu phần chưa kiểm tra

```gherkin
Feature: MedSafety nêu phần chưa kiểm tra
  @US_015 @US_018 @BDD23
  Scenario: BDD23 MedSafety nêu phần chưa kiểm tra
    Given Có phương án thuốc và một phần dữ liệu an toàn còn thiếu
    When Bác sĩ yêu cầu MedSafety
    Then Gắn kết quả với đúng phiên bản thuốc, nêu cảnh báo/căn cứ và phần chưa kiểm tra; không tự đổi thuốc hoặc kết luận toàn bộ an toàn.
```

<a id="bdd24"></a>

### BDD24 Đánh giá lại và giữ lần chạy cũ

```gherkin
Feature: Đánh giá lại và giữ lần chạy cũ
  @US_016 @BDD24
  Scenario: BDD24 Đánh giá lại và giữ lần chạy cũ
    Given Đã có kết quả hỗ trợ, sau đó dữ liệu liên quan đổi
    When Bác sĩ yêu cầu đánh giá lại
    Then Tạo lần mới, giữ lần cũ và đánh dấu cần xem lại; truy được đầu vào, phiên bản và đầu ra liên quan giữa các module.
```

<a id="bdd25"></a>

### BDD25 Lưu phản hồi và quyết định bác sĩ

```gherkin
Feature: Lưu phản hồi và quyết định bác sĩ
  @US_017 @BDD25
  Scenario: BDD25 Lưu phản hồi và quyết định bác sĩ
    Given Bác sĩ đang xem một gợi ý cụ thể
    When Ghi phản hồi và kết luận, hướng xử trí
    Then Lưu đúng gợi ý/phiên bản và quyết định vào lượt; phản hồi không tự xác nhận kế hoạch hoặc huấn luyện lại.
```

<a id="bdd26"></a>

### BDD26 Lưu dự thảo kế hoạch

```gherkin
Feature: Lưu dự thảo kế hoạch
  @US_018 @BDD26
  Scenario: BDD26 Lưu dự thảo kế hoạch
    Given Lượt có dữ liệu để lập phương án
    When Bác sĩ lưu dự thảo kế hoạch, thuốc và nội dung theo dõi
    Then Dự thảo được mở lại trong bệnh án; chỉ ra lịch tái khám dự kiến khác lịch hẹn; chưa tự xác nhận, công bố hay tạo nhắc chính thức.
```

<a id="bdd27"></a>

### BDD27 Điều chỉnh phải xác nhận lại

```gherkin
Feature: Điều chỉnh phải xác nhận lại
  @US_020 @BDD27
  Scenario: BDD27 Điều chỉnh phải xác nhận lại
    Given Đã có kế hoạch được bác sĩ xác nhận
    When Bác sĩ thực hiện điều chỉnh và bước xác nhận được include
    Then Chỉ báo hoàn tất điều chỉnh sau xác nhận thành công; giữ bản cũ/lý do, xác định hiệu lực mới. Lưu nháp hoặc hủy giữ bản hiện hành.
```

<a id="bdd28"></a>

### BDD28 Công bố đúng phiên bản và phạm vi

```gherkin
Feature: Công bố đúng phiên bản và phạm vi
  @US_021 @BDD28
  Scenario: BDD28 Công bố đúng phiên bản và phạm vi
    Given Có phiên bản kết quả và kế hoạch đã xác nhận
    When Bác sĩ chọn phạm vi công bố
    Then Công bố đúng người, nội dung và phiên bản được chọn; không lộ nháp; lưu người và thời điểm.
```

<a id="bdd29"></a>

### BDD29 Thay thế hoặc thu hồi nội dung công bố

```gherkin
Feature: Thay thế hoặc thu hồi nội dung công bố
  @US_022 @BDD29
  Scenario: BDD29 Thay thế hoặc thu hồi nội dung công bố
    Given Có nội dung đã công bố
    When Bác sĩ thay thế hoặc thu hồi
    Then Giữ lý do, lịch sử; bản bị thu hồi không còn được xem; thao tác thu hồi hiển thị không tự ngừng thuốc.
```

<a id="bdd30"></a>

### BDD30 Thông báo đúng người và quyền

```gherkin
Feature: Thông báo đúng người và quyền
  @US_025 @BDD30
  Scenario: BDD30 Thông báo đúng người và quyền
    Given Có sự kiện thông báo đã chọn và tài khoản nhận hợp lệ
    When Hệ thống tạo và người dùng mở thông báo
    Then Tạo đúng người, tránh trùng; đánh dấu đọc theo thao tác; mở nội dung kiểm tra quyền hiện hành; đã đọc không đồng nghĩa đã thực hiện.
```

<a id="bdd31"></a>

### BDD31 Cập nhật nhắc khi lịch đổi

```gherkin
Feature: Cập nhật nhắc khi lịch đổi
  @US_025 @BDD31
  Scenario: BDD31 Cập nhật nhắc khi lịch đổi
    Given Lịch hẹn đã xác nhận có nhắc tương lai
    When Lịch đổi hoặc bị hủy trước khi nhắc
    Then Điều chỉnh hoặc hủy nhắc cũ; không gửi nhắc theo lịch hết hiệu lực; trạng thái gửi phản ánh kênh thực tế.
```

<a id="bdd32"></a>

### BDD32 Nhắc thuốc theo kế hoạch hiện hành

```gherkin
Feature: Nhắc thuốc theo kế hoạch hiện hành
  @US_025 @BDD32
  Scenario: BDD32 Nhắc thuốc theo kế hoạch hiện hành
    Given Kế hoạch thuốc hiện hành được công bố và có đủ thời điểm dùng
    When Tạo nhắc, sau đó kế hoạch thay đổi
    Then Nhắc theo bản hiện hành; cập nhật nhắc tương lai; thiếu thời điểm không suy giờ và không đánh dấu đã uống.
```

<a id="bdd33"></a>

### BDD33 Khôi phục truy cập phải xác minh

```gherkin
Feature: Khôi phục truy cập phải xác minh
  @US_028 @BDD33
  Scenario: BDD33 Khôi phục truy cập phải xác minh
    Given Người yêu cầu khôi phục chưa xác minh được danh tính
    When Yêu cầu đặt lại quyền truy cập
    Then Chưa đổi quyền hoặc liên kết; hỗ trợ qua Admin có quyền phải có dấu vết; ca hợp lệ khôi phục đúng tài khoản.
```

<a id="bdd34"></a>

### BDD34 Tra nhật ký theo quyền

```gherkin
Feature: Tra nhật ký theo quyền
  @US_033 @BDD34
  Scenario: BDD34 Tra nhật ký theo quyền
    Given Có thao tác thay đổi thuộc phạm vi phải lưu nhật ký
    When Admin được quyền tra cứu
    Then Truy được người, thời gian, đối tượng, thao tác và lần nhập liên quan; không lộ mật khẩu/khóa; lịch sử được bảo vệ.
```

<a id="bdd35"></a>

### BDD35 Từ chối cấu hình mẫu không hợp lệ

```gherkin
Feature: Từ chối cấu hình mẫu không hợp lệ
  @US_030 @BDD35
  Scenario: BDD35 Từ chối cấu hình mẫu không hợp lệ
    Given Admin chỉnh trường/mẫu với mã trùng hoặc kiểu không hợp lệ
    When Yêu cầu lưu hoặc áp dụng mẫu
    Then Báo lỗi và chưa áp dụng; bản hợp lệ xem trước được và tạo phiên bản mới, không mất dữ liệu cũ.
```

<a id="bdd36"></a>

### BDD36 Cấu hình dữ liệu có phiên bản

```gherkin
Feature: Cấu hình dữ liệu có phiên bản
  @US_031 @BDD36
  Scenario: BDD36 Cấu hình dữ liệu có phiên bản
    Given Admin cập nhật ánh xạ nhập hoặc danh mục đối chiếu
    When Lưu cấu hình và áp dụng cho lần nhập mới
    Then Kiểm tra cấu hình, lưu phạm vi/phiên bản; lần nhập cũ truy được bản đã dùng; Bác sĩ không sửa định nghĩa chung.
```

<a id="bdd37"></a>

### BDD37 Áp dụng quyền hiện hành

```gherkin
Feature: Áp dụng quyền hiện hành
  @US_029 @BDD37
  Scenario: BDD37 Áp dụng quyền hiện hành
    Given Quyền của một tài khoản bị thay đổi hoặc thu hồi
    When Tài khoản gọi thao tác trên giao diện hoặc API
    Then Kiểm tra quyền hiện hành theo cơ chế phiên; thao tác trái quyền bị chặn; không mặc nhiên cấp quyền lâm sàng cho Admin.
```

<a id="bdd38"></a>

### BDD38 Đối chiếu bộ ca chuyên môn

```gherkin
Feature: Đối chiếu bộ ca chuyên môn
  @US_012 @BDD38
  Scenario: BDD38 Đối chiếu bộ ca chuyên môn
    Given Có ca mẫu và kết quả kỳ vọng được chuyên môn rà soát
    When Chạy phiên bản quy tắc/mô hình được phép
    Then Đối chiếu đúng phạm vi và phiên bản; gói chưa kiểm chứng không được gắn nhãn đã kiểm định; dự báo chưa đủ điều kiện không được bật.
```

<a id="bdd39"></a>

### BDD39 Quản lý lịch hẹn và lượt riêng

```gherkin
Feature: Quản lý lịch hẹn và lượt riêng
  @US_003 @US_023 @BDD39
  Scenario: BDD39 Quản lý lịch hẹn và lượt riêng
    Given Có khung giờ/sức chứa và yêu cầu cập nhật lịch theo quyền
    When Nhân viên y tế được giao quản lý lịch hẹn
    Then Hiển thị đúng trạng thái, không vượt sức chứa; lịch hẹn và lượt khám có mã/trạng thái riêng.
```

<a id="bdd40"></a>

### BDD40 Đối chiếu hồ sơ nghi trùng

```gherkin
Feature: Đối chiếu hồ sơ nghi trùng
  @US_001 @BDD40
  Scenario: BDD40 Đối chiếu hồ sơ nghi trùng
    Given Có thông tin tối thiểu hợp lệ và hồ sơ cùng định danh
    When Bác sĩ yêu cầu tạo hồ sơ mới
    Then Cảnh báo khả năng trùng để đối chiếu; không gộp theo tên; mã BN ổn định, không bắt buộc CCCD nếu chưa có.
```

<a id="bdd41"></a>

### BDD41 Lưu lỗi hoặc mất phản hồi

```gherkin
Feature: Lưu lỗi hoặc mất phản hồi
  @US_011 @US_019 @US_036 @BDD41
  Scenario: BDD41 Lưu lỗi hoặc mất phản hồi
    Given Có kết quả xác nhận cần lưu nhưng ghi dữ liệu thất bại hoặc phản hồi bị mất
    When Người dùng kiểm tra trạng thái rồi thử lại
    Then Không báo thành công khi chưa có bằng chứng; thử lại đúng thao tác không tạo bản trùng hoặc mất dữ liệu đã lưu.
```

<a id="bdd42"></a>

### BDD42 Xác nhận đúng bản kế hoạch hiện hành

```gherkin
Feature: Xác nhận đúng bản kế hoạch hiện hành
  @US_019 @US_020 @BDD42
  Scenario: BDD42 Xác nhận đúng bản kế hoạch hiện hành
    Given Có bản dự thảo hiện hành, Bác sĩ đúng quyền và đủ điều kiện xác nhận đã đặc tả
    When Bác sĩ kiểm tra nội dung và xác nhận phiên bản đang xem
    Then Lưu bản xác nhận vào đúng bệnh án/lượt cùng người, thời điểm và hiệu lực; không tự công bố hoặc ghi trả HIS.
```

<a id="bdd43"></a>

### BDD43 Nhân viên hỗ trợ không xác nhận chuyên môn

```gherkin
Feature: Nhân viên hỗ trợ không xác nhận chuyên môn
  @US_005 @BDD43
  Scenario: BDD43 Nhân viên hỗ trợ không xác nhận chuyên môn
    Given Tài khoản được giao quyền hỗ trợ nhập lâm sàng nhưng không xác nhận kế hoạch
    When Nhập và lưu dữ liệu đúng hồ sơ/lượt, sau đó yêu cầu xác nhận kế hoạch
    Then Lưu dữ liệu theo quyền; chặn xác nhận chuyên môn. Bác sĩ đủ quyền mới xác nhận; Admin không tự có quyền lâm sàng.
```

<a id="bdd44"></a>

### BDD44 Kiểm tra kết quả nhập từng phần

```gherkin
Feature: Kiểm tra kết quả nhập từng phần
  @US_009 @BDD44
  Scenario: BDD44 Kiểm tra kết quả nhập từng phần
    Given Có lần nhập ghi một phần hoặc bị mất phản hồi
    When Bác sĩ mở lịch sử rồi kiểm tra kết quả nhập
    Then Hiển thị đúng mã lần nhập, phần đã ghi/chưa ghi, lỗi và dữ liệu đích; không tự ghi lại hoặc báo đã lưu toàn bộ.
```

<a id="bdd45"></a>

### BDD45 Xem hỗ trợ không cấp quyền đánh giá lại

```gherkin
Feature: Xem hỗ trợ không cấp quyền đánh giá lại
  @US_016 @BDD45
  Scenario: BDD45 Xem hỗ trợ không cấp quyền đánh giá lại
    Given Nhân viên y tế được cấp quyền xem kết quả và lịch sử hỗ trợ
    When Xem một lần hỗ trợ rồi yêu cầu chạy đánh giá lại khi không có quyền đó
    Then Xem đúng phạm vi/căn cứ/phiên bản; chặn yêu cầu đánh giá lại ngoài quyền, không tự chấp nhận gợi ý.
```

<a id="bdd46"></a>

### BDD46 Đăng ký và xác minh tài khoản bệnh nhân

```gherkin
Feature: Đăng ký và xác minh tài khoản bệnh nhân
  @US_026 @BDD46
  Scenario: BDD46 Đăng ký và xác minh tài khoản bệnh nhân
    Given Chức năng bệnh nhân đã triển khai và thông tin đăng ký mới đáp ứng quy tắc xác minh đã thống nhất
    When Bệnh nhân hoàn tất đăng ký và xác minh tài khoản
    Then Tạo đúng một tài khoản bệnh nhân; chưa tự liên kết bệnh án hoặc cấp quyền xem dữ liệu lâm sàng chỉ từ CCCD/mã BN.
```

<a id="bdd47"></a>

### BDD47 Từ chối đăng ký chưa hợp lệ

```gherkin
Feature: Từ chối đăng ký chưa hợp lệ
  @US_026 @BDD47
  Scenario: BDD47 Từ chối đăng ký chưa hợp lệ
    Given Thông tin đăng ký trùng tài khoản hoặc bằng chứng xác minh chưa hợp lệ
    When Bệnh nhân yêu cầu hoàn tất đăng ký
    Then Chưa tạo tài khoản trùng hoặc cấp quyền xem bệnh án; thông báo bước cần sửa/xác minh, không tiết lộ dữ liệu ngoài quyền.
```

<a id="bdd48"></a>

### BDD48 Cập nhật thông tin tài khoản theo quyền

```gherkin
Feature: Cập nhật thông tin tài khoản theo quyền
  @US_027 @BDD48
  Scenario: BDD48 Cập nhật thông tin tài khoản theo quyền
    Given Người dùng đã đăng nhập và có trường thông tin tài khoản được phép tự cập nhật
    When Người dùng lưu thay đổi hợp lệ và hoàn tất xác minh lại nếu trường đó yêu cầu
    Then Lưu đúng thông tin tài khoản có dấu vết; không thay vai trò, phạm vi hồ sơ, liên kết bệnh án hoặc dữ liệu lâm sàng qua màn hình tài khoản.
```

<a id="bdd49"></a>

### BDD49 Admin quản lý trạng thái tài khoản

```gherkin
Feature: Admin quản lý trạng thái tài khoản
  @US_029 @BDD49
  Scenario: BDD49 Admin quản lý trạng thái tài khoản
    Given Admin có quyền quản lý tài khoản trong phạm vi được giao
    When Admin tạo hoặc thay đổi trạng thái tài khoản theo thẩm quyền
    Then Lưu trạng thái đúng tài khoản và nhật ký; tài khoản khóa bị chặn; việc cấp tài khoản không tự cấp quyền xác nhận lâm sàng.
```

<a id="bdd50"></a>

### BDD50 Đăng nhập nhận đúng vai trò

```gherkin
Feature: Đăng nhập nhận đúng vai trò
  @US_027 @BDD50
  Scenario: BDD50 Đăng nhập nhận đúng vai trò
    Given Tài khoản còn hiệu lực, thông tin xác thực đúng và vai trò đã được cấp
    When Người dùng đăng nhập qua trang dùng chung
    Then Tạo phiên hợp lệ và hiển thị đúng chức năng theo quyền; không tự cấp quyền xem mọi hồ sơ hoặc quyền chuyên môn cho Admin.
```

<a id="dieu-kien"></a>

## 6 Điều kiện trước kiểm thử

- Chốt tập dữ liệu giả lập và kết quả kỳ vọng; dùng mã người bệnh/lượt rõ ràng, không đưa dữ liệu bệnh nhân thật vào repo.
- Mỗi ca ghi phiên bản ứng dụng/cấu hình, dữ liệu đầu vào, kết quả thực tế và bằng chứng. Chỉ cập nhật đạt/không đạt sau khi thực thi.
- Với AI, cần nguồn, phương pháp/phiên bản, đối tượng áp dụng và bộ ca chuyên môn được rà soát. Không tự đặt ngưỡng hoặc dùng kết quả mô phỏng như kiểm định lâm sàng.
- Kênh nhắc khi app đóng, ngưỡng NFR và quy tắc còn mở được cụ thể hóa theo SRS trước khi nghiệm thu phần liên quan.
- Bảng INVEST là kiểm tra chất lượng Story; BDD là tiêu chí hành vi; kết quả nghiệm thu thực tế nằm trong báo cáo kiểm thử và RTM.
