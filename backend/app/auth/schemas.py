from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional


# Request models
class UserCreateModel_By_Password(BaseModel):
    email: EmailStr
    name: str = Field(max_length=100)
    password: str = Field(min_length=8, max_length=128)
    age: Optional[int] = None
    phone: Optional[str] = None
    user_type: str = Field(default="citizen")  # "citizen" or "manager"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


# Response models
class UserResponse(BaseModel):
    user_id: int
    email: str
    name: str
    user_type: str
    is_verified: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: dict


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: dict


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str


class MessageResponse(BaseModel):
    message: str

