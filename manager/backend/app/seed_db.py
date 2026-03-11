from app.core.database import SessionLocal
from app.models import models
import uuid

def seed():
    db = SessionLocal()
    try:
        # 1. Check if we already have definitions
        if db.query(models.VariableDefinition).count() == 0:
            print("[*] Seeding variable definitions...")
            defs = [
                models.VariableDefinition(
                    key="MAX_RETRIES",
                    label="Máximo de Reintentos",
                    data_type="number",
                    default_value="3"
                ),
                models.VariableDefinition(
                    key="ENVIRONMENT",
                    label="Entorno de Ejecución",
                    data_type="string",
                    default_value="Production"
                ),
                models.VariableDefinition(
                    key="ENABLE_LOGGING",
                    label="Habilitar Logs Detallados",
                    data_type="boolean",
                    default_value="true"
                ),
                models.VariableDefinition(
                    key="NOTIFICATION_EMAIL",
                    label="Email de Notificaciones",
                    data_type="string",
                    default_value="admin@example.com"
                )
            ]
            db.add_all(defs)
            db.commit()
            print("[+] Definitions seeded.")
        else:
            print("[i] Definitions already exist.")

        # 2. Add a sample project if none exists
        if db.query(models.Project).count() == 0:
            print("[*] Adding sample project...")
            project = models.Project(
                code="GSD",
                name="GSDuran Project",
                description="Proyecto de prueba inicial"
            )
            db.add(project)
            db.commit()
            print("[+] Sample project added.")
    except Exception as e:
        print(f"[-] Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
