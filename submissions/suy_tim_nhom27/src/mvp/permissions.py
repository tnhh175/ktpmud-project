"""Permission catalog shared by endpoint guards and the admin editor."""
from .models import ProblemError

ROLES = ('admin', 'doctor', 'nurse')
# Vietnamese label, defaults, and any role constraints imposed by the workflow.
CATALOG = {
    'accounts.manage': ('Quản lý tài khoản', ('admin',), ('admin',)),
    'permissions.manage': ('Quản lý phân quyền', ('admin',), ('admin',)),
    'credentials.reveal': ('Xem lại mật khẩu tạm', ('admin',), ('admin',)),
    'forms.manage': ('Quản lý biểu mẫu', ('admin',), ('admin',)),
    'audit.read': ('Xem nhật ký', ('admin',), ('admin',)),
    'records.manage': ('Quản lý trạng thái hồ sơ', ('admin',), ('admin',)),
    'care.manage': ('Phân công chăm sóc', ('admin',), ('admin',)),
    'patients.read': ('Xem hồ sơ bệnh nhân', ('doctor', 'nurse'), ('doctor', 'nurse')),
    'patients.create': ('Tạo bệnh nhân', ('doctor', 'nurse'), ('doctor', 'nurse')),
    'patients.update': ('Sửa hành chính bệnh nhân', ('doctor', 'nurse'), ('doctor', 'nurse')),
    'records.requests.read': ('Xem yêu cầu về hồ sơ', ('doctor', 'nurse'), ('doctor', 'nurse')),
    'records.requests.write': ('Gửi và hủy yêu cầu về hồ sơ', ('nurse',), ('nurse',)),
    'visits.create': ('Tạo lượt khám', ('nurse',), ('nurse',)),
    'visits.mine': ('Xem lượt khám đã nhận', ('doctor',), ('doctor',)),
    'visits.intake_list': ('Xem lượt đã tiếp nhận', ('nurse',), ('nurse',)),
    'visits.read': ('Xem lượt khám và biểu mẫu', ('doctor', 'nurse'), ('doctor', 'nurse')),
    'visits.intake': ('Nhập hành chính lượt khám và sinh hiệu', ('nurse',), ('nurse',)),
    'visits.clinical': ('Nhập lâm sàng, sinh hiệu và cận lâm sàng', ('doctor',), ('doctor',)),
    'visits.submit': ('Gửi và rút lượt khỏi hàng chờ', ('nurse',), ('nurse',)),
    'queue.read': ('Xem hàng chờ lượt khám', ('doctor',), ('doctor', 'nurse')),
    'visits.claim': ('Nhận lượt khám', ('doctor',), ('doctor',)),
    'visits.review': ('Xem lại lượt khám', ('doctor',), ('doctor',)),
    'visits.confirm': ('Xác nhận lượt khám', ('doctor',), ('doctor',)),
    'visits.revise': ('Tạo bản sửa lượt khám', ('doctor',), ('doctor',)),
    'visits.ai_export': ('Xem dữ liệu đầu vào AI', ('doctor',), ('doctor',)),
    'workflow.read': ('Xem kết quả và lịch sử module AI', ('doctor',), ('doctor',)),
    'workflow.edit': ('Cập nhật đầu vào module AI', ('doctor',), ('doctor',)),
    'workflow.run': ('Chạy module AI', ('doctor',), ('doctor',)),
    'workflow.decide': ('Chốt module và hoàn tất luồng AI', ('doctor',), ('doctor',)),
}
PROTECTED = frozenset({'accounts.manage', 'permissions.manage'})


def permission_available(conn):
    return bool(conn.execute("SELECT to_regclass('public.role_permission') AS relation").fetchone()['relation'])


def is_granted(conn, role, permission):
    _, defaults, eligible = CATALOG[permission]
    if role not in eligible:
        return False
    # Older isolated installations can continue to use the original role defaults.
    if not permission_available(conn):
        return role in defaults
    row = conn.execute(
        'SELECT granted FROM role_permission WHERE role=%s AND permission_code=%s',
        (role, permission),
    ).fetchone()
    return bool(row and row['granted'])


def require_grant(conn, role, permission):
    if not is_granted(conn, role, permission):
        raise ProblemError(403, 'RBAC_ROLE_FORBIDDEN', 'Không đủ quyền truy cập',
                           f'Tài khoản hiện tại thiếu quyền {CATALOG[permission][0]}.')
