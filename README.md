# 🍸 Sistema de Inventario de Bar

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/tu-usuario/inventario-bar/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange.svg)](https://firebase.google.com/)

Sistema completo y profesional de gestión de inventario para bares con modo oscuro, escaneo de códigos de barras y reportes PDF.

## ✨ Características Principales

### 📦 Gestión de Inventario
- ✅ CRUD completo de productos (Crear, Leer, Actualizar, Eliminar)
- ✅ Control de stock en tiempo real con actualización rápida
- ✅ Categorización por tipo de bebida (Licor, Vino, Cerveza, Whisky, Vodka, Gin, Ron, Tequila)
- ✅ Sistema de productos importantes con marcador de estrella
- ✅ Alertas automáticas de stock bajo y sin stock
- ✅ Umbral de stock personalizable por producto
- ✅ Drag & drop para reordenar productos

### 📱 Escaneo de Códigos de Barras
- Escaneo mediante cámara en tiempo real
- Captura de foto para mejor precisión
- Ingreso manual de códigos
- Búsqueda instantánea por código de barras
- Compatible con dispositivos móviles

### 📊 Estadísticas y Análisis
- Dashboard interactivo con métricas clave
- Gráficos de pastel para distribución de stock
- Gráficos de barras por categoría
- Top 10 productos más valiosos
- Análisis de productos críticos
- Valor total del inventario y ganancias potenciales

### 📄 Reportes PDF Profesionales
- Inventario completo
- Productos con stock bajo
- Productos sin stock
- Stock crítico
- Por categoría
- Por proveedor
- Valoración económica

### 👥 Sistema de Usuarios y Roles
- **Admin**: Acceso total al sistema
- **Manager**: Gestión de inventario y proveedores
- **Bartender**: Solo gestión de inventario

### 🏢 Gestión de Proveedores
- Base de datos completa de proveedores
- Información de contacto
- Historial de productos por proveedor

### 📜 Historial Completo
- Registro de todas las acciones
- Filtros por tipo de acción y usuario
- Seguimiento de cambios de stock
- Auditoría completa del sistema

### 🌗 Modo Oscuro Profesional
- Transición suave y elegante (0.35s cubic-bezier)
- Diseño cuidado para cada elemento
- Guarda la preferencia del usuario
- Optimizado para uso prolongado

### 📱 Responsive Design
- Vista móvil optimizada
- Vista de escritorio completa
- Adaptable a cualquier dispositivo
- Touch-friendly para tablets

## 🎨 Interfaz de Usuario

- Diseño moderno y profesional
- Transiciones suaves y fluidas
- Iconos intuitivos
- Colores bien contrastados
- Accesible y fácil de usar
- Feedback visual en todas las acciones

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** - Framework principal
- **React Hooks** - Gestión de estado
- **Bootstrap 5** - Framework CSS
- **React Bootstrap** - Componentes UI
- **React Icons** - Iconografía

### Backend & Base de Datos
- **Firebase Authentication** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Hosting** - (Opcional para deploy)

### Librerías Especiales
- **Html5-qrcode** - Escaneo de códigos de barras
- **Recharts** - Gráficos interactivos
- **jsPDF** - Generación de reportes PDF
- **jsPDF-AutoTable** - Tablas en PDFs

## 📦 Instalación

### Prerrequisitos
- Node.js (v14 o superior)
- npm o yarn
- Cuenta de Firebase

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/inventario-bar.git
cd inventario-bar
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
```

3. **Configurar Firebase**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Authentication (Email/Password)
   - Crea una base de datos Firestore
   - Copia las credenciales de configuración

4. **Configurar variables de entorno**
   
Crea un archivo `src/firebase.js` con tu configuración:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

5. **Iniciar la aplicación**
```bash
npm start
# o
yarn start
```

6. **Abrir en el navegador**
   - La app se abrirá automáticamente en `http://localhost:3000`

## 🔐 Configuración de Firestore

### Colecciones necesarias:
- `inventario` - Productos del inventario
- `users` - Usuarios del sistema
- `providers` - Proveedores
- `historial` - Registro de cambios

### Reglas de seguridad sugeridas:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /inventario/{itemId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /providers/{providerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /historial/{historyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## 📖 Uso del Sistema

### Primer Uso
1. Crear un usuario administrador manualmente en Firebase Authentication
2. Agregar el rol de admin en la colección `users`
3. Iniciar sesión con ese usuario
4. Agregar proveedores
5. Comenzar a agregar productos

### Gestión de Productos
- Click en "Agregar Producto" para crear nuevos productos
- Usa el escáner de códigos para asignar códigos de barras
- Actualiza el stock directamente desde la tabla
- Marca productos importantes con la estrella

### Reportes
- Accede al menú "Reportes PDF"
- Selecciona el tipo de reporte que necesitas
- El PDF se generará y descargará automáticamente

## 🚀 Deploy

### Deploy en Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login a Firebase
firebase login

# Inicializar Firebase
firebase init

# Build de producción
npm run build

# Deploy
firebase deploy
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Changelog

### [1.0.0] - 2025-01-XX
- 🎉 Release inicial
- ✅ Sistema completo de inventario
- ✅ Modo oscuro profesional
- ✅ Escaneo de códigos de barras
- ✅ Reportes PDF
- ✅ Sistema de usuarios
- ✅ Estadísticas y gráficos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👤 Autor

Wilfred Del Pozo - [[@wilfredwil](https://github.com/wilfredwil)
Link del Proyecto: (https://github.com/wilfredwil/inventario-bar)
## 🙏 Agradecimientos

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Recharts](https://recharts.org/)
- [Html5-qrcode](https://github.com/mebjas/html5-qrcode)

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!
