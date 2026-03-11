from pydantic import BaseModel

class CommandRequest(BaseModel):
    command: str
    task_id: str = "manual_1"

class AgentTelemetry(BaseModel):
    agent_id: str
    os: str
    ip: str
    cpu_percent: float
    ram_percent: float
    timestamp: float
