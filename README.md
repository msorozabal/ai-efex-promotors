# EFEX Promotor Copilot

Plataforma de copiloto inteligente para promotores de EFEX, impulsada por Claude Opus 4.5 a traves de AWS Bedrock.

## Descripcion

El Copiloto EFEX es una herramienta diseñada para ayudar a los promotores de EFEX a:

- **Aumentar su productividad** automatizando tareas repetitivas
- **Mejorar la atencion al cliente** con respuestas rapidas y profesionales
- **Gestionar su cartera de clientes** de manera eficiente
- **Generar mensajes personalizados** para prospectos y clientes
- **Analizar oportunidades de venta** con inteligencia artificial

## Stack Tecnologico

### Backend
- **Python 3.10+** con Flask
- **Flask-JWT-Extended** para autenticacion
- **SQLAlchemy** para base de datos
- **AWS Bedrock** para integracion con Claude Opus 4.5
- **Boto3** para SDK de AWS

### Frontend
- **React 18** con hooks
- **React Router** para navegacion
- **Axios** para peticiones HTTP
- **Lucide React** para iconos
- **CSS moderno** con variables y responsive design

## Requisitos Previos

1. **Python 3.10+**
2. **Node.js 18+** y npm
3. **Cuenta de AWS** con acceso a Bedrock
4. **Credenciales de AWS** con permisos para:
   - `bedrock:InvokeModel`
   - `bedrock:InvokeModelWithResponseStream`

## Instalacion

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd ai-efex-promotors
```

### 2. Configurar el Backend

```bash
cd backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
```

Edita el archivo `backend/.env` con tus credenciales:

```env
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=tu-clave-secreta-aqui

# JWT Configuration
JWT_SECRET_KEY=tu-jwt-secret-aqui

# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=tu-access-key-de-aws
AWS_SECRET_ACCESS_KEY=tu-secret-key-de-aws
AWS_REGION=us-east-1
```

### 3. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install
```

## Ejecucion

### Opcion 1: Usando scripts (recomendado)

Abre dos terminales:

**Terminal 1 - Backend:**
```bash
./start-backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start-frontend.sh
```

### Opcion 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## Acceso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

### Primer uso

1. Abre http://localhost:3000
2. Haz clic en "Registrate" para crear una cuenta
3. Completa el formulario de registro
4. Seras redirigido al dashboard

## Funcionalidades

### Dashboard
- Vista general de estadisticas
- Accesos rapidos a funciones principales
- Lista de clientes recientes

### Copiloto AI
- Chat interactivo con Claude Opus 4.5
- Historial de conversaciones
- Sugerencias de prompts
- Markdown renderizado en respuestas

### Gestion de Clientes
- CRUD completo de clientes
- Estados: Prospecto, Activo, Inactivo
- Busqueda y filtros
- Notas y detalles del negocio

### Herramientas AI
- Generacion de mensajes personalizados
- Analisis de oportunidades de venta
- Asistencia en atencion al cliente

## Arquitectura

```
ai-efex-promotors/
├── backend/
│   ├── app.py              # Aplicacion principal Flask
│   ├── config.py           # Configuracion
│   ├── models.py           # Modelos SQLAlchemy
│   ├── ai_service.py       # Servicio de integracion con Bedrock
│   ├── requirements.txt    # Dependencias Python
│   └── .env.example        # Template de variables de entorno
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Paginas de la aplicacion
│   │   ├── context/        # Contextos de React
│   │   ├── services/       # Servicios de API
│   │   ├── styles/         # Estilos CSS
│   │   ├── App.js          # Componente principal
│   │   └── index.js        # Punto de entrada
│   └── package.json
│
├── start-backend.sh        # Script de inicio backend
├── start-frontend.sh       # Script de inicio frontend
└── README.md
```

## API Endpoints

### Autenticacion
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesion
- `GET /api/auth/me` - Usuario actual

### Copiloto
- `POST /api/copilot/chat` - Enviar mensaje al copiloto
- `GET /api/copilot/conversations` - Listar conversaciones
- `GET /api/copilot/conversations/:id` - Obtener conversacion
- `DELETE /api/copilot/conversations/:id` - Eliminar conversacion
- `POST /api/copilot/generate-message` - Generar mensaje para cliente
- `POST /api/copilot/analyze-opportunity` - Analizar oportunidad

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Crear cliente
- `GET /api/clients/:id` - Obtener cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente

### Dashboard
- `GET /api/dashboard/stats` - Estadisticas del promotor

## Modo Desarrollo (Sin AWS)

Si no tienes credenciales de AWS configuradas, el sistema funcionara en **modo mock** con respuestas simuladas. Esto es util para desarrollo y pruebas.

## Configuracion de AWS Bedrock

1. Accede a la consola de AWS
2. Ve a Amazon Bedrock
3. Habilita el modelo `Claude Opus 4.5` en tu region
4. Crea credenciales IAM con permisos de Bedrock
5. Configura las credenciales en `backend/.env`

### Regiones soportadas para Claude Opus 4.5
- us-east-1 (N. Virginia)
- us-west-2 (Oregon)
- eu-west-1 (Ireland)

## Branding EFEX

La aplicacion utiliza los colores de marca de EFEX:

- **Navy (Primario):** #0D2137
- **Lime (Acento):** #C4F042
- **Cyan:** #00D4AA

## Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

Proyecto propietario de EFEX.

---

Desarrollado con Claude Opus 4.5 via AWS Bedrock
