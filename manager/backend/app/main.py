from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.core.sockets import sio, connected_agents
from app.routers import agents, auth, jobs

# Base FastAPI application
app_fastapi = FastAPI(title="XFlow Manager", description="VDI Management Server")

app_fastapi.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://xflow.gsduran.es", "http://xflow.gsduran.es"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app_fastapi.include_router(agents.router)
app_fastapi.include_router(auth.router)
app_fastapi.include_router(jobs.router)

# Mount Socket.IO directly onto the FastAPI application
app = socketio.ASGIApp(sio, other_asgi_app=app_fastapi)

@app_fastapi.get("/")
async def root():
    return {
        "message": "XFlow Manager is running",
        "agents_connected": len(connected_agents)
    }
