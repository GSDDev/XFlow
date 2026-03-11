from app.core.database import engine
from sqlalchemy import text

def migrate():
    print("[*] Checking for missing columns...")
    
    # 1. Check for project_id column
    column_exists = False
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT project_id FROM variable_definitions LIMIT 1"))
            column_exists = True
            print("[i] project_id column already exists.")
        except Exception:
            # Postgres requires a new connection/transaction after a failure
            print("[*] project_id column missing, preparing to add...")
    
    # 2. Add column if missing (using a fresh transaction block)
    if not column_exists:
        with engine.begin() as conn:
            try:
                print("[*] Adding project_id column to variable_definitions...")
                conn.execute(text("ALTER TABLE variable_definitions ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE"))
                print("[+] Column added successfully.")
            except Exception as e:
                print(f"[-] Error adding column: {e}")

    # 3. Ensure Key is unique (optional refinement)
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE variable_definitions ADD CONSTRAINT unique_key UNIQUE (key)"))
            print("[+] Unique constraint verified.")
        except Exception:
            pass

if __name__ == "__main__":
    migrate()
