import socketio

# Instancia de Socket.IO asíncrona compartida
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# Memoria para rastrear agentes conectados
# Estructura: {"NOMBRE_EQUIPO": {"ip": "...", "cpu_percent": 0, "sid": "socket_id", ...}}
connected_agents = {}

@sio.event
async def connect(sid, environ):
    print(f"[{sid}] Nueva conexión WebSocket establecida.")

@sio.event
async def disconnect(sid):
    print(f"[{sid}] Desconexión WebSocket.")
    # Eliminar agente(s) asociados a este SID
    to_remove = [aid for aid, data in connected_agents.items() if data.get('sid') == sid]
    for aid in to_remove:
        print(f"[*] Agente eliminado (Desconectado): {aid}")
        del connected_agents[aid]

@sio.on('register_agent')
async def on_register_agent(sid, data):
    agent_id = data.get('agent_id', 'Unknown')
    print(f"[{sid}] [*] Agente Registrado: {agent_id}")
    data['sid'] = sid # Guardamos el ID del socket
    connected_agents[agent_id] = data

@sio.on('telemetry')
async def on_telemetry(sid, data):
    agent_id = data.get('agent_id')
    if agent_id in connected_agents:
        # Actualizamos stats, pero mantenemos el SID
        sid_actual = connected_agents[agent_id].get('sid')
        connected_agents[agent_id].update(data)
        connected_agents[agent_id]['sid'] = sid_actual

@sio.on('command_result')
async def on_command_result(sid, data):
    task_id = data.get('task_id')
    status = data.get('status')
    output = data.get('output')
    print(f"[{sid}] [!] Resultado Tarea '{task_id}' -> Estado: {status}")
    print(f"Salida:\n{output}\n{'-'*40}")

@sio.on('screen_frame')
async def on_screen_frame(sid, data):
    """
    Ruta el frame recibido del agente hacia los clientes UI correspondientes.
    Podríamos usar 'rooms' de Socket.IO para enviar esto solo a la UI conectada.
    """
    agent_id = data.get('agent_id')
    frame = data.get('frame')
    if agent_id and frame:
        # Re-emitimos a una sala específica de ese agente (o a un namespace de UI)
        # print(f"[Sockets] Forwarding frame for {agent_id} to room stream_{agent_id}") # Demasiado ruidoso, dejo comentado o uso uno cada 10 frames si fuera necesario
        await sio.emit('agent_screen', {'agent_id': agent_id, 'frame': frame}, room=f"stream_{agent_id}")

@sio.on('join_stream')
async def on_join_stream(sid, data):
    """La Web UI se une a la sala de stream de un agente y pide al agente que empiece."""
    agent_id = data.get('agent_id')
    print(f"[Sockets] UI requested join_stream for agent: {agent_id}")
    if agent_id and agent_id in connected_agents:
        agent_sid = connected_agents[agent_id].get('sid')
        # Añadir al Web UI a la sala para recibir frames
        await sio.enter_room(sid, f"stream_{agent_id}")
        # Solicitar al agente que comience a emitir su pantalla
        print(f"[Sockets] Sending start_stream to agent {agent_id} (SID: {agent_sid})")
        await sio.emit('start_stream', {}, room=agent_sid)
        print(f"[{sid}] joined stream for {agent_id}")
    else:
        print(f"[Sockets] Warning: Agent {agent_id} not found in connected_agents: {list(connected_agents.keys())}")

@sio.on('leave_stream')
async def on_leave_stream(sid, data):
    """La Web UI sale de la sala de stream de un agente y pide detenerlo."""
    agent_id = data.get('agent_id')
    if agent_id and agent_id in connected_agents:
        agent_sid = connected_agents[agent_id].get('sid')
        # Quitar al Web UI de la sala
        await sio.leave_room(sid, f"stream_{agent_id}")
        # Si ya no hay gente en la sala, avisar al agente de que puede detener el stream.
        # (Para esto tendríamos que verificar los count() de la room, pero
        # temporalmente simplemente lo pararemos, asumiendo 1 frontend por agente)
        await sio.emit('stop_stream', {}, room=agent_sid)
        print(f"[{sid}] left stream for {agent_id}")
