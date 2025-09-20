## Modulo 1: Chatbot

### 📖 **Descripción General**

Este proyecto es una plataforma de software modular para optimizar procesos académicos y administrativos universitarios. El primer módulo se enfoca en un **chatbot asistido por IA** para soporte tecnológico a estudiantes y docentes.

---

### ⚙️ **Tecnologías Utilizadas**

| Componente   | Tecnologías                                                    |
| :----------- | :------------------------------------------------------------- |
| **Backend**  | Python, FastAPI, SQLAlchemy, PostgreSQL (a través de Supabase) |
| **Frontend** | Next.js, React, Tailwind CSS, Shadcn UI                        |

---

### 🚀 **Primeros Pasos**

Sigue estos pasos para configurar tu entorno de desarrollo.

#### 1\. Clona el Repositorio

```bash
git clone https://github.com/sanma613/chatbot-ia.git
cd chatbot-ia
```

---

### 🐍 **Configuración del Backend (FastAPI)**

#### 1\. Crea y Activa el Entorno Virtual

```bash
# Crear entorno virtual
python -m venv .venv

# Activar en Windows
.\.venv\Scripts\activate
```

#### 2\. Variables de Entorno

Crea un archivo llamado `.env` en la carpeta `backend` y añade las variables de configuración. **Nunca subas este archivo a Git**.

```
DATABASE_URL="postgresql://[USUARIO]:[PASSWORD]@[HOST]:[PUERTO]/[NOMBRE_DB]"
# Agrega otras variables necesarias aquí (ej. API_KEY, etc.)
```

#### 3\. Instala las Dependencias

```bash
# Dependencias de producción
pip install -r backend/requirements.txt
```

#### 4\. Genera el Archivo `requirements.txt`

Es crucial que cada vez que instales una nueva librería, actualices este archivo para que el resto del equipo pueda instalarla.

```bash
pip freeze > backend-fastapi/requirements.txt
```

---

### 🌐 **Configuración del Frontend (Next.js)**

#### 1\. Variables de Entorno

Crea un archivo `.env.local` en la carpeta `frontend`. **Nunca subas este archivo a Git**.

```
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
```

#### 2\. Instala las Dependencias

```bash
# Instala las dependencias de producción y desarrollo
cd frontend
npm install
```

El archivo `package.json` ya tiene todas las dependencias configuradas.

---

### 🛠️ **Formateo y Corrección de Código**

Usa estos comandos para mantener el código limpio y sin errores antes de contribuir.

#### **Backend**

```bash
# Formatear el código
make format

# O si no tienes make, usa los comandos directos:
# black backend
# isort backend

# Corregir errores de linter
make lint

# O los comandos directos:
# flake8 backend
# mypy backend
```

#### **Frontend**

```bash
# Formatear el código
npm run format

# Corregir errores de linter
npm run lint:fix

# Solo verificar (sin corregir)
npm run lint
```

---

### 🤝 **Flujo de Trabajo Colaborativo (Git)**

#### 1\. Sincroniza tu Rama Principal

Antes de empezar a trabajar, asegúrate de que tu rama `main` esté actualizada.

```bash
git checkout main
git pull origin main
```

#### 2\. Crea una Nueva Rama

**Crea una rama para cada nueva funcionalidad o corrección.** Usa un nombre descriptivo.

```bash
git checkout -b feat/nombre-de-la-funcionalidad
# o
git checkout -b fix/descripcion-del-error
```

#### 3\. Codifica y Haz tus Commits

Trabaja en tu código. Haz `commits` con mensajes claros y concisos.

```bash
git add .
git commit -m "feat: agrega interfaz de chatbot"
```

#### 4\. Sube tu Rama y Crea un Pull Request

Cuando termines, sube tu rama a GitHub y crea un Pull Request (PR) siguiendo el template dado para que el **QA** pueda revisarlo.

```bash
git push origin feat/nombre-de-la-funcionalidad
```

**Nota:** El equipo de **QA** se encargará de revisar tu PR y hacer el **`merge`** si el código cumple con los requisitos y las pruebas.
