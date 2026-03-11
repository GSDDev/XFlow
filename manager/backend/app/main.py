from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.core.sockets import sio, connected_agents
from app.routers import agents, auth, jobs, projects, credentials
from app.core.database import engine
from app.models import Base

# Base FastAPI application
app_fastapi = FastAPI(title="XFlow Manager", description="VDI Management Server")

# Create database tables on startup
@app_fastapi.on_event("startup")
def startup_event():
    print("[*] Initializing database...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[+] Database tables created/verified.")
    except Exception as e:
        print(f"[-] Error creating database tables: {e}")
        # Note: In production, we might want to retry or exit. 
        # For now, we continue so the app (and CORS) can still function.

app_fastapi.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app_fastapi.include_router(agents.router)
app_fastapi.include_router(auth.router)
app_fastapi.include_router(jobs.router)
app_fastapi.include_router(projects.router)
app_fastapi.include_router(projects.definitions_router)
app_fastapi.include_router(credentials.router)
app_fastapi.include_router(credentials.apps_router)

# Mount Socket.IO directly onto the FastAPI application
app = socketio.ASGIApp(sio, other_asgi_app=app_fastapi)

@app_fastapi.get("/")
async def root():
    return {
        "message": "XFlow Manager is running",
        "agents_connected": len(connected_agents)
    }
