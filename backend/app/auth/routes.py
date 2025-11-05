from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from .services import UserService
from .schemas import (
    UserCreateModel_By_Password,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    LoginResponse,
    TokenRefreshResponse,
    MessageResponse,
    UserResponse
)
from .dependencies import get_current_user, get_current_active_user
from app.models.user import User


auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
user_service = UserService()


@auth_router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreateModel_By_Password,
    session: Session = Depends(get_db)
):
    """Register a new user"""
    user = user_service.create_user_by_password(user_data, session)
    return user


@auth_router.post("/login", response_model=LoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_db)
):
    """Login with email (username field) and password"""
    return user_service.login_with_password(form_data.username, form_data.password, session)


@auth_router.post("/refresh", response_model=TokenRefreshResponse)
def refresh_token(
    request: RefreshRequest,
    session: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    return user_service.refresh_access_token(request.refresh_token, session)


@auth_router.post("/logout", response_model=MessageResponse)
def logout(
    request: RefreshRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """Logout user by revoking refresh token"""
    return user_service.logout(request.refresh_token, session)


@auth_router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current authenticated user profile"""
    return current_user


@auth_router.post("/logout-all", response_model=MessageResponse)
def logout_all_devices(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """Logout from all devices"""
    count = user_service.revoke_all_user_tokens(current_user.user_id, session)
    return {"message": f"Successfully logged out from {count} device(s)"}