# Ma trận truy vết yêu cầu (RTM) — Nhóm 27

**Đề tài:** Hệ thống quản lý bệnh nhân cao tuổi mắc suy tim  
**Phiên bản:** 0.1   
**Cơ sở:** 34 yêu cầu chức năng (FR) và 13 yêu cầu phi chức năng (NFR) nhóm đã chốt.

## 1. Mục đích và cách dùng

RTM giúp kiểm tra từng yêu cầu được liên kết với chức năng, dữ liệu và API nào. Bảng dùng đúng 5 cột:

**Mã yêu cầu → User Story → Use Case → Schema CSDL → API.**

- Mỗi FR/NFR có một dòng riêng trong file này. Nội dung đầy đủ và tiêu chí định lượng giữ theo bảng yêu cầu đã chốt trong báo cáo; khi đóng gói SRS, đồng bộ với `SRS_v1.0.md`.
- **User Story:** ghi mã/liên kết của User Story bao phủ yêu cầu. NFR có thể liên kết với tiêu chí chất lượng của User Stories chịu ảnh hưởng hoặc mục Backlog kỹ thuật tương ứng.
- **Use Case:** ghi mã/liên kết tới đặc tả Use Case liên quan. Nếu cần nhiều liên kết để bao phủ một yêu cầu, ghi rõ các mã tương ứng.
- **Schema CSDL:** ghi bảng, trường hoặc ràng buộc cụ thể đã đối chiếu với ERD, Data Dictionary và `schema.sql`.
- **API:** ghi phương thức HTTP và đường dẫn endpoint đã đối chiếu với OpenAPI và routing Gateway.
- “Chưa liên kết”/“Chưa đối chiếu” là phần chưa có tham chiếu đã được kiểm tra theo bộ yêu cầu mới. “Không áp dụng trực tiếp” phải kèm lý do; không ép NFR về trình duyệt hoặc HTTPS vào một bảng CSDL riêng.
- Trạng thái chung nằm ở mục 4. Các cột khác sẽ bổ sung khi nhóm cần.

**Bản thu gọn trong report:** chỉ gộp các FR có cùng toàn bộ chuỗi User Story, Use Case, Schema CSDL và API; liệt kê đầy đủ các mã FR trong ô đầu. Nếu chỉ chung module, chung một Use Case hoặc chung một bảng CSDL nhưng các phần còn lại khác, vẫn giữ dòng riêng. Không dùng các ô “Chưa liên kết”/“Chưa đối chiếu” làm căn cứ gộp. Bản thu gọn dẫn tới file RTM đầy đủ trên GitHub.

## 2. Truy vết yêu cầu chức năng (FR)

| Mã yêu cầu | User Story | Use Case | Schema CSDL | API |
| --- | --- | --- | --- | --- |
| FR-01 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-02 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-03 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-04 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-05 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-06 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-07 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-08 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-09 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-10 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-11 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-12 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-13 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-14 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-15 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-16 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-17 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-18 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-19 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-20 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-21 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-22 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-23 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-24 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-25 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-26 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-27 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-28 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-29 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-30 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-31 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-32 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-33 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| FR-34 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |

## 3. Truy vết yêu cầu phi chức năng (NFR)

NFR liên kết với các luồng chịu ảnh hưởng. Không tạo Use Case riêng chỉ để điền đủ bảng.

| Mã yêu cầu | User Story | Use Case | Schema CSDL | API |
| --- | --- | --- | --- | --- |
| NFR-01 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| NFR-02 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| NFR-03 | Chưa liên kết | Chưa liên kết | Không áp dụng trực tiếp — HTTPS thuộc cấu hình truyền dữ liệu. | Chưa đối chiếu — toàn bộ giao tiếp HTTPS khi triển khai qua mạng. |
| NFR-04 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| NFR-05 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| NFR-06 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| NFR-07 | Chưa liên kết | Chưa liên kết | Không áp dụng trực tiếp — giới hạn thời gian và thông báo quá hạn thuộc xử lý API/giao diện. | Chưa đối chiếu |
| NFR-08 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| NFR-09 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| NFR-10 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| NFR-11 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Không áp dụng trực tiếp — kiểm tra sao lưu/phục hồi ở CSDL và vận hành. |
| NFR-12 | Chưa liên kết | Chưa liên kết | Chưa đối chiếu | Chưa đối chiếu |
| NFR-13 | Chưa liên kết | Chưa liên kết | Không áp dụng trực tiếp — tiêu chí trình duyệt và bố cục giao diện. | Không áp dụng trực tiếp — kiểm tra các luồng trên giao diện web. |

## 4. Trạng thái hiện tại của RTM

- **Đã liệt kê:** 34/34 FR và 13/13 NFR; mỗi yêu cầu có một dòng riêng.
- **Đã thống nhất cấu trúc:** 5 cột Mã yêu cầu → User Story → Use Case → Schema CSDL → API.
- **Chuỗi liên kết đã đối chiếu hoàn chỉnh:** 0/47 được ghi nhận trong bản này. Các mã User Story, Use Case, schema và API chưa được đối chiếu theo bộ yêu cầu mới vẫn ghi rõ trạng thái còn thiếu.
- **Bản report thu gọn:** chưa xác định nhóm FR có cùng chuỗi liên kết để gộp; các ô chưa liên kết không được coi là chuỗi đã thống nhất.
- **Độ phủ truy vết tuần 3:** chưa đạt 100%. Chỉ tính FR có liên kết hợp lệ với Use Case và schema tương ứng; trường hợp không áp dụng phải có lý do đã được review. Có liên kết không đồng nghĩa đã triển khai hoặc kiểm thử đạt.

Các số liệu trên phản ánh liên kết được ghi nhận theo bộ 34 FR/13 NFR mới trong RTM này, không khẳng định tài liệu hoặc mã nguồn cũ chưa tồn tại.
