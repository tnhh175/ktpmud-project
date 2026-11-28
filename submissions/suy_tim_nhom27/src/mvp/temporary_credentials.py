"""Encrypted, short-lived copies of admin-issued credentials."""
import os
from pathlib import Path
import secrets
from tempfile import NamedTemporaryFile

from .models import ProblemError


def storage_available(conn):
    return bool(conn.execute("SELECT to_regclass('public.temporary_credential') AS relation").fetchone()['relation'])


def credential_key():
    key = os.environ.get('MVP_CREDENTIAL_KEY')
    if key:
        if len(key) < 32:
            raise ProblemError(503, 'CREDENTIAL_KEY_INVALID', 'Thiếu cấu hình mật khẩu tạm',
                               'Khóa bảo vệ mật khẩu tạm phải có ít nhất 32 ký tự.')
        return key
    if os.environ.get('RAILWAY_ENVIRONMENT_ID') or os.environ.get('MVP_HOSTED') == '1':
        raise ProblemError(503, 'CREDENTIAL_KEY_REQUIRED', 'Thiếu cấu hình mật khẩu tạm',
                           'Máy chủ chưa có biến MVP_CREDENTIAL_KEY nên chưa cấp được mật khẩu tạm. Thêm biến rồi triển khai lại.')
    data = Path(os.environ.get('MVP_DATA_DIR') or
                Path(os.environ.get('LOCALAPPDATA', Path.home())) / 'hfcare' / 'data').expanduser()
    data.mkdir(parents=True, exist_ok=True, mode=0o700)
    path = data / 'credential.key'
    if not path.exists():
        with NamedTemporaryFile(dir=data, encoding='utf-8', mode='w', delete=False) as file:
            file.write(secrets.token_urlsafe(48))
        temporary = Path(file.name)
        try:
            os.link(temporary, path)
        except FileExistsError:
            pass
        finally:
            temporary.unlink()
    return path.read_text(encoding='utf-8').strip()


def store_credential(conn, user_id, code):
    if not storage_available(conn):
        raise ProblemError(503, 'CREDENTIAL_STORAGE_UNAVAILABLE', 'Chưa có kho mật khẩu tạm',
                           'Cần nâng cơ sở dữ liệu lên migration 013.')
    # Fail closed: without a usable key the new code could never be shown to the
    # admin, so the account would be locked out. Raising rolls the reset back.
    key = credential_key()
    conn.execute('''INSERT INTO temporary_credential(user_id, ciphertext, expires_at)
        VALUES (%s, public.pgp_sym_encrypt(%s, %s, 'cipher-algo=aes256'), now() + interval '24 hours')
        ON CONFLICT (user_id) DO UPDATE SET ciphertext=excluded.ciphertext, expires_at=excluded.expires_at''',
        (user_id, code, key))


def clear_expired(conn):
    if storage_available(conn):
        conn.execute('''UPDATE temporary_credential SET ciphertext=NULL
            WHERE ciphertext IS NOT NULL AND expires_at <= now()''')


def revoke_credential(conn, user_id):
    if storage_available(conn):
        conn.execute('DELETE FROM temporary_credential WHERE user_id=%s', (user_id,))
