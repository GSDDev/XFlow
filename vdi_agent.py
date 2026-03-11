import os
import sys
import time
import socket
import subprocess
import psutil
import socketio
import threading
import io
import base64
import json
import platform
from mss import mss
from PIL import Image

# Configuración
CONFIG_FILE = "config.json"

def load_config():
    """Carga configuración y valida que existan los campos obligatorios."""
    config = {
        "XFLOW_MANAGER_URL": None,
        "AGENT_ID_OVERRIDE": None
    }
    
    # 1. Intentar cargar desde config.json
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
        except Exception as e:
            print(f"[-] Error leyendo {CONFIG_FILE}: {e}")
            
    # 2. Sobrescribir con variables de entorno
    for key in config.keys():
        env_val = os.environ.get(key)
        if env_val:
            config[key] = env_val
            
    # 3. Validación obligatoria
    if not config["XFLOW_MANAGER_URL"]:
        print("\n[CRITICAL ERROR] Configuration missing!")
        print("XFLOW_MANAGER_URL must be defined in 'config.json' or as an environment variable.")
        print("Refer to 'config.json.example' for the required format.")
        sys.exit(1)
            
    return config

# Inicializar configuración
config = load_config()
MANAGER_URL = config["XFLOW_MANAGER_URL"]
AGENT_ID = config["AGENT_ID_OVERRIDE"] or socket.gethostname()

# Iniciar cliente Socket.IO (ignorando verificación SSL para proxies con certs auto-firmados)
sio = socketio.Client(ssl_verify=False)

def get_system_info():
    """Obtiene información de telemetría dinámica (Windows/Linux)."""
    ip_address = socket.gethostbyname(socket.gethostname())
    cpu_usage = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory()
    os_name = platform.system()
    os_version = platform.platform()
    
    # Obtener el usuario logueado actualmente
    try:
        users = psutil.users()
        logged_user = users[0].name if users else "Unknown"
    except Exception:
        logged_user = "Unknown"
    
    return {
        "agent_id": AGENT_ID,
        "os": os_name,
        "os_version": os_version,
        "logged_user": logged_user,
        "ip": ip_address,
        "cpu_percent": cpu_usage,
        "ram_percent": ram.percent,
        "timestamp": time.time()
    }

@sio.event
def connect():
    print(f"[+] Conectado al Manager XFlow en {MANAGER_URL}")
    print(f"[*] Registrando agente: {AGENT_ID}")
    sio.emit('register_agent', get_system_info())

@sio.event
def connect_error(data):
    print(f"[-] Error de conexión: {data}")

@sio.event
def disconnect():
    print("[-] Desconectado del Manager XFlow")

@sio.on('execute_command')
def on_execute_command(data):
    """Ejecuta un comando recibido desde el Manager."""
    command = data.get('command')
    task_id = data.get('task_id')
    
    print(f"[*] Comando recibido (Task {task_id}): {command}")
    
    if not command:
        sio.emit('command_result', {'task_id': task_id, 'status': 'error', 'output': 'No command provided'})
        return
        
    try:
        # En Windows usamos shell=True y cmd.exe implícito o explícito
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60 # Timeout de 60 segundos por defecto
        )
        
        output = result.stdout if result.returncode == 0 else result.stderr
        status = 'success' if result.returncode == 0 else 'error'
        
        sio.emit('command_result', {
            'task_id': task_id,
            'status': status,
            'output': output,
            'returncode': result.returncode
        })
        print(f"[*] Comando finalizado con código: {result.returncode}")
        
    except subprocess.TimeoutExpired:
        sio.emit('command_result', {
            'task_id': task_id,
            'status': 'error',
            'output': 'Command execution timed out.',
            'returncode': -1
        })
    except Exception as e:
        sio.emit('command_result', {
            'task_id': task_id,
            'status': 'error',
            'output': str(e),
            'returncode': -1
        })

# Variables para controlar el stream de pantalla
streaming_active = False
stream_thread = None

def screen_streamer():
    global streaming_active
    with mss() as sct:
        # Se captura el primer monitor
        monitor = sct.monitors[1]
        while streaming_active and sio.connected:
            try:
                sct_img = sct.grab(monitor)
                img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
                
                # Resize para optimización en tiempo real (opcional)
                img.thumbnail((1280, 720))
                
                buffer = io.BytesIO()
                # Comprimir a JPEG con calidad 60 para ahorrar ancho de banda
                img.save(buffer, format="JPEG", quality=60)
                encoded = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                sio.emit('screen_frame', {
                    'agent_id': AGENT_ID,
                    'frame': encoded
                })
                # Max 5 FPS approx
                time.sleep(0.2)
            except Exception as e:
                print(f"[-] Error capturando pantalla: {e}")
                time.sleep(1)

@sio.on('start_stream')
def on_start_stream(data):
    global streaming_active, stream_thread
    print("[*] Petición de Stream recibida")
    if not streaming_active:
        streaming_active = True
        stream_thread = threading.Thread(target=screen_streamer, daemon=True)
        stream_thread.start()
        print("[+] Stream de pantalla iniciado")

@sio.on('stop_stream')
def on_stop_stream(data):
    global streaming_active
    print("[*] Deteniendo Stream de pantalla")
    streaming_active = False

def main():
    print(f"Iniciando XFlow VDI Agent en {AGENT_ID}...")
    while True:
        try:
            if not sio.connected:
                print(f"[*] Intentando conectar a {MANAGER_URL}...")
                sio.connect(MANAGER_URL)
            
            # Bucle principal de telemetría
            while sio.connected:
                # Enviar telemetría cada 10 segundos
                sio.emit('telemetry', get_system_info())
                time.sleep(10)
                
        except socketio.exceptions.ConnectionError:
            print(f"[-] Manager no disponible, reintentando en 5 segundos...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nSaliendo...")
            if sio.connected:
                sio.disconnect()
            sys.exit(0)
        except Exception as e:
            print(f"[-] Error inesperado: {e}")
            time.sleep(5)

if __name__ == '__main__':
    main()
