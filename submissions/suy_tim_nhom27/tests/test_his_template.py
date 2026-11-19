"""Private-template extraction is verified only with invented source cells."""
import base64
from copy import copy
from io import BytesIO

from openpyxl import load_workbook
from openpyxl.styles import PatternFill
import pytest

from src.gateway.forms.his_template import HIS_HEADERS, configured_template, extract_two_cases
from test_his_auto_import import his_file, source_row


def test_exact_two_source_codes_keep_all_admissions_values_and_formats(tmp_path):
    first = source_row('QA-TEMPLATE-001', GioiTinh='G', CanNang=0, ThuocLa=False)
    second = source_row('QA-TEMPLATE-002', GioiTinh='T', CanNang=None, ThuocLa=None)
    repeat = source_row('QA-TEMPLATE-001', CanNang=68, MaICD_VaoKhoa='SYNTHETIC.01')
    excluded = source_row('QA-TEMPLATE-003', CanNang=99)
    payload = his_file([first, second, excluded, repeat])
    book = load_workbook(BytesIO(base64.b64decode(payload['content_base64'])))
    sheet = book['Sheet3']
    sheet['A2'].fill = PatternFill(fill_type='solid', fgColor='AACCFF')
    sheet['D2'].number_format = 'dd/mm/yyyy hh:mm'
    sheet.column_dimensions['D'].width = 24
    sheet.freeze_panes = 'B2'
    sheet.auto_filter.ref = sheet.dimensions
    book.create_sheet('UNRELATED_QA')
    source = tmp_path / 'synthetic-his-source.xlsx'
    book.save(source)
    expected = [tuple(cell.value for cell in sheet[row]) for row in (1, 2, 3, 5)]
    expected_style = copy(sheet['A2'].fill)
    book.close()
    original = source.read_bytes()
    output = load_workbook(BytesIO(extract_two_cases(source)), data_only=False)
    assert output.sheetnames == ['Sheet3']
    result = output['Sheet3']
    assert list(result.values) == expected
    assert tuple(cell.value for cell in result[1]) == HIS_HEADERS
    assert result.max_column == 42 and result.max_row == 4
    assert result['A2'].fill == expected_style
    assert result['D2'].number_format == 'dd/mm/yyyy hh:mm'
    assert result.column_dimensions['D'].width == 24
    assert result.freeze_panes == 'B2' and result.auto_filter.ref == 'A1:AP4'
    assert result['U2'].value == 0 and result['O2'].value is False
    assert result['U3'].value is None and result['O3'].value is None
    output.close()
    assert source.read_bytes() == original


@pytest.mark.parametrize('problem', ['one_code', 'wrong_header', 'wrong_sheet'])
def test_template_refuses_unverified_structure_or_fewer_than_two_cases(tmp_path, problem):
    payload = his_file([source_row('QA-ONE'), source_row('QA-ONE' if problem == 'one_code' else 'QA-TWO')])
    book = load_workbook(BytesIO(base64.b64decode(payload['content_base64'])))
    if problem == 'wrong_header':
        book['Sheet3']['AP1'] = 'Changed source header'
    elif problem == 'wrong_sheet':
        book['Sheet3'].title = 'WRONG_QA'
    path = tmp_path / 'invalid-synthetic.xlsx'
    book.save(path)
    book.close()
    with pytest.raises(ValueError):
        extract_two_cases(path)


def test_configured_template_refuses_missing_private_file(monkeypatch, tmp_path):
    monkeypatch.setenv('HF_HIS_TEMPLATE_FILE', str(tmp_path / 'not-present.xlsx'))
    with pytest.raises(FileNotFoundError):
        configured_template()
