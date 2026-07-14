CASO DE USO: UC-001 - Registrar Visita
=======================================

IDENTIFICACIÓN
--------------
Código: UC-001
Nombre: Registrar Visita
Requerimiento: RF-001
Actor principal: Portero

DESCRIPCIÓN
-----------
El portero registra la visita de una persona mediante el escaneo de su documento de identidad con el lector OCR.

PRECONDICIONES
--------------
1. La tablet está encendida y en modo kiosco
2. La aplicación está ejecutándose
3. El lector OCR está conectado y funcionando
4. Existe al menos una persona visitable registrada en el sistema

POSTCONDICIONES
---------------
1. La visita queda registrada en el sistema con fecha y hora automática
2. Se muestra mensaje de confirmación

FLUJO PRINCIPAL
---------------
1. El portero acerca el documento de identidad del visitante al lector OCR
2. El sistema captura automáticamente los datos del documento:
   - Nombre
   - Apellido
   - Número de cédula
   - Fecha de nacimiento
3. El sistema muestra los datos capturados en pantalla
4. El sistema muestra la lista de personas visitables disponibles
5. El portero selecciona a quién visita
6. El sistema registra la visita con:
   - Datos del visitante
   - Persona visitable seleccionada
   - Fecha y hora automática del sistema
7. El sistema muestra mensaje de confirmación: "Visita registrada correctamente"
8. El sistema vuelve al estado inicial

FLUJOS ALTERNATIVOS
-------------------

4a. El visitante ya tiene registro previo (misma cédula):
    4a.1. El sistema muestra los datos existentes del visitante
    4a.2. El flujo continúa desde el paso 5

5a. No hay personas visitables disponibles:
    5a.1. El sistema muestra mensaje: "No hay personas visitables disponibles"
    5a.2. El caso de uso termina sin registrar visita

EXCEPCIONES
-----------

E1. El lector OCR no puede leer el documento:
    1. El sistema muestra mensaje: "No se pudo leer el documento"
    2. El portero intenta nuevamente o cancela
    3. El caso de uso termina

E2. Error de conexión con la base de datos:
    1. El sistema muestra mensaje: "Error de conexión. Intente nuevamente"
    2. El caso de uso termina sin registrar visita

REGLAS DE NEGOCIO
-----------------
- RN-001: Un visitante se identifica por número de cédula (único)
- RN-002: La fecha y hora de visita se registran automáticamente del sistema
- RN-003: El portero no requiere autenticación (kiosco)

NOTAS
-----
- La aplicación funciona en modo kiosco, sin navegación ni menús
- El flujo es lineal y simple para uso rápido del portero
- Los datos del visitante se obtienen automáticamente del OCR
