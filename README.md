# 📋 Formulario de Auditoría MODO

Sistema de auditoría para comercios que aceptan **MODO** (billetera virtual argentina), desarrollado con **Google Apps Script** y desplegado como aplicación web.

## 📑 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Estructura de Archivos](#estructura-de-archivos)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Funcionalidades Detalladas](#funcionalidades-detalladas)
- [Configuración y Despliegue](#configuración-y-despliegue)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)

---

## 📝 Descripción General

Esta aplicación web permite a **auditores de campo** realizar relevamientos en comercios para verificar la correcta implementación y señalización de **MODO** como método de pago. Los auditores pueden:

- Iniciar sesión con su DNI
- Ver los casos/locales asignados
- Completar formularios detallados sobre el estado del comercio
- Subir fotografías como evidencia
- Editar registros previamente completados si es necesario

El sistema está optimizado para uso **móvil**, permitiendo que los auditores trabajen directamente desde sus dispositivos en el campo.

---

## ⭐ Características Principales

### 🔐 Autenticación por DNI
- Sistema de login mediante DNI del auditor
- Generación de tokens de sesión con expiración (1 hora)
- Almacenamiento seguro en `PropertiesService`

### 📱 Optimizado para Móvil
- Diseño responsive con breakpoints para pantallas pequeñas
- Botones y controles ampliados para uso táctil
- Compresión de imágenes antes de subir (reduce a máx. 2MB)

### 📷 Gestión de Fotografías
- Subida de hasta 10 fotos por caso
- Previsualización de imágenes antes de enviar
- Compresión automática (canvas resize + calidad JPEG)
- Subida paralela para mayor velocidad
- Almacenamiento en Google Drive con estructura de carpetas

### 📊 Formularios Dinámicos
- Formularios condicionales que se adaptan según:
  - Tipo de comercio (S: Supermercado, E: Estación de Servicio)
  - Estado del local (abierto/cerrado)
  - Si tiene promo MODO activa o no
  - Si tiene QR impreso
- Validación en tiempo real de campos obligatorios

### ✏️ Modo Edición
- Permite corregir fotos específicas marcadas para revisión
- Conserva las URLs de fotos no modificadas
- Elimina fotos antiguas automáticamente antes de reemplazarlas

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENTE (Navegador)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Index.html                            │   │
│  │  • Interfaz de usuario (HTML/CSS/JS)                    │   │
│  │  • Formularios dinámicos                                │   │
│  │  • Compresión de imágenes                               │   │
│  │  • Validaciones del lado cliente                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ google.script.run
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIDOR (Apps Script)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Código.js                             │   │
│  │  • getDatosAuditor() - Autenticación                    │   │
│  │  • uploadFile() - Subida de imágenes                    │   │
│  │  • guardarAuditoria() - Guardar formulario              │   │
│  │  • guardarEdicion() - Editar registros                  │   │
│  │  • asegurarCarpetaUnica() - Gestión de carpetas         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ALMACENAMIENTO                               │
│  ┌────────────────────┐     ┌────────────────────────────┐    │
│  │   Google Sheets    │     │      Google Drive          │    │
│  │  • soloLocalesAs.. │     │  • Carpetas por caso       │    │
│  │  • NewFormulario   │     │  • Fotos de evidencia      │    │
│  └────────────────────┘     └────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Archivos

```
FormularioModoAppScript/
├── .gitignore           # Archivos ignorados por git
├── appsscript.json      # Configuración del proyecto Apps Script
├── Código.js            # Backend - Lógica del servidor
├── Index.html           # Frontend - Interfaz de usuario
└── README.md            # Documentación del proyecto
```

### 📄 Código.js (Backend)
Contiene toda la lógica del servidor:

| Función | Descripción |
|---------|-------------|
| `doGet()` | Punto de entrada, sirve el HTML |
| `getDatosAuditor(dni)` | Autentica y retorna casos asignados |
| `uploadFile()` | Sube una imagen a Google Drive |
| `guardarAuditoria()` | Guarda formulario completo en Sheets |
| `guardarEdicion()` | Actualiza registro existente |
| `buscarFilaPorId()` | Busca fila por ID del caso |
| `eliminarArchivoPorNombre()` | Elimina foto antigua antes de reemplazar |
| `asegurarCarpetaUnica()` | Crea/obtiene carpeta en Drive |

### 📄 Index.html (Frontend)
Contiene:
- **CSS**: Estilos con variables CSS, diseño responsive y animaciones
- **HTML**: Estructura del formulario y modales
- **JavaScript**: 
  - Lógica de formularios dinámicos (`estadoFormulario`)
  - Configuración por tipo de comercio (`CONFIG_PREGUNTAS`)
  - Compresión de imágenes (`compressImage`)
  - Subida paralela (`handleUpload`)
  - Validaciones

---

## 🔄 Flujo de Trabajo

### 1️⃣ Autenticación
```
Usuario ingresa DNI → getDatosAuditor() → Valida en hoja "soloLocalesAsignados"
                                        → Genera token de sesión
                                        → Retorna lista de casos asignados
```

### 2️⃣ Completar Formulario
```
Selecciona caso → Abre modal "COMPLETAR" → Selecciona "Estado del local"
                                         → Formulario se adapta dinámicamente
                                         → Completa campos y sube fotos
                                         → Valida campos obligatorios
                                         → Comprime imágenes (cliente)
                                         → Subida paralela a Drive
                                         → Guarda en hoja "NewFormulario"
```

### 3️⃣ Editar Registro
```
Selecciona caso marcado para editar → buscarFilaPorId() obtiene fila
                                    → Muestra solo fotos a corregir
                                    → Elimina foto antigua en Drive
                                    → Sube nueva foto
                                    → Actualiza URLs en la hoja
```

---

## 🔧 Funcionalidades Detalladas

### Sistema de Formularios Dinámicos

El sistema utiliza un `Map` llamado `estadoFormulario.secciones` para controlar la visibilidad de cada sección:

```javascript
const estadoFormulario = {
  secciones: new Map([
    ['tiene-promo-contenedor', { visible: false, dependeDe: null }],
    ['primer-flujo-neutro', { visible: false, dependeDe: null }],
    // ... más secciones
  ]),
  mostrarSeccion(id) { /* ... */ },
  ocultarSeccion(id) { /* ... */ },
  // ...
}
```

### Configuración por Tipo de Comercio

```javascript
const CONFIG_PREGUNTAS = {
  S: { // Supermercado
    titulos: { /* textos específicos */ },
    opciones: { /* opciones de checkbox */ },
    elementosOcultos: []
  },
  E: { // Estación de Servicio
    titulos: { /* textos específicos */ },
    opciones: { /* opciones de checkbox */ },
    elementosOcultos: ['vidriera-indica-modo-contenedor']
  }
}
```

### Compresión de Imágenes

```javascript
async function compressImage(file, maxSizeMB = 2, maxWidth = 1920, maxHeight = 1080) {
  // 1. Redimensiona si excede dimensiones máximas
  // 2. Comprime iterativamente reduciendo calidad JPEG
  // 3. Retorna base64 optimizado
}
```

### Subida Paralela

```javascript
async function handleUpload(caso) {
  // 1. Asegura carpeta en Drive
  // 2. Crea array de promesas (una por foto)
  // 3. Promise.allSettled() para subidas paralelas
  // 4. Guarda auditoría con URLs resultantes
}
```

---

## ⚙️ Configuración y Despliegue

### Prerrequisitos
- Node.js instalado
- [clasp](https://github.com/google/clasp) instalado globalmente: `npm install -g @google/clasp`
- Cuenta de Google con acceso al proyecto

### Comandos de clasp

```bash
# Iniciar sesión en clasp
clasp login

# Clonar proyecto existente
clasp clone <scriptId>

# Subir cambios locales al proyecto
clasp push

# Descargar cambios del proyecto
clasp pull

# Abrir proyecto en el editor de Apps Script
clasp open
```

### Configuración de Ejecución (Windows PowerShell)

Si tienes error de política de ejecución:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Variables de Configuración


## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|------------|-----|
| **Google Apps Script** | Backend, APIs de Google |
| **HTML5** | Estructura de la interfaz |
| **CSS3** | Estilos, variables CSS, responsive design |
| **JavaScript ES6+** | Lógica del cliente, async/await, Promises |
| **Google Sheets** | Base de datos de casos y formularios |
| **Google Drive** | Almacenamiento de fotografías |
| **clasp** | Desarrollo local y despliegue |

---

## 📊 Hojas de Google Sheets

### `soloLocalesAsignados`
Contiene los casos asignados a cada auditor:
- DNI del auditor
- Datos del comercio (nombre, dirección, ID)
- Configuración del caso (promo, QR impreso, tipo)
- Estado de completado y edición

### `NewFormulario`
Almacena las respuestas de los formularios:
- Timestamp
- Datos del comercio y auditor
- Todas las respuestas del formulario
- URLs de las 10 fotos


*Desarrollado para la gestión de auditorías de comercios adheridos a MODO* 🇦🇷
