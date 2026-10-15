import enum


class UserRole(str, enum.Enum):
    ADMINISTRADOR = "administrador"
    OPERADOR = "operador"
    PERSONAL_CAMPO = "personal_campo"
    CONSULTA = "consulta"


class MissionStatus(str, enum.Enum):
    BORRADOR = "borrador"
    PLANIFICADA = "planificada"
    EN_EJECUCION = "en_ejecucion"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"
    CON_ERROR = "con_error"


class Severity(str, enum.Enum):
    # Pendiente de alinear con las clases definidas por el modelo de IA.
    BAJA = "baja"
    MEDIA = "media"
    ALTA = "alta"


class AttentionStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    PROGRAMADO = "programado"
    EN_REPARACION = "en_reparacion"
    ATENDIDO = "atendido"


class ValidationStatus(str, enum.Enum):
    SIN_REVISAR = "sin_revisar"
    CONFIRMADO = "confirmado"
    FALSO_POSITIVO = "falso_positivo"


class DataOrigin(str, enum.Enum):
    REAL = "real"
    SIMULATED = "simulated"
    HISTORICAL = "historical"


class DetectionSource(str, enum.Enum):
    MODEL = "model"
    MANUAL = "manual"


class OrthomosaicStatus(str, enum.Enum):
    PENDING_UPLOAD = "pending_upload"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


class FileStatus(str, enum.Enum):
    PENDING = "pending"
    STORED = "stored"
    FAILED = "failed"
