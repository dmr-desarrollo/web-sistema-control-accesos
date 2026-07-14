# Plan de Implementación - App Web (Administrador)

## Stack Tecnológico

- **Frontend**: React (SPA)
- **Base de datos**: Cloud Firestore
- **Autenticación**: Firebase Authentication
- **Alojamiento**: Firebase Hosting
- **Testing**: Jest + React Testing Library + Cypress

---

## Estructura del Proyecto

```
web/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── visitables/
│   │   └── visitas/
│   ├── pages/
│   ├── services/
│   │   ├── firebase.js
│   │   ├── auth.js
│   │   ├── visitables.js
│   │   └── visitas.js
│   ├── hooks/
│   └── __tests__/
├── cypress/
├── firebase.json
├── firestore.rules
└── firestore.indexes.json
```

---

## Modelo de Datos en Firestore

```
personasVisitable/{id}
  - nombre: string
  - apellido: string
  - organizacionId: string

visitas/{id}
  - visitanteNombre: string
  - visitanteApellido: string
  - visitanteCedula: string
  - visitanteFechaNacimiento: string
  - personaVisitableId: string
  - personaVisitableNombre: string (denormalizado)
  - fecha: timestamp
  - organizacionId: string
```

---

## Fase 1: Configuración Inicial

### Paso 1.1: Crear proyecto Firebase
- Crear proyecto en Firebase Console
- Habilitar Authentication (email/password)
- Habilitar Cloud Firestore
- Crear usuario administrador en Authentication Console

### Paso 1.2: Configurar proyecto React
- Crear proyecto con Create React App o Vite
- Instalar Firebase SDK
- Configurar firebase.js con credenciales
- Configurar Firebase Hosting

### Paso 1.3: Configurar Testing
- Instalar Jest + React Testing Library
- Configurar emuladores de Firebase para tests
- Instalar Cypress para tests E2E

### Paso 1.4: Reglas de Firestore
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /personasVisitable/{docId} {
      allow read, write: if request.auth != null;
    }
    match /visitas/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Fase 2: Autenticación (RF-002)

### TDD - Login de Administrador

**Paso 2.1: Test que FALLA**
```javascript
// src/__tests__/auth.test.js
test('debería renderizar formulario de login', () => {
  render(<LoginPage />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
});
```

**Paso 2.2: Implementar mínimo para que falle**
- Crear componente LoginPage con formulario básico
- Test que falla (falta conexión a Firebase)

**Paso 2.3: Test de servicio que FALLA**
```javascript
test('debería iniciar sesión con credenciales válidas', async () => {
  const user = await loginWithEmailAndPassword('admin@test.com', 'password123');
  expect(user).toBeDefined();
  expect(user.email).toBe('admin@test.com');
});
```

**Paso 2.4: Implementar servicio de autenticación**
```javascript
// src/services/auth.js
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export const loginWithEmailAndPassword = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};
```
- Test que passa

**Paso 2.5: Test de protección de rutas que FALLA**
```javascript
test('debería redirigir al login si no está autenticado', () => {
  render(
    <MemoryRouter>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </MemoryRouter>
  );
  expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument();
});
```

**Paso 2.6: Implementar ProtectedRoute**
- Crear componente ProtectedRoute
- Verificar estado de autenticación
- Redirigir a login si no autenticado
- Test que passa

---

## Fase 3: Gestión de Personas Visitables (RF-003)

### TDD - CRUD Completo

**Paso 3.1: Test servicio CREATE que FALLA**
```javascript
test('debería crear una persona visitable', async () => {
  const id = await crearPersonaVisitable({ nombre: 'Juan', apellido: 'Pérez' });
  expect(id).toBeDefined();
});
```

**Paso 3.2: Implementar servicio CREATE**
```javascript
// src/services/visitables.js
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export const crearPersonaVisitable = async (datos) => {
  const docRef = await addDoc(collection(db, 'personasVisitable'), {
    ...datos,
    organizacionId: 'organizacion-1'
  });
  return docRef.id;
};
```
- Test que passa

**Paso 3.3: Test servicio READ que FALLA**
```javascript
test('debería obtener lista de personas visitables', async () => {
  const visitables = await obtenerPersonasVisitables();
  expect(Array.isArray(visitables)).toBe(true);
});
```

**Paso 3.4: Implementar servicio READ**
```javascript
export const obtenerPersonasVisitables = async () => {
  const snapshot = await getDocs(collection(db, 'personasVisitable'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```
- Test que passa

**Paso 3.5: Test servicio UPDATE que FALLA**
```javascript
test('debería actualizar una persona visitable', async () => {
  await actualizarPersonaVisitable('id-test', { nombre: 'Juan Actualizado' });
  // Verificar actualización
});
```

**Paso 3.6: Implementar servicio UPDATE**
```javascript
export const actualizarPersonaVisitable = async (id, datos) => {
  const docRef = doc(db, 'personasVisitable', id);
  await updateDoc(docRef, datos);
};
```
- Test que passa

**Paso 3.7: Test servicio DELETE que FALLA**
```javascript
test('debería eliminar una persona visitable', async () => {
  await eliminarPersonaVisitable('id-test');
  // Verificar eliminación
});
```

**Paso 3.8: Implementar servicio DELETE**
```javascript
export const eliminarPersonaVisitable = async (id) => {
  await deleteDoc(doc(db, 'personasVisitable', id));
};
```
- Test que passa

**Paso 3.9: Test componente Lista que FALLA**
```javascript
test('debería renderizar lista de personas visitables', async () => {
  render(<ListaVisitables />);
  expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
});
```

**Paso 3.10: Implementar componente Lista**
- Crear componente ListaVisitables
- Conectar con servicio de Firestore
- Implementar eliminación con confirmación
- Test que passa

**Paso 3.11: Test componente Formulario que FALLA**
```javascript
test('debería renderizar formulario de creación', () => {
  render(<FormularioVisitable />);
  expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
});
```

**Paso 3.12: Implementar componente Formulario**
- Crear formulario para crear/editar
- Validación de campos
- Conexión con servicios
- Test que passa

---

## Fase 4: Historial de Visitas (RF-004)

### TDD - Consulta y Detalle

**Paso 4.1: Test servicio listado que FALLA**
```javascript
test('debería obtener historial de visitas', async () => {
  const visitas = await obtenerVisitas();
  expect(Array.isArray(visitas)).toBe(true);
});
```

**Paso 4.2: Implementar servicio listado**
```javascript
// src/services/visitas.js
export const obtenerVisitas = async () => {
  const snapshot = await getDocs(
    query(collection(db, 'visitas'), orderBy('fecha', 'desc'))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```
- Test que passa

**Paso 4.3: Test servicio filtro que FALLA**
```javascript
test('debería filtrar visitas por fecha', async () => {
  const visitas = await obtenerVisitasPorFecha('2024-01-15');
  expect(visitas.length).toBeGreaterThan(0);
});
```

**Paso 4.4: Implementar filtros**
```javascript
export const obtenerVisitasPorFecha = async (fecha) => {
  const inicio = new Date(fecha);
  const fin = new Date(fecha);
  fin.setHours(23, 59, 59);
  
  const q = query(
    collection(db, 'visitas'),
    where('fecha', '>=', inicio),
    where('fecha', '<=', fin)
  );
  // ...
};
```
- Test que passa

**Paso 4.5: Test componente Historial que FALLA**
```javascript
test('debería renderizar historial de visitas', async () => {
  render(<HistorialVisitas />);
  expect(await screen.findByText(/visitas/i)).toBeInTheDocument();
});
```

**Paso 4.6: Implementar componente Historial**
- Crear tabla con lista de visitas
- Implementar filtros por fecha
- Paginación básica
- Test que passa

**Paso 4.7: Test componente Detalle que FALLA**
```javascript
test('debería mostrar detalle de una visita', async () => {
  render(<DetalleVisita visitaId="id-test" />);
  expect(await screen.findByText(/visitante/i)).toBeInTheDocument();
});
```

**Paso 4.8: Implementar componente Detalle**
- Crear vista de detalle de visita
- Mostrar todos los datos del visitante y visitable
- Test que passa

---

## Fase 5: Integración y Navegación

### TDD - Router y Layout

**Paso 5.1: Test Router que FALLA**
```javascript
test('debería navegar entre páginas', async () => {
  render(<App />);
  fireEvent.click(screen.getByText(/personas visitables/i));
  expect(screen.getByText(/crear/i)).toBeInTheDocument();
});
```

**Paso 5.2: Implementar Router**
- Configurar React Router
- Crear rutas: /login, /dashboard, /visitables, /visitas
- Implementar navegación
- Test que passa

**Paso 5.3: Test Layout que FALLA**
```javascript
test('debería mostrar menú de navegación', () => {
  render(<Layout><Dashboard /></Layout>);
  expect(screen.getByText(/cerrar sesión/i)).toBeInTheDocument();
});
```

**Paso 5.4: Implementar Layout**
- Crear componente Layout con menú
- Implementar cierre de sesión
- Test que passa

---

## Flujo TDD Resumido

```
1. Escribir test que FALLA
   ↓
2. Ejecutar test → VER FALLAR
   ↓
3. Escribir código mínimo
   ↓
4. Ejecutar test → VER PASAR
   ↓
5. Refactorizar
   ↓
6. Repetir
```

---

## Comandos de Testing

```bash
# Ejecutar todos los tests unitarios
npm test

# Ejecutar tests específicos
npm test -- auth.test.js

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests E2E con Cypress
npm run cypress:open

# Iniciar emuladores de Firebase (para tests)
firebase emulators:start
```

---

## Orden de Implementación Sugerido

1. Configuración inicial (Firebase + React)
2. Autenticación (login/logout)
3. ProtectedRoute
4. CRUD Personas visitables (servicios)
5. CRUD Personas visitables (componentes)
6. Consulta de visitas (servicios)
7. Consulta de visitas (componentes)
8. Navegación y Layout
9. Integración completa
10. Pruebas E2E

---

## Notas Importantes

- **MVP**: Una sola organización (organizacionId hardcodeado)
- **Primer admin**: Se crea desde Firebase Console
- **Cada test debe FALLAR antes de implementar**
- **Ejecutar tests manualmente para verificar**
- **Commit después de cada test que passa**
- **Usar emuladores de Firebase para tests locales**
