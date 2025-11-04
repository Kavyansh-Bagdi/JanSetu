from app.models.user import User
from app.models.refresh_token import RefreshToken
from .schemas import UserCreateModel_By_Password, LoginResponse
from .utils import generate_password_hash, verify_password, create_access_token
from sqlalchemy.orm import Session
from fastapi.exceptions import HTTPException
from fastapi import status
from datetime import datetime, timedelta, timezone
import logging
from typing import Optional


class UserService:
    def get_user_by_email(self, email: str, session: Session):
        user = session.query(User).filter(User.email == email).first()
        return user
    
    def user_exists(self, email: str, session: Session) -> bool:
        """Check if a user exists by email."""
        user = self.get_user_by_email(email, session)
        return True if user else False
    
    def create_user_by_password(self, user_data: UserCreateModel_By_Password, session: Session):
        if self.user_exists(user_data.email, session):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="A user with same email exists"
            )
        
        user_data_dict = user_data.model_dump()

        # Remove password from dict
        password = user_data_dict.pop('password')
        
        new_user = User(**user_data_dict)
        new_user.hashed_password = generate_password_hash(password)
        
        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        return new_user
    
    
    # Login methods
    def login_with_password(self, email: str, password: str, session: Session):
        """Login with email and password"""
        user = self.get_user_by_email(email, session)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid credentials"
            )
        
        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid credentials"
            )
        
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Email not verified"
            )
        
        # Generate tokens
        access_token = create_access_token({
            "sub": str(user.user_id),
            "email": user.email,
            "user_type": user.user_type
        })
        refresh_token = self.create_refresh_token(user.user_id, session)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token.token,
            "token_type": "bearer",
            "user": {
                "user_id": user.user_id,
                "email": user.email,
                "name": user.name,
                "user_type": user.user_type
            }
        }
    
    def create_refresh_token(self, user_id: int, session: Session, 
                            ip_address: Optional[str] = None,
                            user_agent: Optional[str] = None) -> RefreshToken:
        """Create a refresh token for a user"""
        import secrets
        token_str = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token_str,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        session.add(refresh_token)
        session.commit()
        session.refresh(refresh_token)

        return refresh_token
    
    def refresh_access_token(self, refresh_token: str, session: Session):
        """Generate a new access token using a refresh token"""
        # Find the token
        token = session.query(RefreshToken).filter(
            RefreshToken.token == refresh_token
        ).first()
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid refresh token"
            )
        
        # Check if revoked or expired
        if token.is_revoked or token.expires_at <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired or been revoked"
            )
        
        # Get the user
        user = session.query(User).filter(User.user_id == token.user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Generate new access token
        access_token = create_access_token({
            "sub": str(user.user_id),
            "email": user.email,
            "user_type": user.user_type
        })
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    
    def logout(self, refresh_token: str, session: Session):
        """Revoke a refresh token to log the user out"""
        token = session.query(RefreshToken).filter(
            RefreshToken.token == refresh_token
        ).first()
        
        if token:
            token.is_revoked = True
            token.revoked_at = datetime.now(timezone.utc)
            session.add(token)
            session.commit()
        
        return {"message": "Successfully logged out"}
    
    def revoke_all_user_tokens(self, user_id: int, session: Session):
        """Revoke all tokens for a user (logout from all devices)"""
        tokens = session.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        ).all()
        
        for token in tokens:
            token.is_revoked = True
            token.revoked_at = datetime.now(timezone.utc)
            session.add(token)
        
        session.commit()
        return len(tokens)

