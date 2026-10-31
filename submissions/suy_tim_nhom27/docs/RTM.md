# Ma trận truy vết yêu cầu RTM

**Phiên bản:** 0.1 · **Ngày cập nhật:** 31/10/2026

RTM liên kết **Mã yêu cầu → User Story → Use Case → Schema CSDL → API**, đồng thời truy vết tới mục tiêu nghiệp vụ và BDD. Phạm vi gồm 46 FR, 13 NFR, 33 User Story, 54 Use Case và 50 Scenario BDD dự kiến.

**Trạng thái:** liên kết FR/US/UC/BDD kế thừa [SRS v1.0](SRS-v1.0.md), [đặc tả Use Case](<Đặc tả usecase đầy đủ.md>) và [User Story INVEST BDD](User-Stories-INVEST-BDD.md). Các bảng CSDL trong danh mục DB và giao diện API trong danh mục API bên dưới đều là **đề xuất (ĐX), chưa chốt DDL/OpenAPI và chưa chứng minh hiện thực**. Thiết kế dữ liệu mục 5.3 đang được rà soát. Không lấy tên giống bảng/API cũ làm bằng chứng đã đáp ứng yêu cầu.

## Mục lục

- [1 Quy ước và trạng thái](#quy-uoc)
- [2 Mục tiêu nghiệp vụ và FR](#muc-tieu)
- [3 Ma trận FR theo chuỗi truy vết](#rtm-fr)
- [4 Danh mục Schema CSDL dự kiến](#schema)
- [5 Danh mục API dự kiến](#api)
- [6 Liên kết BDD và trạng thái kiểm chứng](#kiem-chung)
- [7 Ma trận NFR](#rtm-nfr)
- [8 Kiểm tra tính đầy đủ và cách cập nhật](#cap-nhat)

<a id="quy-uoc"></a>

## 1 Quy ước và trạng thái

- Mỗi dòng FR liệt kê các Story/Use Case và thành phần thiết kế có liên quan; quan hệ thực tế có thể một–nhiều hoặc nhiều–nhiều. Không buộc mỗi yêu cầu chỉ có đúng một Story, một bảng và một API. Các danh sách trong cùng dòng không khẳng định mọi phần tử đều ghép cặp với nhau.
- DB01–DB14 và API01–API18 là mã tra cứu trong tài liệu này, không phải tên bảng vật lý hoặc operationId đã có. Mỗi mã dẫn tới tên dự kiến, phạm vi dữ liệu và hành vi tương ứng.
- Đường dẫn API là hướng hợp đồng đề xuất để rà soát, chưa thay OpenAPI; HTTP method, request/response, quyền, lỗi và quy tắc phiên bản phải được chốt khi thiết kế API.
- “Chưa kiểm chứng” nghĩa là chưa có kết quả chạy thử gắn đúng phiên bản trong lần lập RTM; không được suy từ đây rằng mã cũ không có chức năng hoặc mọi chức năng đã đạt.
- BDD là tiêu chí nghiệm thu dự kiến. Cột Test Case thực thi chưa có bộ mã đã thống nhất nên để “Chưa gán”; không đổi tên BDD thành ca thử đã chạy.
- Nội dung report chỉ trích vài dòng đại diện; bản đầy đủ là nơi cập nhật liên kết và kết quả.

<a id="muc-tieu"></a>

## 2 Mục tiêu nghiệp vụ và FR

Mã OB kế thừa mục tiêu nghiệp vụ trong report. Các FR quản trị/quyền/nhật ký/sao lưu là yêu cầu hỗ trợ mục tiêu, không tự tạo mục tiêu kinh doanh mới.

| Mục tiêu | Nội dung | Yêu cầu liên quan |
| --- | --- | --- |
| <a id="ob1"></a>OB1 | Quản lý hồ sơ và biểu mẫu | [FR01](#fr01), [FR02](#fr02), [FR04](#fr04), [FR05](#fr05), [FR40](#fr40), [FR41](#fr41), [FR42](#fr42), [FR43](#fr43), [FR44](#fr44), [FR45](#fr45), [FR46](#fr46) |
| <a id="ob2"></a>OB2 | Theo dõi diễn biến | [FR06](#fr06), [FR07](#fr07), [FR19](#fr19), [FR25](#fr25), [FR27](#fr27), [FR32](#fr32) |
| <a id="ob3"></a>OB3 | Tiếp nhận file từ HIS | [FR08](#fr08), [FR09](#fr09), [FR10](#fr10), [FR11](#fr11), [FR12](#fr12), [FR13](#fr13), [FR14](#fr14), [FR15](#fr15), [FR41](#fr41), [FR43](#fr43), [FR45](#fr45) |
| <a id="ob4"></a>OB4 | Hỗ trợ đánh giá và cận lâm sàng | [FR16](#fr16), [FR17](#fr17), [FR18](#fr18), [FR19](#fr19), [FR24](#fr24), [FR25](#fr25), [FR26](#fr26) |
| <a id="ob5"></a>OB5 | Hỗ trợ điều trị và an toàn thuốc | [FR20](#fr20), [FR21](#fr21), [FR22](#fr22), [FR23](#fr23), [FR27](#fr27), [FR28](#fr28), [FR29](#fr29), [FR30](#fr30), [FR31](#fr31), [FR32](#fr32) |
| <a id="ob6"></a>OB6 | Theo dõi và tái khám | [FR02](#fr02), [FR03](#fr03), [FR33](#fr33), [FR34](#fr34), [FR35](#fr35), [FR36](#fr36), [FR37](#fr37), [FR38](#fr38), [FR39](#fr39), [FR40](#fr40) |

<a id="rtm-fr"></a>

## 3 Ma trận FR theo chuỗi truy vết

Cột Schema và API đọc cùng trạng thái **ĐX** tại danh mục 4–5. Dữ liệu và endpoint dùng chung được liên kết lại bằng mã, không sao chép thành nhiều bảng/API chỉ vì có nhiều FR.

### Hồ sơ bệnh án và lượt khám

| Mã yêu cầu | User Story | Use Case | Schema CSDL ĐX | API ĐX |
| --- | --- | --- | --- | --- |
| <a id="fr01"></a>FR01 | [US-001](User-Stories-INVEST-BDD.md#us-001) | [UC1.01](<Đặc tả usecase đầy đủ.md#uc1-01>), [UC1.02](<Đặc tả usecase đầy đủ.md#uc1-02>), [UC1.03](<Đặc tả usecase đầy đủ.md#uc1-03>) | [DB01](#db01), [DB13](#db13) | [API02](#api02) |
| <a id="fr02"></a>FR02 | [US-002](User-Stories-INVEST-BDD.md#us-002) | [UC1.04](<Đặc tả usecase đầy đủ.md#uc1-04>) | [DB01](#db01), [DB10](#db10), [DB11](#db11) | [API13](#api13) |
| <a id="fr03"></a>FR03 | [US-003](User-Stories-INVEST-BDD.md#us-003), [US-023](User-Stories-INVEST-BDD.md#us-023) | [UC1.05](<Đặc tả usecase đầy đủ.md#uc1-05>), [UC1.06](<Đặc tả usecase đầy đủ.md#uc1-06>) | [DB14](#db14), [DB11](#db11) | [API12](#api12) |
| <a id="fr04"></a>FR04 | [US-004](User-Stories-INVEST-BDD.md#us-004) | [UC1.07](<Đặc tả usecase đầy đủ.md#uc1-07>), [UC1.12](<Đặc tả usecase đầy đủ.md#uc1-12>) | [DB01](#db01), [DB02](#db02), [DB03](#db03), [DB13](#db13) | [API03](#api03) |
| <a id="fr05"></a>FR05 | [US-005](User-Stories-INVEST-BDD.md#us-005) | [UC1.08](<Đặc tả usecase đầy đủ.md#uc1-08>) | [DB02](#db02), [DB03](#db03), [DB04](#db04), [DB13](#db13) | [API04](#api04) |
| <a id="fr06"></a>FR06 | [US-006](User-Stories-INVEST-BDD.md#us-006) | [UC1.09](<Đặc tả usecase đầy đủ.md#uc1-09>), [UC1.10](<Đặc tả usecase đầy đủ.md#uc1-10>) | [DB02](#db02), [DB04](#db04), [DB05](#db05) | [API05](#api05), [API04](#api04) |
| <a id="fr07"></a>FR07 | [US-007](User-Stories-INVEST-BDD.md#us-007) | [UC1.11](<Đặc tả usecase đầy đủ.md#uc1-11>) | [DB01](#db01), [DB02](#db02), [DB04](#db04), [DB09](#db09) | [API02](#api02), [API03](#api03) |

### Tiếp nhận và tiền xử lý dữ liệu

| Mã yêu cầu | User Story | Use Case | Schema CSDL ĐX | API ĐX |
| --- | --- | --- | --- | --- |
| <a id="fr08"></a>FR08 | [US-008](User-Stories-INVEST-BDD.md#us-008) | [UC2.01](<Đặc tả usecase đầy đủ.md#uc2-01>) | [DB06](#db06), [DB07](#db07) | [API08](#api08) |
| <a id="fr09"></a>FR09 | [US-008](User-Stories-INVEST-BDD.md#us-008), [US-031](User-Stories-INVEST-BDD.md#us-031) | [UC2.02](<Đặc tả usecase đầy đủ.md#uc2-02>), [UC2.11](<Đặc tả usecase đầy đủ.md#uc2-11>) | [DB01](#db01), [DB02](#db02), [DB06](#db06), [DB07](#db07) | [API07](#api07), [API08](#api08) |
| <a id="fr10"></a>FR10 | [US-008](User-Stories-INVEST-BDD.md#us-008) | [UC2.03](<Đặc tả usecase đầy đủ.md#uc2-03>) | [DB03](#db03), [DB06](#db06), [DB07](#db07) | [API08](#api08) |
| <a id="fr11"></a>FR11 | [US-008](User-Stories-INVEST-BDD.md#us-008) | [UC2.04](<Đặc tả usecase đầy đủ.md#uc2-04>) | [DB06](#db06), [DB07](#db07) | [API08](#api08) |
| <a id="fr12"></a>FR12 | [US-036](User-Stories-INVEST-BDD.md#us-036) | [UC2.05](<Đặc tả usecase đầy đủ.md#uc2-05>) | [DB04](#db04), [DB07](#db07), [DB13](#db13) | [API08](#api08) |
| <a id="fr13"></a>FR13 | [US-036](User-Stories-INVEST-BDD.md#us-036) | [UC2.01](<Đặc tả usecase đầy đủ.md#uc2-01>) | [DB01](#db01), [DB02](#db02), [DB04](#db04), [DB06](#db06), [DB07](#db07) | [API08](#api08) |
| <a id="fr14"></a>FR14 | [US-009](User-Stories-INVEST-BDD.md#us-009) | [UC2.07](<Đặc tả usecase đầy đủ.md#uc2-07>), [UC2.12](<Đặc tả usecase đầy đủ.md#uc2-12>) | [DB07](#db07), [DB13](#db13) | [API08](#api08) |
| <a id="fr15"></a>FR15 | [US-011](User-Stories-INVEST-BDD.md#us-011) | [UC2.09](<Đặc tả usecase đầy đủ.md#uc2-09>) | [DB04](#db04), [DB06](#db06), [DB07](#db07) | [API08](#api08) |

### Hỗ trợ chuyên môn AI CDSS

| Mã yêu cầu | User Story | Use Case | Schema CSDL ĐX | API ĐX |
| --- | --- | --- | --- | --- |
| <a id="fr16"></a>FR16 | [US-012](User-Stories-INVEST-BDD.md#us-012) | [UC3.05](<Đặc tả usecase đầy đủ.md#uc3-05>) | [DB02](#db02), [DB04](#db04), [DB08](#db08) | [API09](#api09) |
| <a id="fr17"></a>FR17 | [US-012](User-Stories-INVEST-BDD.md#us-012) | [UC3.01](<Đặc tả usecase đầy đủ.md#uc3-01>) | [DB08](#db08) | [API09](#api09) |
| <a id="fr18"></a>FR18 | [US-013](User-Stories-INVEST-BDD.md#us-013) | [UC3.02](<Đặc tả usecase đầy đủ.md#uc3-02>) | [DB04](#db04), [DB05](#db05), [DB08](#db08) | [API09](#api09) |
| <a id="fr19"></a>FR19 | [US-016](User-Stories-INVEST-BDD.md#us-016) | [UC3.08](<Đặc tả usecase đầy đủ.md#uc3-08>) | [DB04](#db04), [DB08](#db08) | [API09](#api09) |
| <a id="fr20"></a>FR20 | [US-014](User-Stories-INVEST-BDD.md#us-014) | [UC3.03](<Đặc tả usecase đầy đủ.md#uc3-03>) | [DB04](#db04), [DB08](#db08), [DB09](#db09) | [API09](#api09) |
| <a id="fr21"></a>FR21 | [US-014](User-Stories-INVEST-BDD.md#us-014) | [UC3.03](<Đặc tả usecase đầy đủ.md#uc3-03>) | [DB08](#db08) | [API09](#api09) |
| <a id="fr22"></a>FR22 | [US-015](User-Stories-INVEST-BDD.md#us-015) | [UC3.04](<Đặc tả usecase đầy đủ.md#uc3-04>) | [DB04](#db04), [DB08](#db08), [DB09](#db09) | [API09](#api09) |
| <a id="fr23"></a>FR23 | [US-015](User-Stories-INVEST-BDD.md#us-015) | [UC3.06](<Đặc tả usecase đầy đủ.md#uc3-06>) | [DB08](#db08) | [API09](#api09) |
| <a id="fr24"></a>FR24 | [US-016](User-Stories-INVEST-BDD.md#us-016) | [UC3.01](<Đặc tả usecase đầy đủ.md#uc3-01>), [UC3.02](<Đặc tả usecase đầy đủ.md#uc3-02>), [UC3.03](<Đặc tả usecase đầy đủ.md#uc3-03>), [UC3.04](<Đặc tả usecase đầy đủ.md#uc3-04>), [UC3.05](<Đặc tả usecase đầy đủ.md#uc3-05>) | [DB04](#db04), [DB08](#db08) | [API09](#api09) |
| <a id="fr25"></a>FR25 | [US-016](User-Stories-INVEST-BDD.md#us-016) | [UC3.06](<Đặc tả usecase đầy đủ.md#uc3-06>), [UC3.07](<Đặc tả usecase đầy đủ.md#uc3-07>) | [DB08](#db08) | [API09](#api09) |
| <a id="fr26"></a>FR26 | [US-016](User-Stories-INVEST-BDD.md#us-016) | [UC3.05](<Đặc tả usecase đầy đủ.md#uc3-05>), [UC3.06](<Đặc tả usecase đầy đủ.md#uc3-06>) | [DB08](#db08), [DB13](#db13) | [API09](#api09) |

### Kết luận và kế hoạch điều trị

| Mã yêu cầu | User Story | Use Case | Schema CSDL ĐX | API ĐX |
| --- | --- | --- | --- | --- |
| <a id="fr27"></a>FR27 | [US-017](User-Stories-INVEST-BDD.md#us-017) | [UC4.01](<Đặc tả usecase đầy đủ.md#uc4-01>) | [DB02](#db02), [DB08](#db08), [DB09](#db09) | [API10](#api10) |
| <a id="fr28"></a>FR28 | [US-017](User-Stories-INVEST-BDD.md#us-017) | [UC4.02](<Đặc tả usecase đầy đủ.md#uc4-02>) | [DB08](#db08), [DB09](#db09) | [API09](#api09) |
| <a id="fr29"></a>FR29 | [US-019](User-Stories-INVEST-BDD.md#us-019), [US-018](User-Stories-INVEST-BDD.md#us-018) | [UC4.03](<Đặc tả usecase đầy đủ.md#uc4-03>), [UC4.06](<Đặc tả usecase đầy đủ.md#uc4-06>) | [DB02](#db02), [DB09](#db09), [DB13](#db13) | [API10](#api10) |
| <a id="fr30"></a>FR30 | [US-018](User-Stories-INVEST-BDD.md#us-018) | [UC4.04](<Đặc tả usecase đầy đủ.md#uc4-04>), [UC3.04](<Đặc tả usecase đầy đủ.md#uc3-04>) | [DB08](#db08), [DB09](#db09) | [API10](#api10), [API09](#api09) |
| <a id="fr31"></a>FR31 | [US-018](User-Stories-INVEST-BDD.md#us-018) | [UC4.05](<Đặc tả usecase đầy đủ.md#uc4-05>) | [DB09](#db09) | [API10](#api10) |
| <a id="fr32"></a>FR32 | [US-020](User-Stories-INVEST-BDD.md#us-020) | [UC4.07](<Đặc tả usecase đầy đủ.md#uc4-07>), [UC4.06](<Đặc tả usecase đầy đủ.md#uc4-06>) | [DB09](#db09), [DB10](#db10), [DB14](#db14), [DB13](#db13) | [API10](#api10) |
| <a id="fr33"></a>FR33 | [US-021](User-Stories-INVEST-BDD.md#us-021) | [UC4.08](<Đặc tả usecase đầy đủ.md#uc4-08>) | [DB09](#db09), [DB10](#db10), [DB11](#db11) | [API11](#api11) |
| <a id="fr34"></a>FR34 | [US-022](User-Stories-INVEST-BDD.md#us-022) | [UC4.09](<Đặc tả usecase đầy đủ.md#uc4-09>) | [DB10](#db10), [DB13](#db13) | [API11](#api11) |

### Hỗ trợ bệnh nhân ngoại trú

| Mã yêu cầu | User Story | Use Case | Schema CSDL ĐX | API ĐX |
| --- | --- | --- | --- | --- |
| <a id="fr35"></a>FR35 | [US-023](User-Stories-INVEST-BDD.md#us-023) | [UC5.01](<Đặc tả usecase đầy đủ.md#uc5-01>), [UC5.02](<Đặc tả usecase đầy đủ.md#uc5-02>) | [DB01](#db01), [DB11](#db11), [DB14](#db14) | [API12](#api12) |
| <a id="fr36"></a>FR36 | [US-024](User-Stories-INVEST-BDD.md#us-024) | [UC5.03](<Đặc tả usecase đầy đủ.md#uc5-03>) | [DB09](#db09), [DB10](#db10), [DB11](#db11) | [API13](#api13) |
| <a id="fr37"></a>FR37 | [US-025](User-Stories-INVEST-BDD.md#us-025) | [UC5.04](<Đặc tả usecase đầy đủ.md#uc5-04>) | [DB10](#db10), [DB11](#db11), [DB14](#db14) | [API14](#api14) |
| <a id="fr38"></a>FR38 | [US-025](User-Stories-INVEST-BDD.md#us-025) | [UC5.05](<Đặc tả usecase đầy đủ.md#uc5-05>) | [DB14](#db14) | [API14](#api14) |
| <a id="fr39"></a>FR39 | [US-025](User-Stories-INVEST-BDD.md#us-025) | [UC5.06](<Đặc tả usecase đầy đủ.md#uc5-06>) | [DB09](#db09), [DB10](#db10), [DB14](#db14) | [API14](#api14) |

### Quản trị hệ thống và dữ liệu dùng chung

| Mã yêu cầu | User Story | Use Case | Schema CSDL ĐX | API ĐX |
| --- | --- | --- | --- | --- |
| <a id="fr40"></a>FR40 | [US-027](User-Stories-INVEST-BDD.md#us-027), [US-026](User-Stories-INVEST-BDD.md#us-026), [US-029](User-Stories-INVEST-BDD.md#us-029) | [UC6.01](<Đặc tả usecase đầy đủ.md#uc6-01>), [UC6.02](<Đặc tả usecase đầy đủ.md#uc6-02>), [UC6.03](<Đặc tả usecase đầy đủ.md#uc6-03>), [UC6.05](<Đặc tả usecase đầy đủ.md#uc6-05>) | [DB11](#db11), [DB13](#db13) | [API01](#api01), [API15](#api15) |
| <a id="fr41"></a>FR41 | [US-030](User-Stories-INVEST-BDD.md#us-030), [US-031](User-Stories-INVEST-BDD.md#us-031) | [UC6.08](<Đặc tả usecase đầy đủ.md#uc6-08>), [UC6.07](<Đặc tả usecase đầy đủ.md#uc6-07>) | [DB03](#db03), [DB12](#db12), [DB13](#db13) | [API06](#api06), [API18](#api18) |
| <a id="fr42"></a>FR42 | [US-029](User-Stories-INVEST-BDD.md#us-029) | [UC6.06](<Đặc tả usecase đầy đủ.md#uc6-06>) | [DB11](#db11), [DB13](#db13) | [API15](#api15) |
| <a id="fr43"></a>FR43 | [US-030](User-Stories-INVEST-BDD.md#us-030) | [UC6.08](<Đặc tả usecase đầy đủ.md#uc6-08>) | [DB02](#db02), [DB03](#db03), [DB13](#db13) | [API06](#api06), [API03](#api03) |
| <a id="fr44"></a>FR44 | [US-035](User-Stories-INVEST-BDD.md#us-035) | [UC6.12](<Đặc tả usecase đầy đủ.md#uc6-12>) | [DB13](#db13), [DB06](#db06) | [API17](#api17) |
| <a id="fr45"></a>FR45 | [US-033](User-Stories-INVEST-BDD.md#us-033) | [UC6.09](<Đặc tả usecase đầy đủ.md#uc6-09>) | [DB13](#db13), [DB11](#db11) | [API16](#api16) |
| <a id="fr46"></a>FR46 | [US-028](User-Stories-INVEST-BDD.md#us-028) | [UC6.04](<Đặc tả usecase đầy đủ.md#uc6-04>) | [DB11](#db11), [DB13](#db13) | [API01](#api01) |

### Nội dung yêu cầu để đối chiếu

| Mã | Yêu cầu chức năng |
| --- | --- |
| [FR01](#fr01) | Tra cứu/tạo hồ sơ bệnh án theo người bệnh, cấp mã BN-xxxxx; lưu hành chính, mã nguồn khi có và thời điểm tạo. |
| [FR02](#fr02) | Liên kết tài khoản bệnh nhân với hồ sơ sau xác minh để xem phần đã công bố. |
| [FR03](#fr03) | Quản lý khung giờ, sức chứa và lịch hẹn; tra cứu, cập nhật theo quyền. |
| [FR04](#fr04) | Mở/liên kết lượt với hồ sơ, thời điểm, mã lượt/mã nguồn; quản lý trạng thái đến hoàn tất. |
| [FR05](#fr05) | Bác sĩ hoặc nhân viên y tế có quyền nhập, lưu và bổ sung lâm sàng, tiền sử, dị ứng, thuốc và lão khoa phù hợp trên biểu mẫu. |
| [FR06](#fr06) | Ghi chỉ định bác sĩ; nhập/cập nhật kết quả cận lâm sàng vào đúng lượt. |
| [FR07](#fr07) | Tra cứu bệnh án, thuốc và lịch sử khám/điều trị theo lượt, nguồn và phiên bản. |
| [FR08](#fr08) | Nhận file từ HIS qua người có quyền; lưu nguồn, thời điểm và mã lần nhập, báo lỗi đọc. |
| [FR09](#fr09) | Cấu hình/áp dụng ánh xạ cột và đối chiếu mã người bệnh, lượt với liên kết đã xác minh. |
| [FR10](#fr10) | Kiểm tra cấu trúc, kiểu, giá trị, đơn vị và thông tin định danh cần cho lần nhập. |
| [FR11](#fr11) | Chuẩn hóa tên/mã/đơn vị/ngày giờ theo quy tắc đã xác định, giữ giá trị gốc và dấu vết. |
| [FR12](#fr12) | Kiểm soát dữ liệu trùng, bản sửa và xung đột với dữ liệu hiện có. |
| [FR13](#fr13) | Hiển thị xem trước; bác sĩ chọn phần đủ điều kiện và xác nhận ghi vào bệnh án sản phẩm. |
| [FR14](#fr14) | Tra cứu lần nhập theo mã, nguồn, hồ sơ/lượt, thời gian, trạng thái và lỗi. |
| [FR15](#fr15) | Khắc phục và xử lý lại lần nhập lỗi/chờ; kiểm tra trạng thái trước thử lại. |
| [FR16](#fr16) | Lấy dữ liệu bệnh án, kiểm tra đối tượng và điều kiện đầu vào Diagnosis. |
| [FR17](#fr17) | Diagnosis cung cấp nhận định/phân loại và các đầu ra đã đặc tả, kèm căn cứ hoặc giới hạn. |
| [FR18](#fr18) | Lab/Test gợi ý xét nghiệm/thăm dò, lý do và ưu tiên theo dữ liệu, kết quả Diagnosis liên quan. |
| [FR19](#fr19) | Đánh giá lại hỗ trợ khi có kết quả mới hoặc dữ liệu liên quan thay đổi. |
| [FR20](#fr20) | Treatment gợi ý phương án theo bệnh cảnh, dữ liệu thực đo, bệnh đồng mắc và thuốc. |
| [FR21](#fr21) | Nêu điều kiện cá thể hóa, giới hạn và yêu cầu theo dõi đi cùng phương án Treatment. |
| [FR22](#fr22) | MedSafety rà soát tương tác, chống chỉ định, trùng, liều/nguy cơ theo quy tắc và dữ liệu liên quan. |
| [FR23](#fr23) | Hiển thị thuốc/yếu tố liên quan, mức cảnh báo, lý do, căn cứ và gợi ý xử lý khi nguồn có. |
| [FR24](#fr24) | Liên kết dữ liệu và đầu ra liên quan theo Diagnosis → Lab/Test → Treatment → MedSafety. |
| [FR25](#fr25) | Lưu và cho Bác sĩ/nhân viên y tế có quyền xem các lần hỗ trợ, đầu vào/phiên bản, kết quả, căn cứ/cảnh báo và trạng thái cần xem lại. |
| [FR26](#fr26) | Báo lỗi, quá thời gian hoặc chưa hỗ trợ khi không đánh giá được; giữ dữ liệu đã nhập. |
| [FR27](#fr27) | Bác sĩ ghi/xác nhận kết luận hoặc chưa đủ bằng chứng và hướng xử trí trong bệnh án. |
| [FR28](#fr28) | Ghi phản hồi chấp nhận, điều chỉnh hoặc từ chối gợi ý liên quan. |
| [FR29](#fr29) | Lập/sửa dự thảo; bác sĩ xem xét và xác nhận phiên bản kế hoạch cụ thể. |
| [FR30](#fr30) | Nhập/sửa phương án thuốc, yêu cầu MedSafety và xem lại khi dữ liệu ảnh hưởng đổi. |
| [FR31](#fr31) | Ghi hướng dẫn, nội dung theo dõi và mốc/điều kiện tái khám trong kế hoạch. |
| [FR32](#fr32) | Điều chỉnh kế hoạch đã xác nhận bằng phiên bản mới, có lý do và xác nhận lại. |
| [FR33](#fr33) | Chọn và công bố phần kết quả, kế hoạch đã xác nhận được phép cho bệnh nhân. |
| [FR34](#fr34) | Thay thế hoặc thu hồi nội dung đã công bố, giữ lý do và lịch sử. |
| [FR35](#fr35) | Bệnh nhân chọn khám mới/tái khám, thông tin cơ bản và khung giờ còn chỗ; đặt/xem lịch. |
| [FR36](#fr36) | Xem kết quả, thuốc, hướng dẫn và kế hoạch theo dõi đã công bố, có thời điểm áp dụng. |
| [FR37](#fr37) | Tạo/hiển thị thông báo theo sự kiện được chọn, quản lý chưa đọc/đã đọc. |
| [FR38](#fr38) | Nhắc lịch hẹn đã xác nhận; cập nhật/hủy nhắc tương lai khi lịch đổi. |
| [FR39](#fr39) | Nhắc thuốc theo kế hoạch hiện hành đã xác nhận, được công bố và đủ thời điểm dùng. |
| [FR40](#fr40) | Quản lý tài khoản, đăng nhập/đăng xuất, khóa/mở khóa; dùng một trang đăng nhập theo vai trò. |
| [FR41](#fr41) | Admin quản lý mẫu, trường dữ liệu và danh mục dùng chung: mã, nhãn, kiểu, đơn vị, lựa chọn, trạng thái; có nguồn chuyên môn khi cần. |
| [FR42](#fr42) | Cấp, thay đổi, thu hồi vai trò/quyền theo thao tác và phạm vi hồ sơ. |
| [FR43](#fr43) | Lưu phiên bản mẫu và gắn mỗi lượt với cấu trúc đã dùng; áp dụng mẫu mới cho lượt mới. |
| [FR44](#fr44) | Sao lưu và khôi phục dữ liệu ứng dụng cùng mẫu/phiên bản và tham chiếu tệp cần thiết. |
| [FR45](#fr45) | Ghi/tra cứu nhật ký theo người, thời gian, thao tác, đối tượng và lần nhập liên quan. |
| [FR46](#fr46) | Khôi phục truy cập qua phương thức xác minh hoặc người hỗ trợ có quyền. |

<a id="schema"></a>

## 4 Danh mục Schema CSDL dự kiến

**Tất cả các dòng là ĐX.** Tên bảng tham chiếu đề xuất mục 5.3, chưa phải lược đồ đã được duyệt hoặc migration đã chạy. Khóa, cột, chỉ mục và ràng buộc đầy đủ phải được bổ sung trong ERD/từ điển dữ liệu/DDL; RTM chưa chứng minh đạt 3NF.

| Mã | Phần dữ liệu | Bảng dự kiến | Ý nghĩa liên kết |
| --- | --- | --- | --- |
| <a id="db01"></a>DB01 | Người bệnh và định danh nguồn | patient; patient_identifier; data_source | Mã BN, thông tin hành chính; nguồn/loại/giá trị mã và người bệnh đích. Mã nguồn được xác minh, không thay mã BN. |
| <a id="db02"></a>DB02 | Lượt khám | encounter; encounter_identifier | Người bệnh chủ, mã lượt, thời điểm, trạng thái, revision và phiên bản mẫu; mã lượt tại nguồn. |
| <a id="db03"></a>DB03 | Mẫu và phiên bản | form_template; form_version; form_section; form_version_field; field_option | Cấu trúc nhóm/trường, nhãn, kiểu, đơn vị/lựa chọn và phiên bản đã ghim cho lượt. |
| <a id="db04"></a>DB04 | Dữ liệu khám và bản sửa | clinical_record; clinical_record_version | Giá trị có kiểu và trạng thái thiếu, lần quan sát, bản sửa, nguồn, người/thời điểm, tham chiếu phần nhập. |
| <a id="db05"></a>DB05 | Chỉ định cận lâm sàng | test_order; test_order_item | Nội dung chỉ định bác sĩ, thời điểm và liên kết kết quả thực đo tại DB04. |
| <a id="db06"></a>DB06 | File và cấu hình nhập | stored_file; import_mapping_version; import_mapping_item | Tham chiếu file/nguồn, mã băm, phiên bản ánh xạ cột, trường đích và quy tắc chuyển đổi. |
| <a id="db07"></a>DB07 | Lần nhập và từng phần dữ liệu | import_batch; import_item | Mã lần nhập, vị trí nguồn, đích người/lượt, trạng thái từng phần, giá trị gốc/chuẩn hóa, lỗi/xung đột, xác nhận và dấu vết đã ghi. |
| <a id="db08"></a>DB08 | Lần hỗ trợ chuyên môn | ai_run; ai_run_input; ai_result; ai_feedback | Module và phương pháp/phiên bản; dữ liệu đầu vào hoặc tham chiếu bất biến, đầu ra, căn cứ/cảnh báo, giới hạn và phản hồi. |
| <a id="db09"></a>DB09 | Kết luận và kế hoạch | clinical_conclusion; care_plan; care_plan_version; care_plan_medication | Người bệnh/lượt, kết luận, thuốc/hướng dẫn/theo dõi, phiên bản, lý do điều chỉnh, người/thời điểm xác nhận và hiệu lực. |
| <a id="db10"></a>DB10 | Nội dung được công bố | published_content | Đúng người bệnh và phiên bản chuyên môn được cấp xem; phạm vi, công bố/thay thế/thu hồi và lịch sử. |
| <a id="db11"></a>DB11 | Tài khoản và quyền | app_user; role; permission; auth_session; patient_account_link; các bảng liên kết quyền/phạm vi hồ sơ | Phiên và trạng thái tài khoản, vai trò, quyền thao tác, phạm vi hồ sơ, liên kết bệnh nhân sau xác minh. Tên bảng liên kết vật lý chưa chốt. |
| <a id="db12"></a>DB12 | Danh mục dùng chung | Các bảng danh mục đơn vị, ICD, đơn vị đo, lựa chọn và danh mục chuyên môn; chưa chốt tên bảng vật lý | Mã/nhãn/trạng thái, nguồn và lịch sử tham chiếu. Không suy ra đã có kho quy tắc y khoa được kiểm định. |
| <a id="db13"></a>DB13 | Nhật ký và bản sao | audit_event; backup_job; restore_job | Người/công việc, thời điểm, thao tác, đối tượng, kết quả; metadata bản sao/khôi phục. File sao lưu thật nằm ở kho phù hợp. |
| <a id="db14"></a>DB14 | Lịch, thông báo và nhắc | appointment_slot; appointment; notification; reminder | Sức chứa và lịch hẹn đúng người, liên kết lượt nếu có, sự kiện/người nhận, kế hoạch nguồn, thời điểm/trạng thái nhắc. |

Giá trị nhập tay/file dùng chung dữ liệu đích DB04; DB06–DB07 giữ vùng tiếp nhận/xem trước và nguồn gốc. DB08 lưu các lần hỗ trợ, DB09 lưu quyết định bác sĩ, DB10 cấp phạm vi xem; không tạo bốn nguồn bệnh án riêng cho bốn module.

<a id="api"></a>

## 5 Danh mục API dự kiến

**Tất cả các dòng là ĐX.** Các đường dẫn dưới đây là tên tương đối của API trong sản phẩm; tiền tố/phiên bản sẽ chốt ở OpenAPI. Nêu nhóm endpoint giúp rà soát trách nhiệm, chưa cam kết mọi endpoint hoặc tham số đã hiện thực. Công việc worker và kiểm tra nội bộ không bắt buộc trở thành API công khai.

| Mã | Nhóm API | Giao diện đề xuất | Trách nhiệm |
| --- | --- | --- | --- |
| <a id="api01"></a>API01 | Tài khoản cá nhân | `POST /auth/login`<br>`POST /auth/logout`<br>`GET/PATCH /me`<br>`POST /auth/registrations`<br>`POST /auth/recovery` | Đăng nhập dùng chung, đăng xuất, thông tin cá nhân, đăng ký bệnh nhân và yêu cầu khôi phục. Bước xác minh cụ thể cần thiết kế tiếp. |
| <a id="api02"></a>API02 | Hồ sơ người bệnh | `GET/POST /patients`<br>`GET/PATCH /patients/{id}`<br>`GET /patients/{id}/history` | Tra cứu/tạo/cập nhật hành chính và lịch sử theo quyền; cập nhật hành chính không sửa dữ liệu lâm sàng. |
| <a id="api03"></a>API03 | Lượt khám | `GET/POST /patients/{id}/encounters`<br>`GET /encounters/{id}`<br>`POST /encounters/{id}/transitions` | Mở/liên kết lượt, tra cứu và yêu cầu chuyển trạng thái theo quyền/điều kiện. |
| <a id="api04"></a>API04 | Dữ liệu khám | `GET/POST /encounters/{id}/records`<br>`PATCH /clinical-records/{id}` | Nhập tay/mở lại dữ liệu, sửa có revision và lịch sử; chỉ định/kết quả thực đo giữ ngữ cảnh. |
| <a id="api05"></a>API05 | Chỉ định cận lâm sàng | `GET/POST /encounters/{id}/test-orders` | Ghi/tra chỉ định bác sĩ; kết quả được ghi vào dữ liệu khám API04 với liên kết phù hợp. |
| <a id="api06"></a>API06 | Biểu mẫu | `GET/POST /form-templates`<br>`POST /form-templates/{id}/versions`<br>`PATCH /form-versions/{id}`<br>`POST /form-versions/{id}/activate` | Quản lý cấu trúc, trường và phiên bản; bản đã áp dụng không bị sửa ngầm, thay đổi tạo bản phù hợp. |
| <a id="api07"></a>API07 | Cấu hình nguồn | `GET/POST /import-mappings`<br>`POST /import-mappings/{id}/versions` | Admin cấu hình/kiểm tra ánh xạ có phiên bản, không xác nhận dữ liệu lâm sàng thay bác sĩ. |
| <a id="api08"></a>API08 | Tiếp nhận file | `POST /imports`<br>`GET /imports`<br>`GET /imports/{id}`<br>`POST /imports/{id}/confirm`<br>`POST /imports/{id}/retry` | Đọc/xem trước, đối chiếu/kiểm tra/chuẩn hóa/chống trùng, xác nhận ghi và kiểm tra/thử lại. Các kiểm tra là hành vi bên trong, không buộc tạo API riêng cho từng bước. |
| <a id="api09"></a>API09 | Hỗ trợ chuyên môn | `POST /encounters/{id}/ai-runs`<br>`GET /encounters/{id}/ai-runs`<br>`GET /ai-runs/{id}`<br>`POST /ai-runs/{id}/feedback` | Chọn module, kiểm tra đầu vào, chạy/đánh giá lại, đọc lịch sử/căn cứ/cảnh báo và phản hồi theo quyền. Không gọi endpoint bệnh viện. |
| <a id="api10"></a>API10 | Kết luận và kế hoạch | `GET/POST /encounters/{id}/conclusions`<br>`GET/POST /encounters/{id}/care-plans`<br>`POST /care-plans/{id}/versions`<br>`PATCH /care-plan-versions/{id}`<br>`POST /care-plan-versions/{id}/confirm` | Ghi/xác nhận kết luận theo thao tác được thiết kế; tạo/sửa dự thảo, thuốc/theo dõi, xác nhận và điều chỉnh có phiên bản. Điều chỉnh thành công phải qua xác nhận lại. |
| <a id="api11"></a>API11 | Công bố | `POST /publications`<br>`POST /publications/{id}/replace`<br>`POST /publications/{id}/revoke` | Công bố đúng phiên bản đã xác nhận, thay thế/thu hồi theo quyền và lưu lịch sử. |
| <a id="api12"></a>API12 | Khung giờ và lịch | `GET/POST /appointment-slots`<br>`PATCH /appointment-slots/{id}`<br>`GET/POST /appointments`<br>`PATCH /appointments/{id}` | Quản lý khung giờ/sức chứa và lịch; bệnh nhân chỉ thao tác lịch của mình khi triển khai. |
| <a id="api13"></a>API13 | Liên kết và xem phần bệnh nhân | `POST /patient-account-links`<br>`GET /me/publications`<br>`GET /me/publications/{id}` | Liên kết sau xác minh và xem đúng nội dung được công bố của bệnh nhân; không trả bệnh án nội bộ đầy đủ. |
| <a id="api14"></a>API14 | Thông báo và nhắc | `GET /me/notifications`<br>`POST /me/notifications/{id}/read` | App lấy thông báo và đánh dấu đọc. Tạo/cập nhật nhắc do công việc theo lịch bên trong; không mở API công khai cho bệnh nhân tự sinh nhắc từ dữ liệu chưa xác nhận. |
| <a id="api15"></a>API15 | Quản trị tài khoản và quyền | `GET/POST /admin/users`<br>`PATCH /admin/users/{id}`<br>`GET/PUT /admin/users/{id}/permissions`<br>`GET/PUT /admin/roles/{id}/permissions` | Cấp/quản lý tài khoản và thay đổi quyền trong phạm vi quản trị; quyền Admin không tự là quyền xác nhận chuyên môn. |
| <a id="api16"></a>API16 | Nhật ký | `GET /admin/audit-events` | Tra sự kiện và thay đổi theo quyền, không API sửa/xóa nhật ký cho người dùng thông thường. |
| <a id="api17"></a>API17 | Sao lưu và khôi phục | `POST /admin/backups`<br>`GET /admin/backups/{id}`<br>`POST /admin/restores`<br>`GET /admin/restores/{id}` | Khởi tạo/tra kết quả công việc kỹ thuật có quyền riêng; đây là hướng giao diện đề xuất, có thể thay bằng công cụ vận hành được ghi nhận nếu nhóm chọn. |
| <a id="api18"></a>API18 | Danh mục | `GET/POST /admin/catalogs/{code}/items`<br>`PATCH /admin/catalogs/{code}/items/{id}` | Thêm/sửa/ngừng dùng danh mục theo quyền, giữ tham chiếu lịch sử; không tự duyệt tri thức lâm sàng. |

<a id="kiem-chung"></a>

## 6 Liên kết BDD và trạng thái kiểm chứng

Trạng thái của cả 46 dòng hiện là **chưa kiểm chứng theo phiên bản RTM này**. Khi chạy thử, bổ sung mã Test Case, phiên bản mã/cấu hình/dữ liệu, kết quả và liên kết bằng chứng tại dòng liên quan. Số BDD không thể dùng để tính tỷ lệ kiểm thử đạt.

| FR | BDD dự kiến | Test Case thực thi | Kết quả và bằng chứng |
| --- | --- | --- | --- |
| [FR01](#fr01) | [BDD01](User-Stories-INVEST-BDD.md#bdd01), [BDD40](User-Stories-INVEST-BDD.md#bdd40) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR02](#fr02) | [BDD14](User-Stories-INVEST-BDD.md#bdd14), [BDD20](User-Stories-INVEST-BDD.md#bdd20) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR03](#fr03) | [BDD10](User-Stories-INVEST-BDD.md#bdd10), [BDD39](User-Stories-INVEST-BDD.md#bdd39) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR04](#fr04) | [BDD17](User-Stories-INVEST-BDD.md#bdd17) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR05](#fr05) | [BDD02](User-Stories-INVEST-BDD.md#bdd02), [BDD08](User-Stories-INVEST-BDD.md#bdd08), [BDD09](User-Stories-INVEST-BDD.md#bdd09), [BDD43](User-Stories-INVEST-BDD.md#bdd43) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR06](#fr06) | [BDD18](User-Stories-INVEST-BDD.md#bdd18), [BDD21](User-Stories-INVEST-BDD.md#bdd21) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR07](#fr07) | [BDD18](User-Stories-INVEST-BDD.md#bdd18) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR08](#fr08) | [BDD15](User-Stories-INVEST-BDD.md#bdd15) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR09](#fr09) | [BDD03](User-Stories-INVEST-BDD.md#bdd03), [BDD36](User-Stories-INVEST-BDD.md#bdd36) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR10](#fr10) | [BDD04](User-Stories-INVEST-BDD.md#bdd04), [BDD15](User-Stories-INVEST-BDD.md#bdd15) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR11](#fr11) | [BDD16](User-Stories-INVEST-BDD.md#bdd16) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR12](#fr12) | [BDD05](User-Stories-INVEST-BDD.md#bdd05), [BDD06](User-Stories-INVEST-BDD.md#bdd06), [BDD09](User-Stories-INVEST-BDD.md#bdd09) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR13](#fr13) | [BDD03](User-Stories-INVEST-BDD.md#bdd03), [BDD04](User-Stories-INVEST-BDD.md#bdd04), [BDD06](User-Stories-INVEST-BDD.md#bdd06), [BDD41](User-Stories-INVEST-BDD.md#bdd41) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR14](#fr14) | [BDD05](User-Stories-INVEST-BDD.md#bdd05), [BDD34](User-Stories-INVEST-BDD.md#bdd34), [BDD44](User-Stories-INVEST-BDD.md#bdd44) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR15](#fr15) | [BDD05](User-Stories-INVEST-BDD.md#bdd05), [BDD06](User-Stories-INVEST-BDD.md#bdd06), [BDD41](User-Stories-INVEST-BDD.md#bdd41) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR16](#fr16) | [BDD12](User-Stories-INVEST-BDD.md#bdd12), [BDD38](User-Stories-INVEST-BDD.md#bdd38) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR17](#fr17) | [BDD12](User-Stories-INVEST-BDD.md#bdd12), [BDD38](User-Stories-INVEST-BDD.md#bdd38) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR18](#fr18) | [BDD21](User-Stories-INVEST-BDD.md#bdd21) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR19](#fr19) | [BDD24](User-Stories-INVEST-BDD.md#bdd24) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR20](#fr20) | [BDD22](User-Stories-INVEST-BDD.md#bdd22) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR21](#fr21) | [BDD22](User-Stories-INVEST-BDD.md#bdd22), [BDD26](User-Stories-INVEST-BDD.md#bdd26) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR22](#fr22) | [BDD23](User-Stories-INVEST-BDD.md#bdd23) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR23](#fr23) | [BDD23](User-Stories-INVEST-BDD.md#bdd23) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR24](#fr24) | [BDD22](User-Stories-INVEST-BDD.md#bdd22), [BDD24](User-Stories-INVEST-BDD.md#bdd24) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR25](#fr25) | [BDD24](User-Stories-INVEST-BDD.md#bdd24), [BDD38](User-Stories-INVEST-BDD.md#bdd38), [BDD45](User-Stories-INVEST-BDD.md#bdd45) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR26](#fr26) | [BDD12](User-Stories-INVEST-BDD.md#bdd12) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR27](#fr27) | [BDD25](User-Stories-INVEST-BDD.md#bdd25) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR28](#fr28) | [BDD25](User-Stories-INVEST-BDD.md#bdd25) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR29](#fr29) | [BDD13](User-Stories-INVEST-BDD.md#bdd13), [BDD26](User-Stories-INVEST-BDD.md#bdd26), [BDD41](User-Stories-INVEST-BDD.md#bdd41), [BDD42](User-Stories-INVEST-BDD.md#bdd42) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR30](#fr30) | [BDD23](User-Stories-INVEST-BDD.md#bdd23), [BDD26](User-Stories-INVEST-BDD.md#bdd26) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR31](#fr31) | [BDD26](User-Stories-INVEST-BDD.md#bdd26) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR32](#fr32) | [BDD13](User-Stories-INVEST-BDD.md#bdd13), [BDD27](User-Stories-INVEST-BDD.md#bdd27), [BDD42](User-Stories-INVEST-BDD.md#bdd42) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR33](#fr33) | [BDD14](User-Stories-INVEST-BDD.md#bdd14), [BDD28](User-Stories-INVEST-BDD.md#bdd28) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR34](#fr34) | [BDD14](User-Stories-INVEST-BDD.md#bdd14), [BDD29](User-Stories-INVEST-BDD.md#bdd29) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR35](#fr35) | [BDD10](User-Stories-INVEST-BDD.md#bdd10), [BDD39](User-Stories-INVEST-BDD.md#bdd39) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR36](#fr36) | [BDD14](User-Stories-INVEST-BDD.md#bdd14), [BDD20](User-Stories-INVEST-BDD.md#bdd20) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR37](#fr37) | [BDD30](User-Stories-INVEST-BDD.md#bdd30) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR38](#fr38) | [BDD31](User-Stories-INVEST-BDD.md#bdd31) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR39](#fr39) | [BDD32](User-Stories-INVEST-BDD.md#bdd32) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR40](#fr40) | [BDD19](User-Stories-INVEST-BDD.md#bdd19), [BDD20](User-Stories-INVEST-BDD.md#bdd20), [BDD46](User-Stories-INVEST-BDD.md#bdd46), [BDD47](User-Stories-INVEST-BDD.md#bdd47), [BDD48](User-Stories-INVEST-BDD.md#bdd48), [BDD49](User-Stories-INVEST-BDD.md#bdd49), [BDD50](User-Stories-INVEST-BDD.md#bdd50) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR41](#fr41) | [BDD08](User-Stories-INVEST-BDD.md#bdd08), [BDD35](User-Stories-INVEST-BDD.md#bdd35) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR42](#fr42) | [BDD08](User-Stories-INVEST-BDD.md#bdd08), [BDD37](User-Stories-INVEST-BDD.md#bdd37), [BDD43](User-Stories-INVEST-BDD.md#bdd43), [BDD45](User-Stories-INVEST-BDD.md#bdd45) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR43](#fr43) | [BDD07](User-Stories-INVEST-BDD.md#bdd07), [BDD35](User-Stories-INVEST-BDD.md#bdd35) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR44](#fr44) | [BDD11](User-Stories-INVEST-BDD.md#bdd11) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR45](#fr45) | [BDD34](User-Stories-INVEST-BDD.md#bdd34) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |
| [FR46](#fr46) | [BDD33](User-Stories-INVEST-BDD.md#bdd33) | Chưa gán | Chưa kiểm chứng; chưa gắn bằng chứng |

<a id="rtm-nfr"></a>

## 7 Ma trận NFR

NFR là ràng buộc chất lượng áp dụng xuyên nhiều chức năng. Bảng chọn FR/US/UC đại diện để xác định nơi kiểm tra, không giới hạn NFR chỉ ở những ca đó. Những yêu cầu UI, tương thích và cài đặt không cần ép có bảng hay API độc lập. Tất cả kết quả thực thi hiện chưa được đánh giá trong bản RTM này.

| NFR | Nội dung | FR đại diện | User Story và Use Case đại diện | Schema và API chịu tác động ĐX | BDD và cách kiểm tra bổ sung |
| --- | --- | --- | --- | --- | --- |
| <a id="nfr01"></a>NFR01 | Kiểm soát tài khoản, phiên và quyền; từ chối truy cập ngoài vai trò/phạm vi, kể cả gọi API trực tiếp. | [FR40](#fr40), [FR42](#fr42), [FR02](#fr02), [FR36](#fr36) | US: [US-027](User-Stories-INVEST-BDD.md#us-027), [US-026](User-Stories-INVEST-BDD.md#us-026), [US-029](User-Stories-INVEST-BDD.md#us-029), [US-002](User-Stories-INVEST-BDD.md#us-002), [US-024](User-Stories-INVEST-BDD.md#us-024)<br>UC: [UC6.01](<Đặc tả usecase đầy đủ.md#uc6-01>), [UC6.02](<Đặc tả usecase đầy đủ.md#uc6-02>), [UC6.03](<Đặc tả usecase đầy đủ.md#uc6-03>), [UC6.05](<Đặc tả usecase đầy đủ.md#uc6-05>), [UC6.06](<Đặc tả usecase đầy đủ.md#uc6-06>), [UC1.04](<Đặc tả usecase đầy đủ.md#uc1-04>), [UC5.03](<Đặc tả usecase đầy đủ.md#uc5-03>) | [DB11](#db11), [DB13](#db13), [API01](#api01), [API13](#api13), [API15](#api15) | [BDD08](User-Stories-INVEST-BDD.md#bdd08), [BDD14](User-Stories-INVEST-BDD.md#bdd14), [BDD19](User-Stories-INVEST-BDD.md#bdd19), [BDD20](User-Stories-INVEST-BDD.md#bdd20), [BDD37](User-Stories-INVEST-BDD.md#bdd37), [BDD43](User-Stories-INVEST-BDD.md#bdd43), [BDD45](User-Stories-INVEST-BDD.md#bdd45)<br>Kiểm thử vai trò, phạm vi hồ sơ, phiên, API trực tiếp và quyền tệp. |
| <a id="nfr02"></a>NFR02 | Bảo vệ dữ liệu và bí mật khi truyền/lưu/ghi log; không lộ mật khẩu, khóa hoặc bệnh án ngoài quyền; dữ liệu thử tách biệt. | [FR40](#fr40), [FR42](#fr42), [FR45](#fr45) | US: [US-027](User-Stories-INVEST-BDD.md#us-027), [US-026](User-Stories-INVEST-BDD.md#us-026), [US-029](User-Stories-INVEST-BDD.md#us-029), [US-033](User-Stories-INVEST-BDD.md#us-033)<br>UC: [UC6.01](<Đặc tả usecase đầy đủ.md#uc6-01>), [UC6.02](<Đặc tả usecase đầy đủ.md#uc6-02>), [UC6.03](<Đặc tả usecase đầy đủ.md#uc6-03>), [UC6.05](<Đặc tả usecase đầy đủ.md#uc6-05>), [UC6.06](<Đặc tả usecase đầy đủ.md#uc6-06>), [UC6.09](<Đặc tả usecase đầy đủ.md#uc6-09>) | [DB06](#db06), [DB11](#db11), [DB13](#db13), [API01](#api01), [API08](#api08), [API13](#api13), [API16](#api16) | [BDD08](User-Stories-INVEST-BDD.md#bdd08), [BDD14](User-Stories-INVEST-BDD.md#bdd14), [BDD19](User-Stories-INVEST-BDD.md#bdd19), [BDD34](User-Stories-INVEST-BDD.md#bdd34)<br>Rà bảo vệ dữ liệu khi truyền/lưu/log; bí mật và file trong môi trường thử; không tự gán thuật toán/ngưỡng chưa thống nhất. |
| <a id="nfr03"></a>NFR03 | Lưu đúng bệnh nhân/lượt, nhất quán và kiểm soát sửa đồng thời; lỗi lưu không để trạng thái dở dang hoặc ghi đè âm thầm. | [FR04](#fr04), [FR05](#fr05), [FR13](#fr13), [FR29](#fr29), [FR32](#fr32) | US: [US-004](User-Stories-INVEST-BDD.md#us-004), [US-005](User-Stories-INVEST-BDD.md#us-005), [US-036](User-Stories-INVEST-BDD.md#us-036), [US-019](User-Stories-INVEST-BDD.md#us-019), [US-018](User-Stories-INVEST-BDD.md#us-018), [US-020](User-Stories-INVEST-BDD.md#us-020)<br>UC: [UC1.07](<Đặc tả usecase đầy đủ.md#uc1-07>), [UC1.12](<Đặc tả usecase đầy đủ.md#uc1-12>), [UC1.08](<Đặc tả usecase đầy đủ.md#uc1-08>), [UC2.01](<Đặc tả usecase đầy đủ.md#uc2-01>), [UC4.03](<Đặc tả usecase đầy đủ.md#uc4-03>), [UC4.06](<Đặc tả usecase đầy đủ.md#uc4-06>), [UC4.07](<Đặc tả usecase đầy đủ.md#uc4-07>) | [DB02](#db02), [DB04](#db04), [DB07](#db07), [DB09](#db09), [API03](#api03), [API04](#api04), [API08](#api08), [API10](#api10) | [BDD02](User-Stories-INVEST-BDD.md#bdd02), [BDD03](User-Stories-INVEST-BDD.md#bdd03), [BDD09](User-Stories-INVEST-BDD.md#bdd09), [BDD13](User-Stories-INVEST-BDD.md#bdd13), [BDD41](User-Stories-INVEST-BDD.md#bdd41)<br>Thử xung đột revision, lỗi giữa giao dịch, sai người/lượt và xác nhận bản cũ. |
| <a id="nfr04"></a>NFR04 | Thử lại cùng thao tác không tạo trùng; lần nhập mới sau khi dữ liệu đích đổi phải được đối chiếu lại. Nhắc không trùng khi triển khai nhánh 5. | [FR12](#fr12), [FR15](#fr15), [FR37](#fr37), [FR38](#fr38), [FR39](#fr39) | US: [US-036](User-Stories-INVEST-BDD.md#us-036), [US-011](User-Stories-INVEST-BDD.md#us-011), [US-025](User-Stories-INVEST-BDD.md#us-025)<br>UC: [UC2.05](<Đặc tả usecase đầy đủ.md#uc2-05>), [UC2.09](<Đặc tả usecase đầy đủ.md#uc2-09>), [UC5.04](<Đặc tả usecase đầy đủ.md#uc5-04>), [UC5.05](<Đặc tả usecase đầy đủ.md#uc5-05>), [UC5.06](<Đặc tả usecase đầy đủ.md#uc5-06>) | [DB07](#db07), [DB14](#db14), [API08](#api08), [API14](#api14) | [BDD05](User-Stories-INVEST-BDD.md#bdd05), [BDD06](User-Stories-INVEST-BDD.md#bdd06), [BDD30](User-Stories-INVEST-BDD.md#bdd30), [BDD31](User-Stories-INVEST-BDD.md#bdd31), [BDD32](User-Stories-INVEST-BDD.md#bdd32)<br>Thử lại cùng thao tác, nhập mới sau sửa đích và chống trùng công việc nhắc. |
| <a id="nfr05"></a>NFR05 | Truy được nguồn, người, thời điểm và phiên bản; bảo vệ nhật ký và cấu trúc mẫu lịch sử khỏi thay đổi ngầm. | [FR05](#fr05), [FR07](#fr07), [FR25](#fr25), [FR43](#fr43), [FR45](#fr45) | US: [US-005](User-Stories-INVEST-BDD.md#us-005), [US-007](User-Stories-INVEST-BDD.md#us-007), [US-016](User-Stories-INVEST-BDD.md#us-016), [US-030](User-Stories-INVEST-BDD.md#us-030), [US-033](User-Stories-INVEST-BDD.md#us-033)<br>UC: [UC1.08](<Đặc tả usecase đầy đủ.md#uc1-08>), [UC1.11](<Đặc tả usecase đầy đủ.md#uc1-11>), [UC3.06](<Đặc tả usecase đầy đủ.md#uc3-06>), [UC3.07](<Đặc tả usecase đầy đủ.md#uc3-07>), [UC6.08](<Đặc tả usecase đầy đủ.md#uc6-08>), [UC6.09](<Đặc tả usecase đầy đủ.md#uc6-09>) | [DB03](#db03), [DB04](#db04), [DB06](#db06), [DB07](#db07), [DB08](#db08), [DB13](#db13), [API04](#api04), [API06](#api06), [API08](#api08), [API09](#api09), [API16](#api16) | [BDD07](User-Stories-INVEST-BDD.md#bdd07), [BDD18](User-Stories-INVEST-BDD.md#bdd18), [BDD24](User-Stories-INVEST-BDD.md#bdd24), [BDD34](User-Stories-INVEST-BDD.md#bdd34), [BDD36](User-Stories-INVEST-BDD.md#bdd36)<br>Đối chiếu nguồn/người/thời điểm/phiên bản và lịch sử không bị đổi ngầm. |
| <a id="nfr06"></a>NFR06 | AI tuân thủ điều kiện áp dụng, bác sĩ quyết định cuối; thiếu dữ liệu/lỗi không được hiển thị như bình thường hoặc an toàn. | [FR16](#fr16), [FR18](#fr18), [FR20](#fr20), [FR22](#fr22), [FR26](#fr26), [FR27](#fr27), [FR29](#fr29) | US: [US-012](User-Stories-INVEST-BDD.md#us-012), [US-013](User-Stories-INVEST-BDD.md#us-013), [US-014](User-Stories-INVEST-BDD.md#us-014), [US-015](User-Stories-INVEST-BDD.md#us-015), [US-016](User-Stories-INVEST-BDD.md#us-016), [US-017](User-Stories-INVEST-BDD.md#us-017), [US-019](User-Stories-INVEST-BDD.md#us-019), [US-018](User-Stories-INVEST-BDD.md#us-018)<br>UC: [UC3.05](<Đặc tả usecase đầy đủ.md#uc3-05>), [UC3.02](<Đặc tả usecase đầy đủ.md#uc3-02>), [UC3.03](<Đặc tả usecase đầy đủ.md#uc3-03>), [UC3.04](<Đặc tả usecase đầy đủ.md#uc3-04>), [UC3.06](<Đặc tả usecase đầy đủ.md#uc3-06>), [UC4.01](<Đặc tả usecase đầy đủ.md#uc4-01>), [UC4.03](<Đặc tả usecase đầy đủ.md#uc4-03>), [UC4.06](<Đặc tả usecase đầy đủ.md#uc4-06>) | [DB04](#db04), [DB08](#db08), [DB09](#db09), [API09](#api09), [API10](#api10) | [BDD12](User-Stories-INVEST-BDD.md#bdd12), [BDD21](User-Stories-INVEST-BDD.md#bdd21), [BDD22](User-Stories-INVEST-BDD.md#bdd22), [BDD23](User-Stories-INVEST-BDD.md#bdd23), [BDD25](User-Stories-INVEST-BDD.md#bdd25)<br>Ca thiếu dữ liệu/lỗi và giới hạn gợi ý, quyền xác nhận bác sĩ; cần bộ ca chuyên môn. |
| <a id="nfr07"></a>NFR07 | Quy tắc/mô hình có nguồn, phiên bản và bộ ca rà soát; chỉ dùng bản được phép, không tự học lại từ phản hồi. | [FR17](#fr17), [FR24](#fr24), [FR25](#fr25), [FR28](#fr28) | US: [US-012](User-Stories-INVEST-BDD.md#us-012), [US-016](User-Stories-INVEST-BDD.md#us-016), [US-017](User-Stories-INVEST-BDD.md#us-017)<br>UC: [UC3.01](<Đặc tả usecase đầy đủ.md#uc3-01>), [UC3.02](<Đặc tả usecase đầy đủ.md#uc3-02>), [UC3.03](<Đặc tả usecase đầy đủ.md#uc3-03>), [UC3.04](<Đặc tả usecase đầy đủ.md#uc3-04>), [UC3.05](<Đặc tả usecase đầy đủ.md#uc3-05>), [UC3.06](<Đặc tả usecase đầy đủ.md#uc3-06>), [UC3.07](<Đặc tả usecase đầy đủ.md#uc3-07>), [UC4.02](<Đặc tả usecase đầy đủ.md#uc4-02>) | [DB08](#db08), [API09](#api09) | [BDD24](User-Stories-INVEST-BDD.md#bdd24), [BDD25](User-Stories-INVEST-BDD.md#bdd25), [BDD38](User-Stories-INVEST-BDD.md#bdd38)<br>Rà nguồn/phương pháp/phiên bản và bộ ca; chưa thiết kế bảng quản trị mô hình riêng nên không tự đặt tên bảng đã có. |
| <a id="nfr08"></a>NFR08 | Đo thời gian phản hồi và tỷ lệ lỗi của lưu/tra cứu/nhập tệp theo cấu hình, dung lượng và tải xác định; chốt ngưỡng trước nghiệm thu. | [FR01](#fr01), [FR05](#fr05), [FR08](#fr08), [FR13](#fr13) | US: [US-001](User-Stories-INVEST-BDD.md#us-001), [US-005](User-Stories-INVEST-BDD.md#us-005), [US-008](User-Stories-INVEST-BDD.md#us-008), [US-036](User-Stories-INVEST-BDD.md#us-036)<br>UC: [UC1.01](<Đặc tả usecase đầy đủ.md#uc1-01>), [UC1.02](<Đặc tả usecase đầy đủ.md#uc1-02>), [UC1.03](<Đặc tả usecase đầy đủ.md#uc1-03>), [UC1.08](<Đặc tả usecase đầy đủ.md#uc1-08>), [UC2.01](<Đặc tả usecase đầy đủ.md#uc2-01>) | [DB01](#db01), [DB04](#db04), [DB07](#db07), [API02](#api02), [API04](#api04), [API08](#api08) | Phép đo/rà soát riêng; chưa gán Test Case.<br>Kế hoạch đo hiệu năng: máy/cấu hình, dữ liệu/cỡ file, tải, thời gian phản hồi và tỷ lệ lỗi; ngưỡng cần chốt. |
| <a id="nfr09"></a>NFR09 | Sao lưu có thể khôi phục; thử trên môi trường riêng và đối chiếu dữ liệu, mẫu/phiên bản, quyền và tệp cần thiết. | [FR44](#fr44) | US: [US-035](User-Stories-INVEST-BDD.md#us-035)<br>UC: [UC6.12](<Đặc tả usecase đầy đủ.md#uc6-12>) | [DB03](#db03), [DB04](#db04), [DB06](#db06), [DB11](#db11), [DB13](#db13), [API17](#api17) | [BDD11](User-Stories-INVEST-BDD.md#bdd11)<br>Khôi phục thử riêng và đối chiếu đủ dữ liệu/mẫu/quyền/tệp, ghi phiên bản và kết quả. |
| <a id="nfr10"></a>NFR10 | Giao diện tiếng Việt rõ, nhận diện đúng người/lượt; cuộn được đến mọi điều khiển, dùng được khi phóng to 200%, cảnh báo không chỉ bằng màu. | [FR01](#fr01), [FR04](#fr04), [FR05](#fr05), [FR13](#fr13), [FR25](#fr25), [FR36](#fr36) | US: [US-001](User-Stories-INVEST-BDD.md#us-001), [US-004](User-Stories-INVEST-BDD.md#us-004), [US-005](User-Stories-INVEST-BDD.md#us-005), [US-036](User-Stories-INVEST-BDD.md#us-036), [US-016](User-Stories-INVEST-BDD.md#us-016), [US-024](User-Stories-INVEST-BDD.md#us-024)<br>UC: [UC1.01](<Đặc tả usecase đầy đủ.md#uc1-01>), [UC1.02](<Đặc tả usecase đầy đủ.md#uc1-02>), [UC1.03](<Đặc tả usecase đầy đủ.md#uc1-03>), [UC1.07](<Đặc tả usecase đầy đủ.md#uc1-07>), [UC1.12](<Đặc tả usecase đầy đủ.md#uc1-12>), [UC1.08](<Đặc tả usecase đầy đủ.md#uc1-08>), [UC2.01](<Đặc tả usecase đầy đủ.md#uc2-01>), [UC3.06](<Đặc tả usecase đầy đủ.md#uc3-06>), [UC3.07](<Đặc tả usecase đầy đủ.md#uc3-07>), [UC5.03](<Đặc tả usecase đầy đủ.md#uc5-03>) | Không cần bảng/API độc lập; kiểm tra tại giao diện hoặc môi trường triển khai | Phép đo/rà soát riêng; chưa gán Test Case.<br>Rà giao diện tiếng Việt, cuộn mọi điều khiển, nhận diện người/lượt, phóng to 200%, cảnh báo có chữ. Đây là yêu cầu UI, không ép thành bảng CSDL hoặc endpoint riêng. |
| <a id="nfr11"></a>NFR11 | Kiểm tra luồng nền tảng trên Chrome/Edge ở phiên bản ghi trong bộ thử; kiểm tra nền tảng app khi triển khai nhánh 5. | [FR01](#fr01), [FR05](#fr05), [FR08](#fr08), [FR35](#fr35), [FR36](#fr36) | US: [US-001](User-Stories-INVEST-BDD.md#us-001), [US-005](User-Stories-INVEST-BDD.md#us-005), [US-008](User-Stories-INVEST-BDD.md#us-008), [US-023](User-Stories-INVEST-BDD.md#us-023), [US-024](User-Stories-INVEST-BDD.md#us-024)<br>UC: [UC1.01](<Đặc tả usecase đầy đủ.md#uc1-01>), [UC1.02](<Đặc tả usecase đầy đủ.md#uc1-02>), [UC1.03](<Đặc tả usecase đầy đủ.md#uc1-03>), [UC1.08](<Đặc tả usecase đầy đủ.md#uc1-08>), [UC2.01](<Đặc tả usecase đầy đủ.md#uc2-01>), [UC5.01](<Đặc tả usecase đầy đủ.md#uc5-01>), [UC5.02](<Đặc tả usecase đầy đủ.md#uc5-02>), [UC5.03](<Đặc tả usecase đầy đủ.md#uc5-03>) | Không cần bảng/API độc lập; kiểm tra tại giao diện hoặc môi trường triển khai | Phép đo/rà soát riêng; chưa gán Test Case.<br>Chạy các luồng được chọn trên Chrome/Edge, ghi phiên bản; app kiểm tra khi triển khai. Không có bảng/endpoint riêng cho tương thích trình duyệt. |
| <a id="nfr12"></a>NFR12 | Nhập file theo đặc tả có phiên bản; quy tắc cột/mã/đơn vị truy vết được, tách khỏi nghiệp vụ để thay mẫu nguồn có kiểm soát. | [FR08](#fr08), [FR09](#fr09), [FR10](#fr10), [FR11](#fr11), [FR12](#fr12), [FR13](#fr13), [FR14](#fr14), [FR15](#fr15) | US: [US-008](User-Stories-INVEST-BDD.md#us-008), [US-031](User-Stories-INVEST-BDD.md#us-031), [US-036](User-Stories-INVEST-BDD.md#us-036), [US-009](User-Stories-INVEST-BDD.md#us-009), [US-011](User-Stories-INVEST-BDD.md#us-011)<br>UC: [UC2.01](<Đặc tả usecase đầy đủ.md#uc2-01>), [UC2.02](<Đặc tả usecase đầy đủ.md#uc2-02>), [UC2.11](<Đặc tả usecase đầy đủ.md#uc2-11>), [UC2.03](<Đặc tả usecase đầy đủ.md#uc2-03>), [UC2.04](<Đặc tả usecase đầy đủ.md#uc2-04>), [UC2.05](<Đặc tả usecase đầy đủ.md#uc2-05>), [UC2.07](<Đặc tả usecase đầy đủ.md#uc2-07>), [UC2.12](<Đặc tả usecase đầy đủ.md#uc2-12>), [UC2.09](<Đặc tả usecase đầy đủ.md#uc2-09>) | [DB06](#db06), [DB07](#db07), [API07](#api07), [API08](#api08) | [BDD03](User-Stories-INVEST-BDD.md#bdd03), [BDD15](User-Stories-INVEST-BDD.md#bdd15), [BDD16](User-Stories-INVEST-BDD.md#bdd16), [BDD36](User-Stories-INVEST-BDD.md#bdd36)<br>Bộ file đúng/sai/thiếu, phiên bản ánh xạ và đơn vị; API response schema cần cụ thể hóa ở OpenAPI. |
| <a id="nfr13"></a>NFR13 | Cài đặt lại được từ hướng dẫn và môi trường phụ thuộc xác định; FR/NFR được liên kết với ca thử và bằng chứng đúng phiên bản. | [FR40](#fr40), [FR43](#fr43), [FR44](#fr44), [FR45](#fr45) | US: [US-027](User-Stories-INVEST-BDD.md#us-027), [US-026](User-Stories-INVEST-BDD.md#us-026), [US-029](User-Stories-INVEST-BDD.md#us-029), [US-030](User-Stories-INVEST-BDD.md#us-030), [US-035](User-Stories-INVEST-BDD.md#us-035), [US-033](User-Stories-INVEST-BDD.md#us-033)<br>UC: [UC6.01](<Đặc tả usecase đầy đủ.md#uc6-01>), [UC6.02](<Đặc tả usecase đầy đủ.md#uc6-02>), [UC6.03](<Đặc tả usecase đầy đủ.md#uc6-03>), [UC6.05](<Đặc tả usecase đầy đủ.md#uc6-05>), [UC6.08](<Đặc tả usecase đầy đủ.md#uc6-08>), [UC6.12](<Đặc tả usecase đầy đủ.md#uc6-12>), [UC6.09](<Đặc tả usecase đầy đủ.md#uc6-09>) | Không cần bảng/API độc lập; kiểm tra tại giao diện hoặc môi trường triển khai | Phép đo/rà soát riêng; chưa gán Test Case.<br>Thử cài lại từ tài liệu và môi trường phụ thuộc cố định; kiểm liên kết yêu cầu/thiết kế/ca thử/bằng chứng. Không có bảng hay endpoint bắt buộc riêng. |

<a id="cap-nhat"></a>

## 8 Kiểm tra tính đầy đủ và cách cập nhật

### Phạm vi đã liên kết trong tài liệu

| Nội dung | Kết quả lập tài liệu |
| --- | --- |
| FR | 46/46 mã có dòng truy vết tới US, UC, phần dữ liệu và API dự kiến. |
| NFR | 13/13 mã có nơi chịu tác động và cách kiểm tra; các phép đo riêng chưa gán kết quả đạt. |
| User Story | 33/33 mã xuất hiện trong truy vết FR. |
| Use Case | 54/54 ca hiện hành xuất hiện trong truy vết FR. Các mã rút/gộp không được tính là ca độc lập. |
| BDD | 50/50 Scenario dự kiến được tham chiếu trong FR. Chưa có kết quả thực thi trong bản RTM này. |
| Schema CSDL và API | 14 nhóm dữ liệu và 18 nhóm API đề xuất; chưa chốt DDL/OpenAPI cho phạm vi hiện hành. |
| Nghiệm thu | Chưa xác nhận tỷ lệ đạt hoặc độ phủ kiểm thử thực tế. |

**Giới hạn của số liệu:** 46/46 dòng có liên kết là độ đầy đủ truy vết ở mức tài liệu, không phải bằng chứng hoàn thành chức năng, đạt 100% yêu cầu nghiệp vụ hoặc đáp ứng checklist Schema cuối Sprint. Để kết luận đáp ứng, cần kiểm tra tính đúng của từng liên kết, chốt Schema/API và có bằng chứng kiểm thử tương ứng.

### Đối chiếu các bản đang có

Repo tài liệu đang lưu một schema 18 bảng và hợp đồng Gateway stub có 22 operation, dùng mã SYN, vai trò dược sĩ và nguồn mô phỏng. Những nội dung này thuộc thiết kế trước và chưa được lấy làm lược đồ/hợp đồng đã khớp SRS hiện tại. Bản demo biểu mẫu nằm ở repo sản phẩm riêng; chưa đọc lại nhánh mới nhất trong lần lập RTM, nên RTM không kết luận trạng thái triển khai của web demo.

### Quy trình cập nhật

1. Khi duyệt ERD và từ điển dữ liệu, thay các DB ĐX bằng bảng/cột/khóa cụ thể, liên kết đúng file schema hoặc migration. Không chỉ đổi nhãn trạng thái khi chưa kiểm tra nội dung.
2. Khi duyệt API, thay các API ĐX bằng method/path/operationId và link tới OpenAPI đúng phiên bản; cập nhật các yêu cầu có hành vi nội bộ hoặc công cụ vận hành thay endpoint.
3. Khi triển khai, thêm tham chiếu mã nguồn và mã Test Case. Khi chạy thử, ghi phiên bản, môi trường, dữ liệu, kết quả đạt/không đạt/chưa chạy và bằng chứng.
4. Khi đổi FR/US/UC, rà cả hai chiều để phát hiện yêu cầu thiếu thiết kế/ca thử và bảng/API không có căn cứ yêu cầu. Giữ các liên kết nhiều–nhiều cần thiết, không chia giả tạo thành một–một.
5. Cập nhật SRS, tài liệu US/BDD và report cùng phiên bản. Không đưa đề xuất mục 5.3 thành quyết định đã chốt khi trưởng nhóm chưa duyệt.

### Vị trí tệp khi đưa lên GitHub

Đặt `RTM.md` trong `submissions/suy_tim_nhom27/docs/`, cạnh `SRS-v1.0.md`, `User-Stories-INVEST-BDD.md` và `Đặc tả usecase đầy đủ.md`. Các liên kết tương đối trong file sẽ dùng đúng các tên này. RTM dẫn tới tài liệu yêu cầu; tên bảng/endpoint trong danh mục ĐX chưa giả lập link tới DDL/OpenAPI không tồn tại.
