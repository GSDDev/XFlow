from fastapi import APIRouter, HTTPException
from app.core.sockets import connected_agents, sio
from app.schemas.agent import CommandRequest

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("")
async def get_agents():
    """Devuelve la lista de agentes conectados y su última telemetría."""
    return {"agents": connected_agents}

@router.post("/{agent_id}/command")
async def send_command(agent_id: str, request: CommandRequest):
    """
    Ruta HTTP para disparar un comando a un agente específico.
    """
    if agent_id not in connected_agents:
        raise HTTPException(status_code=404, detail="Agent not found or disconnected")
    
    agent_data = connected_agents[agent_id]
    sid = agent_data.get('sid')
    
    if not sid:
        raise HTTPException(status_code=500, detail="Agent has no active socket session")
    
    # Enviar evento 'execute_command' al VDI
    await sio.emit('execute_command', {'command': request.command, 'task_id': request.task_id}, room=sid)
    
    return {"message": f"Command sent to {agent_id}", "task_id": request.task_id}
