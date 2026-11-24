"""Pydantic schemas and RFC 9457 ProblemDetails helpers matching api/openapi.yaml."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator


UserRole = Literal["doctor", "admin"]
VisitStatus = Literal["draft", "confirmed"]
ValueState = Literal["answered", "unknown"]
FormVersionStatus = Literal["draft", "published", "retired"]
FieldScopeStatus = Literal["mvp", "can_xac_nhan"]
FieldDataType = Literal[
    "number", "integer", "text", "boolean", "date", "single_choice", "multi_choice"
]
SectionCode = Literal[
    "hanh_chinh",
    "trieu_chung_dien_bien",
    "sinh_ton_kham",
    "benh_su_dong_mac",
    "thuoc_di_ung",
    "can_lam_sang",
    "lao_khoa",
    "ghi_chu",
]
ReadinessTier = Literal["patient_created", "draft_saved", "confirmed", "ai_ready"]
BpPosition = Literal["supine", "sitting", "standing"]
AuditAction = Literal[
    "login",
    "logout",
    "login_failed",
    "user_create",
    "user_update",
    "form_version_create",
    "form_version_update",
    "form_version_publish",
    "patient_create",
    "visit_confirm",
    "ai_input_export",
    "care_assignment_add",
    "care_assignment_revoke",
]
SexType = Literal["male", "female", "unknown"]
VisitType = Literal["outpatient_new", "follow_up", "acute_inpatient"]
AiModuleCode = Literal["ai_diagnosis", "ai_lab_test", "ai_treatment", "ai_medsafety"]


def _empty_str_to_none(v: Any) -> Any:
    if isinstance(v, str) and v.strip() == "":
        return None
    return v


class FieldValidationErrorItem(BaseModel):
    fieldCode: str
    sectionCode: SectionCode | None = None
    message: str
    rejectedValue: Any = None


class ProblemDetailsModel(BaseModel):
    type: str
    title: str
    status: int
    detail: str
    instance: str | None = None
    code: str | None = None
    correlationId: str | None = None
    currentRowVersion: int | None = None
    errors: list[FieldValidationErrorItem] = Field(default_factory=list)
    quality: dict[str, Any] | None = None


class ProblemError(Exception):
    """Domain/HTTP error rendered as RFC 9457 application/problem+json."""

    def __init__(
        self,
        status: int,
        code: str,
        title: str,
        detail: str,
        *,
        type_slug: str | None = None,
        current_row_version: int | None = None,
        errors: list[dict[str, Any] | FieldValidationErrorItem] | None = None,
    ) -> None:
        super().__init__(detail)
        self.status = status
        self.code = code
        self.title = title
        self.detail = detail
        slug = type_slug or code.lower().replace("_", "-")
        self.type_uri = f"https://errors.ktpmud.nhom27.local/{slug}"
        self.current_row_version = current_row_version
        self.errors: list[dict[str, Any]] = [
            e.model_dump() if isinstance(e, BaseModel) else dict(e)
            for e in (errors or [])
        ]


def problem_response(
    *,
    status: int,
    code: str,
    title: str,
    detail: str,
    instance: str | None = None,
    correlation_id: str | None = None,
    type_uri: str | None = None,
    current_row_version: int | None = None,
    errors: list[dict[str, Any]] | None = None,
    headers: dict[str, str] | None = None,
    quality: dict[str, Any] | None = None,
) -> JSONResponse:
    slug = code.lower().replace("_", "-")
    payload: dict[str, Any] = {
        "type": type_uri or f"https://errors.ktpmud.nhom27.local/{slug}",
        "title": title,
        "status": status,
        "detail": detail,
        "instance": instance,
        "code": code,
        "correlationId": correlation_id,
        "errors": errors or [],
    }
    if quality is not None:
        payload["quality"] = quality
    if current_row_version is not None:
        payload["currentRowVersion"] = current_row_version
    return JSONResponse(
        status_code=status,
        content=payload,
        media_type="application/problem+json",
        headers=headers,
    )


class PaginationMeta(BaseModel):
    page: int
    pageSize: int
    totalItems: int
    totalPages: int


# ---------------------------------------------------------------------------
# Auth & User Schemas (M1, M6)
# ---------------------------------------------------------------------------
class AppUser(BaseModel):
    id: UUID
    username: str
    fullName: str
    role: UserRole
    isActive: bool
    lastLoginAt: datetime | None = None
    rowVersion: int
    createdAt: datetime
    updatedAt: datetime


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currentPassword: str = Field(min_length=1, max_length=128)
    newPassword: str = Field(min_length=8, max_length=128)


class RefreshTokenRequest(BaseModel):
    refreshToken: str = Field(min_length=16)


class LogoutRequest(BaseModel):
    refreshToken: str | None = None


class AuthTokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: Literal["Bearer"] = "Bearer"
    expiresIn: int = 900
    user: AppUser


class UserListResponse(BaseModel):
    items: list[AppUser]
    pagination: PaginationMeta


class CreateUserRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9._-]+$")
    fullName: str = Field(min_length=1, max_length=120)
    role: UserRole
    isActive: bool = True
    reason: str = Field(min_length=3, max_length=300)


class CreateUserResponse(BaseModel):
    user: AppUser
    oneTimeSetupCode: str
    setupExpiresAt: datetime


class UpdateUserRequest(BaseModel):
    rowVersion: int | None = Field(default=None, ge=1)
    fullName: str | None = Field(default=None, min_length=1, max_length=120)
    role: UserRole | None = None
    isActive: bool | None = None
    resetPassword: bool = False
    reason: str = Field(min_length=3, max_length=300)


class UpdateUserResponse(BaseModel):
    user: AppUser
    oneTimeSetupCode: str | None = None


class PermissionPreviewRequest(BaseModel):
    role: UserRole
    targetUserId: UUID | None = None


class PermissionItem(BaseModel):
    code: str
    labelVi: str
    category: Literal["clinical", "administration", "audit"]


class PermissionPreviewResponse(BaseModel):
    role: UserRole
    clinicalDataAccessAllowed: bool
    separationNoticeVi: str
    grantedPermissions: list[PermissionItem]
    deniedPermissions: list[PermissionItem]


# ---------------------------------------------------------------------------
# Patient Schemas (M2, M3)
# ---------------------------------------------------------------------------
class CareAccess(BaseModel):
    assignmentId: UUID
    assignedAt: datetime
    assignedBy: UUID


class Patient(BaseModel):
    updatedBy: UUID
    updatedByName: str | None = None
    access: CareAccess | None = None
    id: UUID
    patientCode: str
    externalPatientCode: str | None = None
    fullName: str
    sex: SexType
    birthDate: date | None = None
    birthYear: int | None = None
    declaredAge: int | None = None
    rowVersion: int
    createdBy: UUID
    createdAt: datetime
    updatedAt: datetime


class CreatePatientRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    fullName: str = Field(min_length=2, max_length=120)
    sex: SexType
    birthDate: date | None = None
    birthYear: int | None = Field(default=None, ge=1900, le=2100)
    declaredAge: int | None = Field(default=None, ge=0, le=120)
    externalPatientCode: str | None = Field(default=None, max_length=64)

    @field_validator("birthDate", "externalPatientCode", mode="before")
    @classmethod
    def _clean_empty(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class UpdatePatientRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    rowVersion: int | None = Field(default=None, ge=1)
    fullName: str | None = Field(default=None, min_length=2, max_length=120)
    sex: SexType | None = None
    birthDate: date | None = None
    birthYear: int | None = Field(default=None, ge=1900, le=2100)
    declaredAge: int | None = Field(default=None, ge=0, le=120)
    externalPatientCode: str | None = Field(default=None, max_length=64)

    @field_validator("birthDate", "externalPatientCode", mode="before")
    @classmethod
    def _clean_empty(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class PatientListItem(BaseModel):
    patient: Patient
    visitCount: int
    latestVisitId: UUID | None = None
    latestVisitCode: str | None = None
    latestVisitDate: datetime | None = None
    latestVisitStatus: Literal["draft", "confirmed", "none"]


class PatientListResponse(BaseModel):
    items: list[PatientListItem]
    pagination: PaginationMeta


# ---------------------------------------------------------------------------
# Form Metadata Schemas (M4, M7)
# ---------------------------------------------------------------------------
class FieldOption(BaseModel):
    id: UUID
    fieldDefinitionId: UUID
    optionCode: str
    labelVi: str
    displayOrder: int
    isActive: bool


class FieldAiModule(BaseModel):
    fieldDefinitionId: UUID
    aiModuleCode: AiModuleCode
    isRequired: bool
    sourceSttRefs: str | None = None


class FieldDefinition(BaseModel):
    id: UUID
    code: str
    labelVi: str
    sectionCode: SectionCode
    dataType: FieldDataType
    canonicalUnit: str | None = None
    scopeStatus: FieldScopeStatus
    storageLevel: str
    isCalculated: bool
    system: bool = False
    computed: bool = False
    locked: bool = False
    repeatGroup: str | None = None
    memberPath: str | None = None
    minValue: float | None = None
    maxValue: float | None = None
    validationRule: dict[str, Any] | None = None
    helpText: str | None = None
    sourceRef: str
    createdAt: datetime
    updatedAt: datetime
    options: list[FieldOption] = Field(default_factory=list)
    aiModules: list[FieldAiModule] = Field(default_factory=list)


class FieldDefinitionListResponse(BaseModel):
    items: list[FieldDefinition]
    total: int


class FormTemplate(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None = None
    isActive: bool
    createdAt: datetime


class FormTemplateListResponse(BaseModel):
    items: list[FormTemplate]


class FormVersion(BaseModel):
    id: UUID
    formTemplateId: UUID
    versionNo: int
    versionLabel: str
    status: FormVersionStatus
    basedOnVersionId: UUID | None = None
    changeNote: str | None = None
    createdBy: UUID
    createdAt: datetime
    publishedAt: datetime | None = None
    publishedBy: UUID | None = None
    rowVersion: int
    visitCount: int = 0


class FormVersionListResponse(BaseModel):
    items: list[FormVersion]


class FormField(BaseModel):
    id: UUID | None = None
    formVersionId: UUID | None = None
    formSectionId: UUID | None = None
    fieldDefinitionId: UUID
    fieldCode: str | None = None
    displayOrder: int = Field(ge=1)
    requiredForConfirm: bool = False
    isVisible: bool = True
    isReadonly: bool = False
    customLabelVi: str | None = None
    customHelpText: str | None = None

    @field_validator("customLabelVi", "customHelpText", mode="before")
    @classmethod
    def _clean_empty(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class FormSection(BaseModel):
    id: UUID | None = None
    formVersionId: UUID | None = None
    sectionCode: SectionCode
    titleVi: str = Field(min_length=1, max_length=160)
    description: str | None = None
    displayOrder: int = Field(ge=1, le=8)
    fields: list[FormField] = Field(default_factory=list)


class FormVersionDetailResponse(BaseModel):
    formVersion: FormVersion
    sections: list[FormSection]
    fieldDefinitions: list[FieldDefinition]


class CreateFormVersionDraftRequest(BaseModel):
    basedOnVersionId: UUID
    changeNote: str | None = Field(default=None, max_length=500)


class UpdateFormVersionRequest(BaseModel):
    rowVersion: int | None = Field(default=None, ge=1)
    changeNote: str | None = Field(default=None, max_length=500)
    sections: list[FormSection]


class FormVersionPreviewResponse(BaseModel):
    isPreviewOnly: Literal[True] = True
    previewBannerVi: str
    formVersion: FormVersion
    sections: list[FormSection]
    fieldDefinitions: list[FieldDefinition]


class FormFieldDiffItem(BaseModel):
    changeType: Literal["added", "modified", "removed"]
    fieldCode: str
    labelVi: str
    sectionCode: SectionCode
    previousAttributeSummary: str | None = None
    currentAttributeSummary: str | None = None


class FormVersionDiffResponse(BaseModel):
    targetVersionId: UUID
    baseVersionId: UUID
    hasChanges: bool
    addedFields: list[FormFieldDiffItem]
    modifiedFields: list[FormFieldDiffItem]
    removedFields: list[FormFieldDiffItem]


class PublishFormVersionRequest(BaseModel):
    rowVersion: int | None = Field(default=None, ge=1)
    changeNote: str | None = Field(default=None, max_length=500)


# ---------------------------------------------------------------------------
# Visit, Clinical Data, Review, Revision & AiInputPayload (M3, M4, M5)
# ---------------------------------------------------------------------------
class Visit(BaseModel):
    performedBy: UUID
    performedByName: str | None = None
    updatedBy: UUID
    updatedByName: str | None = None
    id: UUID
    visitCode: str
    externalVisitCode: str | None = None
    patientId: UUID
    formVersionId: UUID
    formVersionLabel: str | None = None
    visitDate: datetime
    visitType: VisitType = "outpatient_new"
    chiefComplaint: str | None = None
    clinicalNote: str | None = None
    infoSource: str | None = None
    medicationListState: Literal["known", "none", "unknown"] = "unknown"
    allergyListState: Literal["known", "none", "unknown"] = "unknown"
    diagnosisListState: Literal["known", "none", "unknown"] = "unknown"
    status: VisitStatus
    currentRevisionNo: int
    createdBy: UUID
    createdAt: datetime
    updatedAt: datetime
    confirmedAt: datetime | None = None
    confirmedBy: UUID | None = None
    confirmNote: str | None = None
    rowVersion: int


class VisitListResponse(BaseModel):
    items: list[Visit]
    pagination: PaginationMeta


class CreateVisitRequest(BaseModel):
    visitDate: datetime
    visitType: VisitType = "outpatient_new"
    chiefComplaint: str | None = Field(default=None, max_length=500)
    externalVisitCode: str | None = Field(default=None, max_length=64)

    @field_validator("chiefComplaint", "externalVisitCode", mode="before")
    @classmethod
    def _clean_empty(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class VisitValueOption(BaseModel):
    visitId: UUID | None = None
    fieldDefinitionId: UUID | None = None
    fieldOptionId: UUID


class VisitValueInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    visitId: UUID | None = None
    fieldDefinitionId: UUID | None = None
    fieldCode: str | None = None
    valueState: str
    valueNum: float | int | None = None
    valueText: str | None = None
    valueBool: bool | None = None
    valueDate: str | None = None
    fieldOptionId: UUID | None = None
    selectedOptions: list[VisitValueOption] = Field(default_factory=list)
    unit: str | None = None


class VisitValueOut(BaseModel):
    visitId: UUID
    fieldDefinitionId: UUID
    fieldCode: str
    valueState: ValueState
    valueNum: float | int | None = None
    valueText: str | None = None
    valueBool: bool | None = None
    valueDate: date | None = None
    fieldOptionId: UUID | None = None
    selectedOptions: list[VisitValueOption] = Field(default_factory=list)
    unit: str | None = None
    updatedAt: datetime


class OrthostaticBpInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID | None = None
    visitId: UUID | None = None
    position: str
    minuteAfter: int | float | None = None
    systolic: int | float | None = None
    diastolic: int | float | None = None
    heartRate: int | float | None = None
    measuredAt: datetime | str | None = None
    note: str | None = None

    @field_validator("note", "measuredAt", mode="before")
    @classmethod
    def _clean_empty(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class OrthostaticBpMeasurement(BaseModel):
    id: UUID
    visitId: UUID
    position: BpPosition
    minuteAfter: int | None = None
    systolic: int
    diastolic: int
    heartRate: int | None = None
    measuredAt: datetime
    note: str | None = None
    createdAt: datetime


class VisitMedicationInput(BaseModel):
    atcCode: str | None = Field(default=None, pattern=r"^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$")
    model_config = ConfigDict(extra="ignore")

    id: UUID | None = None
    visitId: UUID | None = None
    medicationGroup: str = "prescribed"
    drugName: str = ""
    activeIngredient: str | None = None
    strength: str | None = None
    dose: float | int | None = None
    unit: str | None = None
    frequency: str | None = None
    route: str | None = None
    status: str = "active"
    startedAt: date | str | None = None
    note: str | None = None

    @field_validator(
        "activeIngredient", "strength", "unit", "frequency", "route", "startedAt", "note", mode="before"
    )
    @classmethod
    def _clean_empty(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class VisitMedication(BaseModel):
    atcCode: str | None = Field(default=None, pattern=r"^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$")
    id: UUID
    visitId: UUID
    medicationGroup: Literal["prescribed", "otc_supplement_tcm"]
    drugName: str
    activeIngredient: str | None = None
    strength: str | None = None
    dose: float | None = None
    unit: str | None = None
    frequency: str | None = None
    route: Literal["oral", "iv", "subcutaneous", "inhaled", "topical", "other"] | None = None
    status: Literal["active", "stopped", "proposed"]
    startedAt: date | None = None
    note: str | None = None
    createdAt: datetime


class VisitAllergyInput(BaseModel):
    atcCode: str | None = Field(default=None, pattern=r"^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$")
    model_config = ConfigDict(extra="ignore")

    id: UUID | None = None
    visitId: UUID | None = None
    kind: str = "allergy"
    agentCategory: str = "therapeutic_drug"
    allergen: str = ""
    reaction: str | None = None
    severity: str = "unknown"
    recordedAt: datetime | str | None = None
    note: str | None = None

    @field_validator("reaction", "recordedAt", "note", mode="before")
    @classmethod
    def _clean_empty(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class VisitAllergy(BaseModel):
    atcCode: str | None = Field(default=None, pattern=r"^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$")
    id: UUID
    visitId: UUID
    kind: Literal["allergy", "adr", "intolerance"]
    agentCategory: Literal["therapeutic_drug", "contrast_media", "other"]
    allergen: str
    reaction: str | None = None
    severity: Literal["mild", "moderate", "severe", "unknown"]
    recordedAt: datetime | None = None
    note: str | None = None
    createdAt: datetime


class VisitLabResultInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: UUID | None = None
    visitId: UUID | None = None
    labCode: str
    labSubtype: str | None = None
    valueNum: float | int | None = None
    valueText: str | None = None
    unit: str | None = None
    measuredAt: datetime | str | None = None
    note: str | None = None

    @field_validator("labSubtype", "valueText", "unit", "measuredAt", "note", mode="before")
    @classmethod
    def _clean_empty(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class VisitLabResult(BaseModel):
    id: UUID
    visitId: UUID
    labCode: str
    labSubtype: str | None = None
    valueNum: float | None = None
    valueText: str | None = None
    unit: str | None = None
    measuredAt: datetime
    note: str | None = None
    createdAt: datetime


class VisitRevision(BaseModel):
    id: UUID
    visitId: UUID
    revisionNo: int
    formVersionId: UUID
    revisionType: Literal["confirmed_snapshot", "post_confirm_amendment"]
    changeReason: str
    snapshotData: dict[str, Any]
    createdBy: UUID
    createdAt: datetime


class LatestVisitClinicalSummary(BaseModel):
    sourceVisitId: UUID
    sourceVisitCode: str
    sourceVisitDate: datetime
    sourceVisitStatus: VisitStatus
    sourceFormVersionId: UUID
    sourceFormVersionLabel: str | None = None
    sourceRowVersion: int
    heightCm: float | None = None
    weightKg: float | None = None
    bmi: float | None = None
    latestBp: OrthostaticBpMeasurement | None = None
    recordedMedications: list[VisitMedication] = Field(default_factory=list)
    recordedAllergies: list[VisitAllergy] = Field(default_factory=list)


class PatientDetailResponse(BaseModel):
    patient: Patient
    latestVisitSummary: LatestVisitClinicalSummary | None = None


class DiagnosisInput(BaseModel):
    code: str = Field(pattern=r"^[A-Z][0-9]{2}(\.[A-Z0-9]{1,4})?$", max_length=8)
    display: str = Field(min_length=1, max_length=200)
    role: Literal["primary", "secondary"]


class VisitDetailResponse(BaseModel):
    access: CareAccess | None = None
    visit: Visit
    values: list[VisitValueOut]
    orthostaticBp: list[OrthostaticBpMeasurement]
    medications: list[VisitMedication]
    allergies: list[VisitAllergy]
    labResults: list[VisitLabResult]
    revisions: list[VisitRevision]
    diagnoses: list[DiagnosisInput] = Field(default_factory=list)


class VisitFormStructureResponse(BaseModel):
    visitId: UUID
    formVersion: FormVersion
    sections: list[FormSection]
    fieldDefinitions: list[FieldDefinition]


class SaveVisitDraftRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    medicationListState: Literal["known", "none", "unknown"] | None = None
    allergyListState: Literal["known", "none", "unknown"] | None = None
    diagnosisListState: Literal["known", "none", "unknown"] | None = None
    diagnoses: list[DiagnosisInput] = Field(default_factory=list)
    rowVersion: int | None = Field(default=None, ge=1)
    clinicalNote: str | None = None
    infoSource: str | None = None
    values: list[VisitValueInput] = Field(default_factory=list)
    orthostaticBp: list[OrthostaticBpInput] = Field(default_factory=list)
    medications: list[VisitMedicationInput] = Field(default_factory=list)
    allergies: list[VisitAllergyInput] = Field(default_factory=list)
    labResults: list[VisitLabResultInput] = Field(default_factory=list)

    @field_validator("clinicalNote", "infoSource", mode="before")
    @classmethod
    def _clean_empty(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class SectionReviewSummary(BaseModel):
    sectionCode: SectionCode
    titleVi: str
    answeredCount: int
    unfilledCount: int
    unknownCount: int
    errorCount: int


class AiModuleReadiness(BaseModel):
    aiModuleCode: AiModuleCode
    ready: bool
    missingFieldCodes: list[str]


class VisitReviewResponse(BaseModel):
    visitId: UUID
    formVersionId: UUID
    rowVersion: int
    readinessTier: ReadinessTier
    canConfirm: bool
    totalAnswered: int
    totalUnfilled: int
    totalUnknown: int
    totalErrors: int
    sections: list[SectionReviewSummary]
    tier3ConfirmErrors: list[FieldValidationErrorItem]
    tier4AiModules: list[AiModuleReadiness]


class ConfirmVisitRequest(BaseModel):
    rowVersion: int | None = Field(default=None, ge=1)
    confirmNote: str | None = Field(default=None, max_length=500)

    @field_validator("confirmNote", mode="before")
    @classmethod
    def _clean_empty(cls, v: Any) -> Any:
        return _empty_str_to_none(v)


class CreateVisitRevisionRequest(BaseModel):
    rowVersion: int | None = Field(default=None, ge=1)
    changeReason: str = Field(min_length=5, max_length=500)


class AiInputFieldValue(BaseModel):
    state: ValueState
    value: float | int | str | bool | list[str] | None = None
    unit: str | None = None


class AiInputPayload(BaseModel):
    visitId: UUID
    patientCode: str
    formVersionId: UUID
    revisionNo: int
    confirmedAt: datetime
    confirmedBy: UUID
    values: dict[str, AiInputFieldValue]
    orthostaticBp: list[OrthostaticBpMeasurement]
    medications: list[VisitMedication]
    allergies: list[VisitAllergy]
    labResults: list[VisitLabResult]
    modules: list[AiModuleReadiness]


# ---------------------------------------------------------------------------
# Audit Log Schema (M8)
# ---------------------------------------------------------------------------
class AuditLog(BaseModel):
    id: UUID
    actorUserId: UUID | None = None
    actorUsername: str | None = None
    actorRole: UserRole | None = None
    action: AuditAction
    entityType: str
    entityId: UUID | None = None
    occurredAt: datetime
    ip: str | None = None
    requestId: str | None = None
    outcome: Literal["success", "denied", "failure"]
    detail: dict[str, Any] = Field(default_factory=dict)


class AuditLogListResponse(BaseModel):
    items: list[AuditLog]
    pagination: PaginationMeta
