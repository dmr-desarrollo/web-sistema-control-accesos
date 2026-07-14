# Control de Visitas - App Web

Aplicación web para el sistema de control de accesos.

## Tecnologías

- React + Vite
- Firebase (Authentication + Firestore + Hosting)
- Vitest + React Testing Library
- Cypress (E2E Testing)

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Copiar archivo de entorno:
```bash
cp .env.example .env
```

3. Configurar variables de entorno en `.env`

4. Ejecutar en modo desarrollo:
```bash
npm run dev
```

## Testing

```bash
# Ejecutar tests unitarios
npm test

# Ejecutar tests con UI
npm run test:ui

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests E2E
npm run cypress:open
```

## Deploy a Firebase

```bash
# Build
npm run build

# Deploy
firebase deploy
```
