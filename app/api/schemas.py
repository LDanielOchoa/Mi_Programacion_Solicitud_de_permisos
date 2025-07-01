from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime  

class LoginRequest(BaseModel):
    code: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    role: str

class UserResponse(BaseModel):
    code: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UpdatePhoneRequest(BaseModel):
    phone: str

class PermitRequest(BaseModel):
    phone: str
    dates: List[str]
    noveltyType: str
    time: Optional[str] = None
    description: str
    files: Optional[List[str]] = []
    
class EquipmentRequest(BaseModel):
    type: str
    description: str
    zona: Optional[str] = None
    codeAM: Optional[str] = None
    codePM: Optional[str] = None
    shift: Optional[str] = None
    
class PhoneUpdate(BaseModel):
    phone: str

class NotificationStatusUpdate(BaseModel):
    notification_status: int
    
class SolicitudResponse(BaseModel):
    id: int
    code: str
    name: str
    tipo_novedad: str
    description: str
    status: str
    respuesta: str
    zona: Optional[str] = None
    createdAt: datetime
    
class PermitRequest2(BaseModel):
    code: str
    name: str
    phone: str
    dates: List[str]
    noveltyType: str
    time: Optional[str]
    description: str
    
class ApprovalUpdate(BaseModel):
    approved_by: str = Field(..., min_length=1)

class UserUpdateRequest(BaseModel):
    code: str
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
