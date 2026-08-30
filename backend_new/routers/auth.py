"""Auth router — /api/auth/*"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from services.auth_service import AuthService, AuthError
from services.jwt_utils import decode_token
from middleware.auth import get_current_user, get_current_admin
from schemas.auth import (
    RegisterRequest, LoginRequest, AdminLoginRequest,
    ChangePinRequest, ChangePasswordRequest,
)
from models.account import Account
from models.audit_log import AuditLog
from models.user import User
from jose import JWTError

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _get_ip(request: Request) -> str:
    return request.client.host if request.client else ""


@router.post("/register", status_code=201)
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    try:
        result = AuthService(db).register(req, ip=_get_ip(request))
        return {"message": "Account created successfully.", **result}
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    try:
        result = AuthService(db).login(req.email, req.password, ip=_get_ip(request))
        return result
    except AuthError as e:
        raise HTTPException(
            status_code=401,
            detail={
                "message": str(e),
                "attempts_remaining": e.attempts_remaining,
                "is_locked": e.is_locked,
            },
        )


@router.post("/admin/login")
def admin_login(req: AdminLoginRequest, request: Request, db: Session = Depends(get_db)):
    try:
        result = AuthService(db).admin_login(req.email, req.password, ip=_get_ip(request))
        return result
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_dict = current_user.to_dict()
    if current_user.role == "customer":
        accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
        user_dict["accounts"] = [a.to_dict() for a in accounts]
    return {"user": user_dict}


@router.post("/refresh")
def refresh(request: Request, db: Session = Depends(get_db)):
    body = None
    import asyncio
    from fastapi import Request
    # Extract refresh token from body
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Refresh token required.")
    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    from services.jwt_utils import create_access_token
    token_data = {"sub": payload["sub"], "role": payload["role"], "email": payload.get("email", "")}
    return {"access_token": create_access_token(token_data), "token_type": "bearer"}


@router.post("/change-pin")
def change_pin(req: ChangePinRequest, current_user: User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="No account found.")
    try:
        AuthService(db).change_pin(account.id, req.current_pin, req.new_pin)
        return {"message": "Transaction PIN changed successfully."}
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/change-password")
def change_password(req: ChangePasswordRequest,
                    request: Request,
                    current_user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    try:
        AuthService(db).change_password(
            current_user.id, req.current_password, req.new_password, ip=_get_ip(request)
        )
        return {"message": "Password changed successfully."}
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))
