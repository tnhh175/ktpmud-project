# Sửa responsive và gỡ tài liệu API public ngày 22/11/2026

## Phạm vi

Checkout `D:/1.TNHH/project/ktpmud-nightrun`, nhánh `codex/responsive-private-api-docs`, từ commit `c1862ab77a37de67306edc4a9cbff60a2a74394f`. Đã fetch và xác nhận commit gốc trùng `origin/demo/web`. Giữ nguyên `.claude/`, checkout nộp bài `ktpmud` và bản sao lưu worktree. Không tạo worktree mới. Bản sửa chỉ commit cục bộ, chưa push, merge hay deploy.

## Responsive

Đã xem ảnh người dùng gửi trước khi chẩn đoán. Chrome với mã gốc chưa tái hiện được chính xác cảnh sidebar che gần hết màn hình tại 320 px: breakpoint hiện có đã ẩn sidebar ở kích thước này. Không có bằng chứng để kết luận nguyên nhân của ảnh là cache hay phiên bản triển khai cụ thể.

Các lỗi xác minh được trên mã gốc:

- Ngay trên 768 px, sidebar 236 px và mục lục form vẫn dùng bố cục desktop. Tại 769 px, vùng chính chỉ còn 533 px, form bị chia tiếp thành hai cột rất chật.
- Nút Menu gọi `render()`, thay textarea bằng node mới và làm mất focus. Probe trên snapshot `c1862ab` xác nhận `sameNode=false`, `focus=false` sau programmatic click.
- Sau khi thu gọn sidebar desktop rồi chuyển sang mobile, selector collapsed áp dụng cả lên drawer, làm mất nhãn và thu nút xuống 44 px.

Bản sửa chuyển sang bố cục mobile tại 1024 px trở xuống, cho thanh đầu trang xuống dòng khi cần, giữ vùng mục lục cuộn riêng và bỏ `overflow-x: clip` toàn trang. Menu cập nhật DOM tại chỗ; Escape đóng menu và trả focus về nút mở. Khi vượt breakpoint, menu đóng và focus trong phần điều hướng chuyển sang nút đang hiển thị. Dữ liệu, node form và caret được giữ khi đổi kích thước. Key lưu trạng thái sidebar đã đồng bộ giữa đọc và ghi. URL phiên bản CSS/app.js được đổi để trình duyệt tải tài nguyên mới.

## Tài liệu API

Gỡ link API khỏi banner ứng dụng và trang kiến trúc. Static exporter bỏ trình xem API và không sao chép OpenAPI/schema ra artifact; trang kiến trúc vẫn được giữ. Test kiểm toàn bộ danh sách file đầu ra, cả build mới và build lại thư mục từng chứa API docs/schema.

Exporter resolve đường dẫn trước khi dọn đầu ra, chặn thư mục gốc, nguồn, metadata Git, symlink/junction và thư mục có dữ liệu không xác định. Thư mục build cũ chỉ được dọn khi nhận diện được bundle Suytim-CDSS bằng `.nojekyll`, config static và trang index. Reviewer tìm thấy lỗ hổng ở guard ban đầu; bản cuối đã chặn `src/` và `tests/` trước `rmtree`, kiểm bằng mock không xóa nguồn.

Backend MVP và Gateway, gồm mode `forms_only` đang dùng trong Docker, tắt route tài liệu mặc định. Đã kiểm `/docs`, `/redoc`, `/openapi.json`, `/api/openapi.json`, `/api/openapi.yaml` và alias `/api/v1/openapi.yaml`. Có thể bật bằng `enable_api_docs=True` hoặc `MVP_ENABLE_API_DOCS=1` khi chạy nội bộ; cấu hình này không có lớp xác thực bổ sung nên chỉ dùng trên loopback/mạng nội bộ. Hướng dẫn backend và launcher đã được đồng bộ.

Giữ nguyên `api/openapi.yaml` và `app.openapi()` làm hợp đồng phát triển/kiểm thử. Không đổi API nghiệp vụ, không giảm kiểm tra parity hai chiều 33 operation. Các assertion Swagger public cũ được thay bằng assertion mặc định không lộ tài liệu và kiểm tài liệu nội bộ khi bật cấu hình.

## Phân công thực tế

Trưởng nhóm đọc và áp dụng `agency-agents-orchestrator`, `agency-git-workflow-master`, `context-shears`, `viet-nhu-nguoi`; giữ tích hợp, môi trường QA và commit. Các agent sau được gọi thật bằng công cụ subagent, tối đa 4 agent hoạt động cùng lúc tính cả trưởng nhóm. Model/effort là cấu hình đã gửi khi gọi agent.

| Agent | Model/effort | Quyền sửa và skill |
|---|---|---|
| Frontend | `gpt-6.1-sol/high` | Ba file `web-mvp/app.js`, `styles.css`, `index.html`; frontend-developer, minimal-change-engineer, context-shears, viet-nhu-nguoi, ui-styling |
| API/build | `gpt-6-sol/high` | Backend, exporter, launcher, test Python và hướng dẫn API; api-platform-engineer, context-shears, viet-nhu-nguoi |
| QA | `gpt-6-sol/high` | Regression browser mới và bằng chứng; test-automation-engineer, context-shears, viet-nhu-nguoi |
| Reviewer độc lập | `gpt-6.1-sol/high` | Chỉ đọc source/test, viết probe và báo cáo ngoài commit; code-reviewer, context-shears, viet-nhu-nguoi |

Trưởng nhóm đã viết bản sửa ban đầu rồi bàn giao rõ từng file cho Frontend/API, không có hai agent cùng sửa một file. Reviewer tham gia sau khi Frontend bàn giao và kiểm lại phần cleanup sau khi API sửa finding.

## Kiểm thử

Python 3.12.14, Node 22.23.2, Chrome headless qua Playwright. Venv QA khớp `requirements-dev.txt`, `pip check` đạt. PostgreSQL synthetic riêng cổng 55432, đã xác minh đúng data directory `D:/1.TNHH/project/suytim-six-bugs-qa/pgdata`; các database test tạo từ template `suytim_tpl` có schema, seed và migration 005.

| Kiểm thử | Kết quả cuối |
|---|---|
| `pytest tests/test_mvp_e2e.py tests/test_mvp_delete_draft_contract.py tests/test_private_api_docs.py tests/test_forms_login_pages.py` | 33 pass, 0 fail, 0 skip |
| `node tests/web_mvp_responsive_regression.cjs` trên artifact static | 40 pass, 0 fail |
| Browser FastAPI/PostgreSQL thật, không mock HTTP | 4/4 viewport: đăng nhập, hồ sơ, form, menu, lưu, reload giữ dữ liệu và không tràn ngang |
| `node tests/web_mvp_six_bug_regression.cjs` | 27 pass, 0 fail |
| `node tests/web_mvp_numeric_input_regression.cjs` | Cả static/API mode đạt |
| `node tests/web_mvp_auth_regression.cjs` | 8 pass, 0 fail |
| `node tests/web_mvp_real_refresh_regression.cjs` | Đạt rotation, refresh đồng thời, lỗi mạng/401 và phản hồi muộn |
| Reviewer: test private docs | 19 pass |
| Reviewer: browser admin 320/390/768/1280 px | Ba màn hình admin, menu, modal, Tab/Escape đạt; không có page error |

Regression responsive kiểm 320/390/768/1280 px, thêm 769/820/1024 px; có reload hẹp và resize sau khi mở trang. Kiểm đăng nhập, danh sách, hồ sơ bệnh nhân, form, footer/nút lưu, modal, trạng thái dirty và guard chưa lưu. Kiểm bảng hoặc thẻ mobile theo breakpoint và cuộn trong vùng riêng. Sáu URL tài liệu API trên static artifact đều trả 404; `/docs/` kiến trúc vẫn trả 200.

Lượt Python đầu có 25 pass và 1 fail vì còn assertion cũ đòi `/docs` trả 200. Sau khi cập nhật assertion theo yêu cầu sản phẩm và bổ sung guard cleanup, lượt cuối đạt 33 pass. Hai cảnh báo deprecation từ dependency vẫn còn; không có test nào bị tính pass khi chưa chạy. `tests/test_forms_imports.py` chỉ đổi cách đọc hợp đồng nội bộ và được kiểm syntax; không chạy toàn bộ suite imports trong task này.

## Bằng chứng ngoài commit

Các đường dẫn dưới đây tính từ thư mục ứng dụng `submissions/suy_tim_nhom27`:

- Ảnh trước: `.context-shears/responsive-qa/before-*.png`; sau: `after-*.png`, `frontend-after-*.png`, `real-api-*.png`.
- Probe baseline: `.context-shears/responsive-qa/before-menu-docs.json`, xác nhận node/focus bị thay và API docs cũ trả 200. Snapshot baseline chỉ dùng QA, không thuộc artifact bàn giao.
- Kết quả responsive: `.context-shears/responsive-qa/responsive-results.json`; API thật: `real-api-metrics.json` trong cùng thư mục.
- Review độc lập: `.context-shears/responsive-qa/reviewer/INDEPENDENT_REVIEW.md`.
- Python cuối: `.context-shears/artifacts/command-20261122T111726.898092Z-8df221676319.log`.
- Browser responsive: `.context-shears/artifacts/command-20261122T111609.846722Z-57c929af6b9f.log`.
- Browser API thật: `.context-shears/artifacts/command-20261122T111402.729682Z-245030ff97ab.log`.
- 6 bug cũ: `.context-shears/artifacts/command-20261122T111136.972946Z-d87b6d5bc4d8.log`.
- Nhập số: `.context-shears/artifacts/command-20261122T111136.971518Z-c2ab397a66e7.log`.
- Auth: `.context-shears/artifacts/command-20261122T111222.521903Z-68e5e928d5c0.log`.
- Refresh thật: `.context-shears/artifacts/command-20261122T111213.120382Z-35524ddb09a9.log`.

Không còn finding chặn commit sau review. Chưa kiểm bản triển khai Internet hoặc thiết bị thật; chưa xác định phiên bản/cache tạo ra đúng ảnh lỗi ban đầu. Kiểm Tab/Escape trong task này không phải một cuộc audit WCAG đầy đủ.

Kiểm tra cuối đạt `node --check`, `py_compile`, OpenAPI validation trong test hợp đồng, build static và `git diff --check`. Artifact cuối tại `.context-shears/responsive-qa/site` có đúng 9 file, không có API docs/schema; `api/openapi.yaml` nguồn không đổi. Đã xóa database QA tạm, chỉ còn template `suytim_tpl`, không còn kết nối test. Server/browser harness đã dừng; cluster PostgreSQL QA đã dừng và `pg_ctl status` xác nhận không còn server chạy.
