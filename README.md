# XFlow - Gestión y Monitorización de Infraestructuras VDI

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/docker-supported-brightgreen)](https://www.docker.com/)

XFlow es una plataforma completa para la gestión, monitorización y control de infraestructuras de Virtual Desktop Infrastructure (VDI). Permite administrar sesiones de usuarios, desplegar jobs y visualizar métricas en tiempo real a través de una interfaz web intuitiva.

## 📋 Tabla de Contenidos

- [Características Principales](#características-principales)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación Rápida con Docker](#instalación-rápida-con-docker)
- [Configuración Manual](#configuración-manual)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Uso](#uso)
- [API Reference](#api-reference)
- [Contribución](#contribución)
- [Licencia](#licencia)

## ✨ Características Principales

- **Monitorización en Tiempo Real**: Visualiza métricas de CPU, memoria y estado de sesiones de todas tus VDs
- **Gestión de Jobs**: Repositorio integrado de jobs para ejecutar tareas en las máquinas virtuales
- **Control de Sesiones**: Inicia, detén y administra sesiones de usuarios desde un panel central
- **Arquitectura Escalable**: Diseñado para crecer desde despliegues pequeños hasta grandes infraestructuras
- **Despliegue Flexible**: Opciones de instalación mediante Docker o manual
- **API RESTful**: Interfaz completa para integración con otros sistemas

## 🏗 Arquitectura

XFlow consta de tres componentes principales:

1. **Backend (Flask)**: API REST que gestiona la lógica de negocio, jobs y comunicación con agentes
2. **Frontend (React)**: Interfaz de usuario moderna y responsive para administración
3. **Agente (Python)**: Componente instalado en cada VDI que reporta métricas y ejecuta comandos

## 📋 Requisitos Previos

- Docker y Docker Compose (para instalación con contenedores)
- Python 3.8+ y Node.js 14+ (para instalación manual)
- Acceso a las máquinas VDI que serán monitorizadas
- (Opcional) Git para clonar el repositorio

## 🚀 Instalación Rápida con Docker

La forma más sencilla de desplegar XFlow es usando Docker Compose:

```bash
# Clonar el repositorio
git clone https://github.com/GSDDev/XFlow.git
cd XFlow

# Configurar el archivo de configuración
cp config.json.exemple config.json
# Editar config.json con tus parámetros

# Iniciar los contenedores
docker-compose up -d
La aplicación estará disponible en:

Frontend: http://localhost:3000

Backend API: http://localhost:5000

⚙️ Configuración Manual
Backend
bash
cd manager/backend

# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# Iniciar el servidor
python app.py
Frontend
bash
cd manager/frontend

# Instalar dependencias
npm install

# Configurar
cp .env.example .env.local
# Editar .env.local con la URL de tu backend

# Iniciar en modo desarrollo
npm start

# Para producción
npm run build
📁 Estructura del Proyecto
text
XFlow/
├── manager/
│   ├── backend/           # API REST con Flask
│   │   ├── app.py         # Punto de entrada
│   │   ├── routes/        # Endpoints de la API
│   │   ├── models/        # Modelos de datos
│   │   └── services/      # Lógica de negocio
│   └── frontend/          # Interfaz React
│       ├── src/
│       │   ├── components/# Componentes reutilizables
│       │   ├── pages/     # Páginas de la aplicación
│       │   ├── services/  # Servicios y llamadas API
│       │   └── styles/    # Estilos CSS
│       └── public/        # Archivos estáticos
├── vdi_agent.py           # Agente para VDs
├── docker-compose.yml     # Orquestación de contenedores
├── config.json            # Configuración global
└── requirements_agent.txt # Dependencias del agente
💻 Uso
Acceso a la Plataforma
Abre tu navegador en http://tu-servidor:3000

Inicia sesión con las credenciales por defecto (admin/admin, cámbialas en producción)

El dashboard principal mostrará un resumen de todas tus VDs

Gestión de Jobs
Los jobs son scripts o tareas que puedes ejecutar en tus VDs. Para añadir un nuevo job:

Navega a la sección "Jobs Repository"

Haz clic en "Add New Job"

Proporciona el nombre, descripción y el script a ejecutar

El job estará disponible para ejecutarse en cualquier VD

Monitorización de VDs
El panel de control muestra en tiempo real:

Estado de cada VD (activa/inactiva)

Uso de CPU y memoria

Sesiones de usuario activas

Historial de jobs ejecutados

📚 API Reference
La API REST está disponible en http://tu-servidor:5000/api

Endpoint	Método	Descripción
/api/vds	GET	Lista todas las VDs
/api/vd/<id>	GET	Detalles de una VD específica
/api/vd/<id>/metrics	GET	Métricas en tiempo real
/api/jobs	GET	Lista todos los jobs disponibles
/api/jobs	POST	Crea un nuevo job
/api/vd/<id>/execute	POST	Ejecuta un job en una VD
🤝 Contribución
Las contribuciones son bienvenidas. Por favor:

Haz fork del proyecto

Crea una rama para tu feature (git checkout -b feature/AmazingFeature)

Commit tus cambios (git commit -m 'Add some AmazingFeature')

Push a la rama (git push origin feature/AmazingFeature)

Abre un Pull Request

📄 Licencia
Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.
