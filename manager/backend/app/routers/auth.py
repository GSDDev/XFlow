import os
import json
from fastapi import APIRouter, HTTPException
from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

AUTH_CONFIG_FILE = "auth_config.json"

def load_auth_config():
    if os.path.exists(AUTH_CONFIG_FILE):
        try:
            with open(AUTH_CONFIG_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"[-] Error loading auth config: {e}")
    return {}

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    config = load_auth_config()
    
    # Bypass logic
    bypass_user = config.get("BYPASS_USER", "prueba")
    bypass_pass = config.get("BYPASS_PASS", "1234")
    
    if request.username == bypass_user and request.password == bypass_pass:
        return {
            "message": "Login successful (Bypass)",
            "token": "fake-jwt-token-for-now", # En una app real usaríamos JWT
            "username": request.username
        }
    
    # Placeholder para LDAP
    # Aquí iría la lógica de ldap3 para validar contra el servidor configurado
    
    raise HTTPException(status_code=401, detail="Invalid credentials")
