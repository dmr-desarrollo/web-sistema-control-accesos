# Diseño de Colecciones Firebase - Sistema de Control de Visitas

## Estructura de Colecciones

### 1. personasVisitable

Almacena las personas que pueden ser visitadas en la organización.

```
personasVisitable/{id}
  ├── nombre: string
  ├── apellido: string
  ├── organizacionId: string
  └── activo: boolean
```

**Uso:** CRUD completo desde la app web por el administrador.

---

### 2. visitas

Registra cada visita realizada. Datos denormalizados para consultas rápidas.

```
visitas/{id}
  ├── visitanteNombre: string
  ├── visitanteApellido: string
  ├── visitanteCedula: string
  ├── visitanteFechaNacimiento: string
  ├── personaVisitableId: string
  ├── personaVisitableNombre: string
  ├── fecha: timestamp
  ├── organizacionId: string
  └── mesAnio: string
```

**Nota:** `mesAnio` tiene formato "AAAA-MM" (ej: "2026-06") para聚合 de reportes mensuales.

---

### 3. reportesMensuales (futuro)

Pre-calcula estadísticas mensuales para reportes.

```
reportesMensuales/{organizacionId-mesAnio}
  ├── organizacionId: string
  ├── mesAnio: string
  ├── totalVisitas: number
  ├── visitantesUnicos: number
  └── ultimaActualizacion: timestamp
```

---

## Índices Compuestos Requeridos

Crear en Firebase Console → Firestore → Índices:

| Colección | Campos | Orden |
|-----------|--------|-------|
| visitas | organizacionId | ASC |
| visitas | organizacionId, fecha | ASC, DESC |
| visitas | organizacionId, personaVisitableId, fecha | ASC, ASC, DESC |
| visitas | organizacionId, mesAnio | ASC, ASC |

---

## Consultas Optimizadas

| Consulta | Colección | Filtros | Índice necesario |
|----------|-----------|---------|------------------|
| Listar visitas por fecha | visitas | organizacionId + fecha | organizacionId, fecha |
| Filtrar por persona visitable | visitas | organizacionId + personaVisitableId + fecha | organizacionId, personaVisitableId, fecha |
| Reporte mensual | visitas | organizacionId + mesAnio | organizacionId, mesAnio |
| Total visitas del mes | reportesMensuales | organizacionId-mesAnio | Clave del documento |

---

## Reglas de Seguridad

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /personasVisitable/{docId} {
      allow read, write: if request.auth != null;
    }
    match /visitas/{docId} {
      allow read, write: if request.auth != null;
    }
    match /reportesMensuales/{docId} {
      allow read: if request.auth != null;
      allow write: if false; // Solo Cloud Functions
    }
  }
}
```
