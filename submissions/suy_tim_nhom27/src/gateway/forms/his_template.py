"""The user-provided HIS layout and a private, exact two-case workbook excerpt."""
from io import BytesIO
import os
from pathlib import Path

from openpyxl import load_workbook


HIS_HEADERS = (
    'MaNghienCuu', 'GioiTinh', 'NamSinh', 'NgayVaoVien', 'NgayRaVien', 'KhoaRa',
    'MaICD_VaoKhoa', 'TenICD_VaoKhoa', 'DanhSachMaICD_Phu', 'TienSuBanThan', 'DiUng',
    'MaTuy', 'NgayMaTuy', 'RuouBia', 'ThuocLa', 'ThuocLao', 'TienSuKhac', 'Mach',
    'NhipTho', 'NhietDo', 'CanNang', 'HuyetApCao', 'HuyetApThap', 'ChieuCao', 'BMI',
    'NTproBNP_KetQua', 'NTproBNP_DonVi', 'NTproBNP_Ngay', 'Troponin_TenDichVu',
    'Troponin_KetQua', 'Troponin_DonVi', 'Troponin_Ngay', 'Creatinin_KetQua',
    'Creatinin_DonVi', 'Creatinin_Ngay', 'Natri_KetQua', 'Natri_DonVi', 'Kali_KetQua',
    'Kali_DonVi', 'Clo_KetQua', 'Clo_DonVi', 'DienGiai_Ngay',
)


def extract_two_cases(source: Path) -> bytes:
    """Keep the first two research codes and every source row belonging to them."""
    book = load_workbook(source, data_only=False)
    try:
        if 'Sheet3' not in book.sheetnames:
            raise ValueError('File mẫu cần có sheet Sheet3 theo cấu trúc HIS đã cung cấp.')
        sheet = book['Sheet3']
        headers = tuple(cell.value for cell in sheet[1])
        if headers != HIS_HEADERS:
            raise ValueError('File mẫu không khớp 42 cột HIS đã cung cấp.')
        codes = []
        for row in sheet.iter_rows(min_row=2, values_only=True):
            code = row[0]
            if code is not None and code not in codes:
                codes.append(code)
                if len(codes) == 2:
                    break
        if len(codes) != 2:
            raise ValueError('File nguồn chưa có đủ hai mã ca để trích mẫu.')
        for row in range(sheet.max_row, 1, -1):
            if sheet.cell(row, 1).value not in codes:
                sheet.delete_rows(row)
        # The supplied source has one sheet. Keep that layout and its cell styles.
        for other in list(book):
            if other is not sheet:
                book.remove(other)
        if sheet.auto_filter.ref:
            sheet.auto_filter.ref = sheet.dimensions
        output = BytesIO()
        book.save(output)
        return output.getvalue()
    finally:
        book.close()


def configured_template() -> bytes:
    repository = Path(__file__).resolve().parents[5]
    source = Path(os.environ.get('HF_HIS_TEMPLATE_FILE',
                                 repository / 'local-data/his-template-2-cases.xlsx'))
    if not source.is_file():
        raise FileNotFoundError('File mẫu HIS chưa được cấu hình trên máy chủ.')
    return extract_two_cases(source)
