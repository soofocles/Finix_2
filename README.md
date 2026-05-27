# 💰 Finix — Gestión Inteligente de Finanzas

Aplicación web de gestión financiera personal y empresarial. Stack: **Angular 21** (frontend) + **Node.js / Express** (backend) + **MongoDB Atlas** (base de datos).

---

## 📋 Requisitos previos

Asegúrate de tener instalado lo siguiente antes de continuar:

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| Node.js | 20.x LTS o superior | [nodejs.org](https://nodejs.org) |
| npm | 9.x o superior | Viene con Node.js |
| Git | Cualquier versión | [git-scm.com](https://git-scm.com) |
| Visual Studio Code | Cualquier versión | [code.visualstudio.com](https://code.visualstudio.com) |

> **Verificar instalación:** abre una terminal y ejecuta:
> ```bash
> node -v
> npm -v
> git -v
> ```

---

## 🧩 Extensiones recomendadas para Visual Studio Code

Instala las siguientes extensiones para una experiencia de desarrollo óptima. Puedes buscarlas directamente en la pestaña **Extensions** de VS Code (`Ctrl+Shift+X`).

### ⚡ Esenciales (obligatorias)

| Extensión | ID | Para qué sirve |
|-----------|-----|----------------|
| **Angular Language Service** | `Angular.ng-template` | Autocompletado, errores y navegación en templates HTML de Angular |
| **ESLint** | `dbaeumer.vscode-eslint` | Linting de JavaScript / TypeScript en tiempo real |
| **Prettier - Code Formatter** | `esbenp.prettier-vscode` | Formatea el código automáticamente al guardar |
| **Thunder Client** | `rangav.vscode-thunder-client` | Cliente HTTP para probar los endpoints del backend sin salir de VS Code |
| **MongoDB for VS Code** | `mongodb.mongodb-vscode` | Conectarse y explorar la base de datos MongoDB Atlas directamente |

### 🛠️ Productividad (muy recomendadas)

| Extensión | ID | Para qué sirve |
|-----------|-----|----------------|
| **GitLens** | `eamodio.gitlens` | Ver historial de git, blame y comparaciones de código |
| **Auto Rename Tag** | `formulahendry.auto-rename-tag` | Renombra etiquetas HTML de apertura y cierre al mismo tiempo |
| **Path Intellisense** | `christian-kohler.path-intellisense` | Autocompletado de rutas de archivos en imports |
| **Error Lens** | `usernamehw.errorlens` | Muestra errores y warnings directamente en la línea de código |
| **indent-rainbow** | `oderwat.indent-rainbow` | Colorea los niveles de indentación para mejor legibilidad |
| **Material Icon Theme** | `pkief.material-icon-theme` | Íconos bonitos para los archivos en el explorador |

### 🔧 Instalación rápida por terminal

Puedes instalar todas las extensiones esenciales de una sola vez ejecutando este comando en la terminal:

```bash
code --install-extension Angular.ng-template
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension rangav.vscode-thunder-client
code --install-extension mongodb.mongodb-vscode
code --install-extension eamodio.gitlens
code --install-extension usernamehw.errorlens
```

---

## 🚀 Inicialización del proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/soofocles/Finix.git
cd Finix_2
```

### 2. Configurar el Backend

```bash
# Entrar a la carpeta del backend
cd backend

# Instalar dependencias
npm install

# Crear el archivo de variables de entorno
# (Copiar el ejemplo o crear uno nuevo)
```

Crea el archivo `backend/.env` con el siguiente contenido:

```env
PORT=3000
MONGO_URI=<tu_uri_de_mongodb_atlas>
JWT_SECRET=un_secreto_muy_seguro_cambiame
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=otro_secreto_muy_seguro_cambiame
JWT_REFRESH_EXPIRES_IN=7d
MAX_LOGIN_ATTEMPTS=5
LOCK_DURATION_MINUTES=15
BCRYPT_SALT_ROUNDS=12
NODE_ENV=development
```

> 💡 **MongoDB Atlas:** Si no tienes URI, regístrate gratis en [mongodb.com/atlas](https://www.mongodb.com/atlas) y crea un cluster. La URI tiene el formato:
> `mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/finix`

### 3. Configurar el Frontend

```bash
# Desde la raíz del proyecto, entrar al frontend
cd frontend

# Instalar dependencias
npm install
```

---

## ▶️ Ejecutar el proyecto

Necesitas **dos terminales abiertas al mismo tiempo** — una para el backend y otra para el frontend.

### Terminal 1 — Backend

```bash
cd backend

# Modo desarrollo (con auto-recarga al guardar cambios)
npm run dev

# O modo producción
npm start
```

✅ Verás en consola:
```
Servidor corriendo en el puerto 3000
Conexión a MongoDB exitosa
```

### Terminal 2 — Frontend

```bash
cd frontend

# Iniciar servidor de desarrollo Angular
npm start
```

✅ El servidor de Angular iniciará en:
```
http://localhost:4200
```

Abre esa URL en tu navegador para ver la aplicación.

---

## 🔗 URLs disponibles

| Servicio | URL |
|---------|-----|
| Frontend (Angular) | `http://localhost:4200` |
| Backend (API REST) | `http://localhost:3000/api` |
| Health check | `http://localhost:3000/api/health` |

---

## 📡 Endpoints principales de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Crear nueva cuenta |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/refresh` | Renovar token |
| `POST` | `/api/auth/logout` | Cerrar sesión |
| `GET` | `/api/auth/me` | Perfil del usuario autenticado |
| `GET` | `/api/personal-finance` | Finanzas personales |
| `GET` | `/api/business-finance` | Finanzas empresariales |

---

## 📁 Estructura del proyecto

```
Finix_2/
├── backend/                # API REST con Node.js + Express
│   ├── src/
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── middlewares/    # Auth, validación, errores
│   │   ├── models/         # Esquemas de Mongoose (MongoDB)
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Lógica de negocio
│   │   ├── utils/          # Utilidades (password, etc.)
│   │   ├── app.js          # Configuración de Express
│   │   └── server.js       # Punto de entrada
│   ├── .env                # Variables de entorno (NO subir a git)
│   └── package.json
│
└── frontend/               # SPA con Angular 21
    ├── src/
    │   ├── app/
    │   │   ├── core/       # Guards, interceptors, servicios globales
    │   │   └── pages/      # Componentes de cada página
    │   ├── environments/   # Configuración de entornos
    │   └── styles.css      # Estilos globales
    └── package.json
```

---

## ⚠️ Errores comunes

### ❌ "No se pudo conectar al servidor"
El backend no está corriendo. Ejecuta `npm run dev` en la carpeta `backend/`.

### ❌ "Cannot connect to MongoDB"
Verifica que la variable `MONGO_URI` en `backend/.env` sea correcta y que tu IP esté en la lista blanca de MongoDB Atlas (Network Access).

### ❌ Puerto 4200 ya en uso
```bash
# Windows — liberar el puerto
netstat -ano | findstr :4200
taskkill /PID <PID> /F
```

### ❌ Puerto 3000 ya en uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 🛠️ Scripts disponibles

### Backend (`cd backend`)
| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia con nodemon (auto-recarga) |
| `npm start` | Inicia en modo producción |

### Frontend (`cd frontend`)
| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo en `localhost:4200` |
| `npm run build` | Compila para producción |
| `npm run watch` | Compila en modo watch (desarrollo) |
| `npm test` | Ejecuta pruebas unitarias |

---

## 🧪 Probar la API con Thunder Client

1. Abre VS Code → icono de Thunder Client en la barra lateral.
2. Crea una nueva request `POST` a `http://localhost:3000/api/auth/register`.
3. En la pestaña **Body → JSON**, pega:

```json
{
  "name": "Tu Nombre",
  "email": "tu@correo.com",
  "password": "TuPassword1",
  "passwordConfirm": "TuPassword1"
}
```

4. Haz clic en **Send**. Deberías recibir un `201` con tu `accessToken`.
