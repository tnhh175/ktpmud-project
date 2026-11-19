"""API skeleton for groups 1, 2 and 6. Synthetic RAM data only.

The PostgreSQL MVP schema is a separate design. This stub never claims to
persist records, parse hospital files, or enforce production security.
"""
from datetime import date, datetime, timezone
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Header, Body, Query
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, model_validator


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Error(Strict):
    code: str
    message: str


class Login(Strict):
    login_name: Literal["doctor_demo", "admin_demo"]
    password: str


class Token(Strict):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    mode: Literal["stub"] = "stub"


class User(Strict):
    id: int
    login_name: str
    roles: list[Literal["doctor", "admin"]]
    active: bool = True


class PatientIn(Strict):
    full_name: str = Field(min_length=1)
    birth_date: date | None = None
    birth_year: int | None = Field(default=None, ge=1850, le=2100)
    sex: str | None = None
    insurance_no: str | None = None

    @model_validator(mode="after")
    def one_birth_source(self):
        if self.birth_date is not None and self.birth_year is not None:
            raise ValueError("Chỉ nhập ngày sinh hoặc năm sinh")
        return self


class Patient(PatientIn):
    id: int
    patient_code: str


class EncounterIn(Strict):
    form_version_id: int
    occurred_at: datetime | None = None


class Encounter(EncounterIn):
    id: int
    patient_id: int
    encounter_code: str
    status: Literal["draft", "in_progress", "completed"] = "draft"


class FormField(Strict):
    id: int
    code: str
    label: str
    value_kind: Literal["text", "number", "date", "boolean", "choice"]
    unit: str | None = None
    required: bool = False
    options: list[str] = []


class FormVersion(Strict):
    id: int
    template_id: int
    version_no: int
    status: Literal["draft", "published", "retired"]
    fields: list[FormField]


class ObservationIn(Strict):
    value_status: Literal["known", "unknown", "not_applicable"]
    value_text: str | None = None
    value_number: float | None = None
    value_date: date | None = None
    value_boolean: bool | None = None
    value_code: str | None = None
    unit: str | None = None
    observed_at: datetime | None = None
    source_note: str | None = None

    @model_validator(mode="after")
    def check_value(self):
        values = [self.value_text, self.value_number, self.value_date, self.value_boolean, self.value_code]
        count = sum(value is not None for value in values)
        if count != (1 if self.value_status == "known" else 0):
            raise ValueError("Giá trị phải khớp trạng thái known/unknown/not_applicable")
        return self


class Observation(ObservationIn):
    encounter_id: int
    field_id: int
    event_key: str
    version_no: int


class MedicationIn(Strict):
    medication_name: str = Field(min_length=1)
    dose_number: float | None = Field(default=None, ge=0)
    dose_unit: str | None = None
    dose_text: str | None = None
    medication_status: Literal["current", "planned", "stopped"] | None = None


class Medication(MedicationIn):
    id: int
    encounter_id: int


class MappingProfileIn(Strict):
    name: str = Field(min_length=1)
    form_version_id: int
    rules: dict[str, int] = {}


class MappingProfile(MappingProfileIn):
    id: int
    version_no: int


class ImportPreview(Strict):
    id: int
    status: Literal["review"] = "review"
    mode: Literal["stub_unparsed"] = "stub_unparsed"
    message: str = "Khung API chưa đọc file; không có dữ liệu nào được áp dụng."
    items: list = []


class SlotIn(Strict):
    starts_at: datetime
    ends_at: datetime
    capacity: int = Field(gt=0)

    @model_validator(mode="after")
    def valid_times(self):
        if self.ends_at <= self.starts_at:
            raise ValueError("Giờ kết thúc phải sau giờ bắt đầu")
        return self


class Slot(SlotIn):
    id: int


class AppointmentIn(Strict):
    patient_id: int
    slot_id: int


class Appointment(AppointmentIn):
    id: int
    status: Literal["booked", "cancelled", "completed"] = "booked"


class AdminUserIn(Strict):
    login_name: str = Field(min_length=1)
    role: Literal["doctor", "admin"]


class IdentifierIn(Strict):
    issuer_scope: str
    identifier_type: str
    raw_value: str
    verification_status: Literal["pending", "verified", "rejected"] = "pending"


class EncounterStatusIn(Strict):
    status: Literal["draft", "in_progress", "completed"]


class ClinicalOrderIn(Strict):
    code: str
    display_name: str
    reason: str | None = None


class UserStatusIn(Strict):
    active: bool


class RoleGrantIn(Strict):
    user_id: int
    role_code: Literal["doctor", "admin"]


class CatalogIn(Strict):
    code: str
    label: str
    active: bool = True


class AppointmentStatusIn(Strict):
    status: Literal["cancelled", "completed"]


class AuditEvent(Strict):
    actor_id: int | None
    action: str
    target_type: str
    target_id: int | None
    occurred_at: datetime
    result: str


def create_app() -> FastAPI:
    app = FastAPI(title="Suy tim MVP API", version="0.1.0", description="Hợp đồng API MVP cho nhóm 1, 2, 6. Mã chạy hiện là stub dữ liệu giả trong RAM; không kết nối HIS hay PostgreSQL.", openapi_url="/openapi.json")
    app.state.data = {
        "users": {1: User(id=1, login_name="doctor_demo", roles=["doctor"]), 2: User(id=2, login_name="admin_demo", roles=["admin"])},
        "tokens": {}, "patients": {}, "encounters": {}, "observations": {}, "medications": {},
        "forms": {1: FormVersion(id=1, template_id=1, version_no=1, status="published", fields=[
            FormField(id=1, code="lvef", label="Phân suất tống máu thất trái", value_kind="number", unit="%"),
            FormField(id=2, code="potassium", label="Kali máu", value_kind="number", unit="mmol/L")])},
        "profiles": {}, "imports": {}, "slots": {}, "appointments": {}, "audit": [],
    }
    d = app.state.data

    @app.exception_handler(HTTPException)
    def http_error(request, exc):
        detail = exc.detail if isinstance(exc.detail, dict) else {"code": str(exc.status_code), "message": str(exc.detail)}
        return JSONResponse(status_code=exc.status_code, content=detail)

    @app.exception_handler(RequestValidationError)
    def validation_error(request, exc):
        return JSONResponse(status_code=422, content={"code": "422", "message": "Dữ liệu đầu vào không hợp lệ"})

    def problem(code: int, message: str):
        raise HTTPException(status_code=code, detail={"code": str(code), "message": message})

    def actor(authorization: str | None = Header(default=None)) -> User:
        token = authorization.removeprefix("Bearer ") if authorization else ""
        uid = d["tokens"].get(token)
        if not uid or not authorization.startswith("Bearer "):
            problem(401, "Cần đăng nhập bằng token thử nghiệm")
        user = d["users"][uid]
        if not user.active:
            problem(403, "Tài khoản đã khóa")
        return user

    def doctor(user: User = Depends(actor)) -> User:
        if "doctor" not in user.roles:
            problem(403, "Chỉ bác sĩ được thao tác")
        return user

    def admin(user: User = Depends(actor)) -> User:
        if "admin" not in user.roles:
            problem(403, "Chỉ quản trị viên được thao tác")
        return user

    def person(pid: int) -> Patient:
        if pid not in d["patients"]:
            problem(404, "Không tìm thấy bệnh nhân")
        return d["patients"][pid]

    def visit(eid: int) -> Encounter:
        if eid not in d["encounters"]:
            problem(404, "Không tìm thấy lượt khám")
        return d["encounters"][eid]

    def form(vid: int) -> FormVersion:
        if vid not in d["forms"]:
            problem(404, "Không tìm thấy phiên bản biểu mẫu")
        return d["forms"][vid]

    def next_id(collection: str) -> int:
        return max(d[collection], default=0) + 1

    @app.get("/health", tags=["System"])
    def health():
        return {"status": "ok", "mode": "stub"}

    @app.post("/api/v1/auth/token", response_model=Token, tags=["Auth"], responses={401: {"model": Error}})
    def login(body: Login):
        # Deterministic fixture credentials are deliberately unsuitable for deployment.
        if body.password != "demo-only":
            problem(401, "Sai thông tin đăng nhập thử nghiệm")
        uid = 1 if body.login_name == "doctor_demo" else 2
        token = f"local-stub-{uid}"
        d["tokens"][token] = uid
        return Token(access_token=token)

    @app.get("/api/v1/auth/me", response_model=User, tags=["Auth"])
    def me(user: User = Depends(actor)):
        return user

    @app.post("/api/v1/auth/logout", tags=["Auth"])
    def logout(authorization: str = Header(), user: User = Depends(actor)):
        d["tokens"].pop(authorization.removeprefix("Bearer "), None)
        return {"status": "logged_out"}

    @app.post("/api/v1/auth/recovery", tags=["Auth"], responses={501: {"model": Error}})
    def recovery(login_name: str = Query()):
        problem(501, "Khôi phục truy cập cần quy trình xác minh; stub chưa thực hiện")

    @app.get("/api/v1/patients", response_model=list[Patient], tags=["Patients"])
    def patients(q: str | None = None, user: User = Depends(actor)):
        return [p for p in d["patients"].values() if not q or q.lower() in p.full_name.lower() or q in p.patient_code]

    @app.post("/api/v1/patients", response_model=Patient, status_code=201, tags=["Patients"])
    def add_patient(body: PatientIn, user: User = Depends(doctor)):
        pid = next_id("patients")
        item = Patient(id=pid, patient_code=f"BN-{pid:05d}", **body.model_dump())
        d["patients"][pid] = item
        return item

    @app.get("/api/v1/patients/{patient_id}", response_model=Patient, tags=["Patients"])
    def get_patient(patient_id: int, user: User = Depends(actor)):
        return person(patient_id)

    @app.post("/api/v1/patients/{patient_id}/identifiers", tags=["Patients"], responses={501: {"model": Error}})
    def add_patient_identifier(patient_id: int, body: IdentifierIn, user: User = Depends(doctor)):
        person(patient_id)
        problem(501, "Liên kết định danh cần xác minh nguồn; stub chưa thực hiện")

    @app.patch("/api/v1/patients/{patient_id}", response_model=Patient, tags=["Patients"])
    def edit_patient(patient_id: int, body: PatientIn, user: User = Depends(doctor)):
        previous = person(patient_id)
        updated = Patient(id=previous.id, patient_code=previous.patient_code, **body.model_dump())
        d["patients"][patient_id] = updated
        return updated

    @app.get("/api/v1/patients/{patient_id}/encounters", response_model=list[Encounter], tags=["Encounters"])
    def encounters(patient_id: int, user: User = Depends(actor)):
        person(patient_id)
        return [e for e in d["encounters"].values() if e.patient_id == patient_id]

    @app.post("/api/v1/patients/{patient_id}/encounters", response_model=Encounter, status_code=201, tags=["Encounters"])
    def add_encounter(patient_id: int, body: EncounterIn, user: User = Depends(doctor)):
        person(patient_id)
        if form(body.form_version_id).status != "published":
            problem(409, "Chỉ dùng phiên bản biểu mẫu đã phát hành")
        eid = next_id("encounters")
        item = Encounter(id=eid, patient_id=patient_id, encounter_code=f"LK-{eid:05d}", **body.model_dump())
        d["encounters"][eid] = item
        return item

    @app.get("/api/v1/encounters/{encounter_id}", response_model=Encounter, tags=["Encounters"])
    def get_encounter(encounter_id: int, user: User = Depends(actor)):
        return visit(encounter_id)

    @app.patch("/api/v1/encounters/{encounter_id}/status", tags=["Encounters"], responses={501: {"model": Error}})
    def change_encounter_status(encounter_id: int, body: EncounterStatusIn, user: User = Depends(doctor)):
        visit(encounter_id)
        problem(501, "Hoàn tất lượt cần kiểm tra điều kiện nghiệp vụ và ghi audit")

    @app.post("/api/v1/encounters/{encounter_id}/identifiers", tags=["Encounters"], responses={501: {"model": Error}})
    def add_encounter_identifier(encounter_id: int, body: IdentifierIn, user: User = Depends(doctor)):
        visit(encounter_id)
        problem(501, "Liên kết mã lượt nguồn cần xác minh")

    @app.post("/api/v1/encounters/{encounter_id}/clinical-orders", tags=["Encounters"], responses={501: {"model": Error}})
    def add_clinical_order(encounter_id: int, body: ClinicalOrderIn, user: User = Depends(doctor)):
        visit(encounter_id)
        problem(501, "Chỉ định cận lâm sàng cần bổ sung thiết kế bảng riêng trước khi triển khai")

    @app.get("/api/v1/form-versions", response_model=list[FormVersion], tags=["Forms"])
    def forms(user: User = Depends(actor)):
        return list(d["forms"].values())

    @app.get("/api/v1/form-versions/{version_id}", response_model=FormVersion, tags=["Forms"])
    def get_form(version_id: int, user: User = Depends(actor)):
        return form(version_id)

    @app.post("/api/v1/form-versions", response_model=FormVersion, status_code=201, tags=["Forms"])
    def create_form(body: FormVersion, user: User = Depends(admin)):
        if body.status != "draft" or body.id in d["forms"]:
            problem(409, "Phiên bản mới phải là bản nháp với mã chưa dùng")
        if any(v.template_id == body.template_id and v.version_no == body.version_no for v in d["forms"].values()):
            problem(409, "Số phiên bản đã tồn tại")
        d["forms"][body.id] = body
        return body

    @app.put("/api/v1/form-versions/{version_id}", response_model=FormVersion, tags=["Forms"])
    def replace_form(version_id: int, body: FormVersion, user: User = Depends(admin)):
        current = form(version_id)
        if current.status != "draft" or any(e.form_version_id == version_id for e in d["encounters"].values()):
            problem(409, "Không sửa trực tiếp phiên bản đã dùng hoặc phát hành")
        if body.id != version_id or body.template_id != current.template_id or body.version_no != current.version_no or body.status != "draft":
            problem(409, "Không được đổi định danh hoặc trạng thái bằng PUT")
        d["forms"][version_id] = body
        return body

    @app.post("/api/v1/form-versions/{version_id}/publish", response_model=FormVersion, tags=["Forms"])
    def publish_form(version_id: int, user: User = Depends(admin)):
        item = form(version_id)
        if item.status != "draft":
            problem(409, "Chỉ phát hành bản nháp")
        published = item.model_copy(update={"status": "published"})
        d["forms"][version_id] = published
        return published

    @app.get("/api/v1/encounters/{encounter_id}/observations", response_model=list[Observation], tags=["Observations"])
    def observations(encounter_id: int, user: User = Depends(actor)):
        visit(encounter_id)
        return [v for (eid, _, _), v in d["observations"].items() if eid == encounter_id]

    @app.put("/api/v1/encounters/{encounter_id}/observations/{field_id}/{event_key}", response_model=Observation, tags=["Observations"])
    def save_observation(encounter_id: int, field_id: int, event_key: str, body: ObservationIn, user: User = Depends(doctor)):
        encounter = visit(encounter_id)
        field = next((f for f in form(encounter.form_version_id).fields if f.id == field_id), None)
        if field is None:
            problem(409, "Trường không thuộc phiên bản biểu mẫu của lượt khám")
        value_kind = {"value_text": "text", "value_number": "number", "value_date": "date", "value_boolean": "boolean", "value_code": "choice"}
        if body.value_status == "known" and any(getattr(body, attr) is not None and kind != field.value_kind for attr, kind in value_kind.items()):
            problem(422, "Loại giá trị không khớp trường biểu mẫu")
        if body.value_code is not None and body.value_code not in field.options:
            problem(422, "Lựa chọn không thuộc trường biểu mẫu")
        key = (encounter_id, field_id, event_key)
        old = d["observations"].get(key)
        item = Observation(encounter_id=encounter_id, field_id=field_id, event_key=event_key, version_no=old.version_no + 1 if old else 1, **body.model_dump())
        d["observations"][key] = item
        return item

    @app.get("/api/v1/encounters/{encounter_id}/medications", response_model=list[Medication], tags=["Medications"])
    def medications(encounter_id: int, user: User = Depends(actor)):
        visit(encounter_id)
        return [m for m in d["medications"].values() if m.encounter_id == encounter_id]

    @app.post("/api/v1/encounters/{encounter_id}/medications", response_model=Medication, status_code=201, tags=["Medications"])
    def add_medication(encounter_id: int, body: MedicationIn, user: User = Depends(doctor)):
        visit(encounter_id)
        if body.dose_number is not None and body.dose_unit is None:
            problem(422, "Liều số cần đơn vị")
        mid = next_id("medications")
        item = Medication(id=mid, encounter_id=encounter_id, **body.model_dump())
        d["medications"][mid] = item
        return item

    @app.get("/api/v1/mapping-profiles", response_model=list[MappingProfile], tags=["Imports"])
    def profiles(user: User = Depends(actor)):
        return list(d["profiles"].values())

    @app.post("/api/v1/mapping-profiles", response_model=MappingProfile, status_code=201, tags=["Imports"])
    def add_profile(body: MappingProfileIn, user: User = Depends(admin)):
        form(body.form_version_id)
        allowed = {f.id for f in form(body.form_version_id).fields}
        if not set(body.rules.values()) <= allowed:
            problem(409, "Quy tắc ánh xạ trỏ đến trường sai phiên bản")
        pid = next_id("profiles")
        item = MappingProfile(id=pid, version_no=1, **body.model_dump())
        d["profiles"][pid] = item
        return item

    @app.post("/api/v1/imports/preview", response_model=ImportPreview, status_code=201, tags=["Imports"])
    async def preview_import(source_name: str = Query(), mapping_profile_id: int = Query(),
                             patient_id: int = Query(), encounter_id: int = Query(),
                             file_name: str = Query(), file_bytes: bytes = Body(media_type="application/octet-stream", max_length=10_000_000),
                             user: User = Depends(doctor)):
        person(patient_id)
        encounter = visit(encounter_id)
        profile = d["profiles"].get(mapping_profile_id)
        if not profile:
            problem(404, "Không tìm thấy cấu hình ánh xạ")
        if encounter.patient_id != patient_id or encounter.form_version_id != profile.form_version_id:
            problem(409, "Hồ sơ, lượt khám và phiên bản ánh xạ không khớp")
        # The request body is accepted solely to exercise client upload wiring.
        # Do not parse, store, or log it until a real parser is built.
        del file_bytes, file_name, source_name
        bid = next_id("imports")
        item = ImportPreview(id=bid)
        d["imports"][bid] = item
        return item

    @app.get("/api/v1/imports/{batch_id}", response_model=ImportPreview, tags=["Imports"])
    def get_import(batch_id: int, user: User = Depends(actor)):
        if batch_id not in d["imports"]:
            problem(404, "Không tìm thấy lần nhập")
        return d["imports"][batch_id]

    @app.get("/api/v1/imports", response_model=list[ImportPreview], tags=["Imports"])
    def list_imports(user: User = Depends(actor)):
        return list(d["imports"].values())

    @app.post("/api/v1/imports/{batch_id}/retry", tags=["Imports"], responses={501: {"model": Error}})
    def retry_import(batch_id: int, user: User = Depends(doctor)):
        if batch_id not in d["imports"]:
            problem(404, "Không tìm thấy lần nhập")
        problem(501, "Xử lý lại chỉ có sau khi triển khai parser và đối chiếu")

    @app.post("/api/v1/imports/{batch_id}/apply", tags=["Imports"], responses={409: {"model": Error}})
    def apply_import(batch_id: int, user: User = Depends(doctor)):
        if batch_id not in d["imports"]:
            problem(404, "Không tìm thấy lần nhập")
        problem(409, "Stub chưa đọc và đối chiếu file; không thể áp dụng dữ liệu")

    @app.get("/api/v1/clinic-slots", response_model=list[Slot], tags=["Appointments"])
    def slots(user: User = Depends(actor)):
        return list(d["slots"].values())

    @app.post("/api/v1/clinic-slots", response_model=Slot, status_code=201, tags=["Appointments"])
    def add_slot(body: SlotIn, user: User = Depends(admin)):
        sid = next_id("slots")
        item = Slot(id=sid, **body.model_dump())
        d["slots"][sid] = item
        return item

    @app.get("/api/v1/appointments", response_model=list[Appointment], tags=["Appointments"])
    def appointments(patient_id: int | None = None, user: User = Depends(actor)):
        return [a for a in d["appointments"].values() if patient_id is None or a.patient_id == patient_id]

    @app.post("/api/v1/appointments", response_model=Appointment, status_code=201, tags=["Appointments"])
    def add_appointment(body: AppointmentIn, user: User = Depends(doctor)):
        person(body.patient_id)
        slot = d["slots"].get(body.slot_id)
        if slot is None:
            problem(404, "Không tìm thấy khung giờ")
        used = sum(a.slot_id == body.slot_id and a.status == "booked" for a in d["appointments"].values())
        if used >= slot.capacity:
            problem(409, "Khung giờ đã đủ sức chứa")
        aid = next_id("appointments")
        item = Appointment(id=aid, **body.model_dump())
        d["appointments"][aid] = item
        return item

    @app.patch("/api/v1/appointments/{appointment_id}", response_model=Appointment, tags=["Appointments"])
    def change_appointment(appointment_id: int, body: AppointmentStatusIn, user: User = Depends(doctor)):
        previous = d["appointments"].get(appointment_id)
        if previous is None:
            problem(404, "Không tìm thấy lịch hẹn")
        item = previous.model_copy(update={"status": body.status})
        d["appointments"][appointment_id] = item
        return item

    @app.get("/api/v1/admin/users", response_model=list[User], tags=["Administration"])
    def users(user: User = Depends(admin)):
        return list(d["users"].values())

    @app.post("/api/v1/admin/users", response_model=User, status_code=201, tags=["Administration"])
    def add_user(body: AdminUserIn, user: User = Depends(admin)):
        if any(u.login_name == body.login_name for u in d["users"].values()):
            problem(409, "Tên đăng nhập đã có")
        uid = next_id("users")
        item = User(id=uid, login_name=body.login_name, roles=[body.role])
        d["users"][uid] = item
        return item

    @app.patch("/api/v1/admin/users/{user_id}", response_model=User, tags=["Administration"])
    def change_user(user_id: int, body: UserStatusIn, user: User = Depends(admin)):
        previous = d["users"].get(user_id)
        if previous is None:
            problem(404, "Không tìm thấy tài khoản")
        item = previous.model_copy(update={"active": body.active})
        d["users"][user_id] = item
        return item

    @app.post("/api/v1/admin/role-grants", tags=["Administration"], responses={501: {"model": Error}})
    def grant_role(body: RoleGrantIn, user: User = Depends(admin)):
        problem(501, "Phân quyền theo phạm vi hồ sơ cần chính sách và audit thật")

    @app.get("/api/v1/admin/catalogs", tags=["Administration"], responses={501: {"model": Error}})
    def catalogs(user: User = Depends(admin)):
        problem(501, "Danh mục dùng chung chưa được nạp vào stub")

    @app.put("/api/v1/admin/catalogs/{code}", tags=["Administration"], responses={501: {"model": Error}})
    def update_catalog(code: str, body: CatalogIn, user: User = Depends(admin)):
        problem(501, "Danh mục dùng chung chưa được nạp vào stub")

    @app.get("/api/v1/admin/audit-events", response_model=list[AuditEvent], tags=["Administration"])
    def audit_events(user: User = Depends(admin)):
        return d["audit"]

    @app.post("/api/v1/admin/backups", tags=["Administration"], responses={501: {"model": Error}})
    def backup(user: User = Depends(admin)):
        problem(501, "Stub trong RAM không có dữ liệu bền vững để sao lưu")

    @app.post("/api/v1/admin/backups/{backup_id}/restore", tags=["Administration"], responses={501: {"model": Error}})
    def restore_backup(backup_id: int, user: User = Depends(admin)):
        problem(501, "Khôi phục phải thử ở môi trường riêng và đối chiếu dữ liệu")

    from .spec import contract
    app.openapi = lambda: contract(app)
    return app


app = create_app()
