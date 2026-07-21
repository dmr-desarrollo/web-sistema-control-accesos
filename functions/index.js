const {setGlobalOptions} = require("firebase-functions/v2");
const {onCall, HttpsError} = require("firebase-functions/v2/https");

const {
  initializeApp,
} = require("firebase-admin/app");

const {
  getAuth,
} = require("firebase-admin/auth");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();

setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

const ROLES_PERMITIDOS = [
  "admin_empresa",
  "operador",
];

/**
 * Crea de forma segura un usuario en:
 *
 * 1. Firebase Authentication
 * 2. Firestore: usuarios/{uid}
 *
 * Puede ejecutarla:
 *
 * - superadmin
 * - admin_empresa
 */
exports.crearUsuarioAdministrado = onCall(
    async (request) => {
      /*
       * 1. Comprobar que quien llama
       * tiene una sesión válida.
       */
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "Debes iniciar sesión para crear usuarios.",
        );
      }

      const uidSolicitante = request.auth.uid;
      const db = getFirestore();

      /*
       * 2. Leer el perfil del administrador
       * que está intentando crear el usuario.
       */
      const perfilSolicitanteRef = db
          .collection("usuarios")
          .doc(uidSolicitante);

      const perfilSolicitanteDoc =
        await perfilSolicitanteRef.get();

      if (!perfilSolicitanteDoc.exists) {
        throw new HttpsError(
            "permission-denied",
            "El usuario conectado no tiene perfil administrativo.",
        );
      }

      const perfilSolicitante =
        perfilSolicitanteDoc.data();

      if (perfilSolicitante.estado !== "activo") {
        throw new HttpsError(
            "permission-denied",
            "La cuenta del administrador no está activa.",
        );
      }

      const esSuperadmin =
        perfilSolicitante.rol === "superadmin";

      const esAdminEmpresa =
        perfilSolicitante.rol === "admin_empresa";

      if (!esSuperadmin && !esAdminEmpresa) {
        throw new HttpsError(
            "permission-denied",
            "No tienes autorización para crear usuarios.",
        );
      }

      /*
       * 3. Obtener los datos enviados
       * por la aplicación web.
       */
      const datos = request.data || {};

      const nombre =
        String(datos.nombre || "").trim();

      const apellido =
        String(datos.apellido || "").trim();

      const email =
        String(datos.email || "")
            .trim()
            .toLowerCase();

      const password =
        String(datos.password || "");

      const rol =
        String(datos.rol || "").trim();

      let empresaId =
        String(datos.empresaId || "").trim();

      /*
       * 4. Validaciones básicas.
       */
      if (!nombre) {
        throw new HttpsError(
            "invalid-argument",
            "El nombre es obligatorio.",
        );
      }

      if (!email) {
        throw new HttpsError(
            "invalid-argument",
            "El correo electrónico es obligatorio.",
        );
      }

      if (!password || password.length < 6) {
        throw new HttpsError(
            "invalid-argument",
            "La contraseña temporal debe tener al menos 6 caracteres.",
        );
      }

      if (!ROLES_PERMITIDOS.includes(rol)) {
        throw new HttpsError(
            "invalid-argument",
            "El rol seleccionado no es válido.",
        );
      }

      /*
       * 5. Un administrador de empresa
       * solamente puede crear usuarios
       * dentro de su propia empresa.
       */
      if (esAdminEmpresa) {
        empresaId =
          String(
              perfilSolicitante.empresaId || "",
          ).trim();

        if (!empresaId) {
          throw new HttpsError(
              "failed-precondition",
              "El administrador no tiene una empresa asignada.",
          );
        }
      }

      if (!empresaId) {
        throw new HttpsError(
            "invalid-argument",
            "Debes seleccionar una empresa.",
        );
      }

      /*
       * 6. Verificar que la empresa exista
       * y esté activa.
       */
      const empresaRef = db
          .collection("empresas")
          .doc(empresaId);

      const empresaDoc = await empresaRef.get();

      if (!empresaDoc.exists) {
        throw new HttpsError(
            "not-found",
            "La empresa seleccionada no existe.",
        );
      }

      const empresa = empresaDoc.data();

      if (empresa.activa !== true) {
        throw new HttpsError(
            "failed-precondition",
            "La empresa seleccionada está inactiva.",
        );
      }

      let usuarioCreado = null;

      try {
        /*
         * 7. Crear la cuenta en
         * Firebase Authentication.
         */
        usuarioCreado =
          await getAuth().createUser({
            email,
            password,
            displayName:
              `${nombre} ${apellido}`.trim(),
            disabled: false,
          });

        /*
         * 8. Crear el perfil empresarial
         * en Firestore.
         */
        await db
            .collection("usuarios")
            .doc(usuarioCreado.uid)
            .set({
              nombre,
              apellido,
              email,
              rol,
              empresaId,
              estado: "activo",
              fechaCreacion:
                FieldValue.serverTimestamp(),
              creadoPor: uidSolicitante,
              fechaActualizacion:
                FieldValue.serverTimestamp(),
              actualizadoPor: uidSolicitante,
            });

        return {
          ok: true,
          uid: usuarioCreado.uid,
          nombre,
          apellido,
          email,
          rol,
          empresaId,
          estado: "activo",
        };
      } catch (error) {
        /*
         * 9. Si se creó Authentication,
         * pero falló Firestore, eliminamos
         * la cuenta para no dejar datos
         * incompletos.
         */
        if (usuarioCreado) {
          try {
            await getAuth()
                .deleteUser(usuarioCreado.uid);
          } catch (rollbackError) {
            console.error(
                "No se pudo revertir el usuario:",
                rollbackError,
            );
          }
        }

        console.error(
            "Error creando usuario:",
            error,
        );

        if (
          error.code ===
          "auth/email-already-exists"
        ) {
          throw new HttpsError(
              "already-exists",
              "Ya existe una cuenta con ese correo.",
          );
        }

        if (
          error.code ===
          "auth/invalid-email"
        ) {
          throw new HttpsError(
              "invalid-argument",
              "El correo electrónico no es válido.",
          );
        }

        if (
          error.code ===
          "auth/invalid-password"
        ) {
          throw new HttpsError(
              "invalid-argument",
              "La contraseña temporal no es válida.",
          );
        }

        throw new HttpsError(
            "internal",
            "No fue posible crear el usuario.",
        );
      }
    },
);

/**
 * Actualiza de forma segura un usuario existente en:
 *
 * 1. Firebase Authentication
 * 2. Firestore: usuarios/{uid}
 *
 * Puede ejecutarla:
 *
 * - superadmin
 * - admin_empresa
 */
exports.actualizarUsuarioAdministrado = onCall(
    async (request) => {
      /*
       * 1. Comprobar que quien llama
       * tiene una sesión válida.
       */
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "Debes iniciar sesión para editar usuarios.",
        );
      }

      const uidSolicitante = request.auth.uid;
      const db = getFirestore();

      /*
       * 2. Leer el perfil del administrador.
       */
      const perfilSolicitanteDoc = await db
          .collection("usuarios")
          .doc(uidSolicitante)
          .get();

      if (!perfilSolicitanteDoc.exists) {
        throw new HttpsError(
            "permission-denied",
            "El usuario conectado no tiene perfil administrativo.",
        );
      }

      const perfilSolicitante =
        perfilSolicitanteDoc.data();

      if (perfilSolicitante.estado !== "activo") {
        throw new HttpsError(
            "permission-denied",
            "La cuenta del administrador no está activa.",
        );
      }

      const esSuperadmin =
        perfilSolicitante.rol === "superadmin";

      const esAdminEmpresa =
        perfilSolicitante.rol === "admin_empresa";

      if (!esSuperadmin && !esAdminEmpresa) {
        throw new HttpsError(
            "permission-denied",
            "No tienes autorización para editar usuarios.",
        );
      }

      /*
       * 3. Obtener los datos enviados
       * por la aplicación web.
       */
      const datos = request.data || {};

      const uidUsuario =
        String(datos.uid || "").trim();

      const nombre =
        String(datos.nombre || "").trim();

      const apellido =
        String(datos.apellido || "").trim();

      const email =
        String(datos.email || "")
            .trim()
            .toLowerCase();

      const rol =
        String(datos.rol || "").trim();

      let empresaId =
        String(datos.empresaId || "").trim();

      /*
       * 4. Validaciones básicas.
       */
      if (!uidUsuario) {
        throw new HttpsError(
            "invalid-argument",
            "No se recibió el usuario que se desea editar.",
        );
      }

      if (!nombre) {
        throw new HttpsError(
            "invalid-argument",
            "El nombre es obligatorio.",
        );
      }

      if (!email) {
        throw new HttpsError(
            "invalid-argument",
            "El correo electrónico es obligatorio.",
        );
      }

      if (!ROLES_PERMITIDOS.includes(rol)) {
        throw new HttpsError(
            "invalid-argument",
            "El rol seleccionado no es válido.",
        );
      }

      /*
       * 5. Leer el perfil que será editado.
       */
      const usuarioRef = db
          .collection("usuarios")
          .doc(uidUsuario);

      const usuarioDoc = await usuarioRef.get();

      if (!usuarioDoc.exists) {
        throw new HttpsError(
            "not-found",
            "El usuario seleccionado no existe.",
        );
      }

      const usuarioActual = usuarioDoc.data();

      /*
       * El administrador global no se modifica
       * desde el módulo normal de usuarios.
       */
      if (usuarioActual.rol === "superadmin") {
        throw new HttpsError(
            "permission-denied",
            "El administrador global no puede editarse desde este módulo.",
        );
      }

      /*
       * 6. Un administrador de empresa solamente
       * puede editar usuarios de su propia empresa.
       */
      if (esAdminEmpresa) {
        const empresaAdministrador =
          String(
              perfilSolicitante.empresaId || "",
          ).trim();

        if (!empresaAdministrador) {
          throw new HttpsError(
              "failed-precondition",
              "El administrador no tiene una empresa asignada.",
          );
        }

        if (
          usuarioActual.empresaId !==
          empresaAdministrador
        ) {
          throw new HttpsError(
              "permission-denied",
              "No puedes editar usuarios de otra empresa.",
          );
        }

        empresaId = empresaAdministrador;
      }

      if (!empresaId) {
        throw new HttpsError(
            "invalid-argument",
            "Debes seleccionar una empresa.",
        );
      }

      /*
       * 7. Verificar que la empresa exista
       * y esté activa.
       */
      const empresaDoc = await db
          .collection("empresas")
          .doc(empresaId)
          .get();

      if (!empresaDoc.exists) {
        throw new HttpsError(
            "not-found",
            "La empresa seleccionada no existe.",
        );
      }

      const empresa = empresaDoc.data();

      if (empresa.activa !== true) {
        throw new HttpsError(
            "failed-precondition",
            "La empresa seleccionada está inactiva.",
        );
      }

      /*
       * 8. Guardar los datos anteriores de
       * Authentication para poder revertirlos.
       */
      const usuarioAuthAnterior =
        await getAuth().getUser(uidUsuario);

      const emailAnterior =
        usuarioAuthAnterior.email || "";

      const nombreAnterior =
        usuarioAuthAnterior.displayName || "";

      let authenticationActualizado = false;

      try {
        /*
         * 9. Actualizar Firebase Authentication.
         */
        await getAuth().updateUser(
            uidUsuario,
            {
              email,
              displayName:
                `${nombre} ${apellido}`.trim(),
            },
        );

        authenticationActualizado = true;

        /*
         * 10. Actualizar el perfil en Firestore.
         */
        await usuarioRef.update({
          nombre,
          apellido,
          email,
          rol,
          empresaId,
          fechaActualizacion:
            FieldValue.serverTimestamp(),
          actualizadoPor: uidSolicitante,
        });

        return {
          ok: true,
          uid: uidUsuario,
          nombre,
          apellido,
          email,
          rol,
          empresaId,
          estado:
            usuarioActual.estado || "activo",
        };
      } catch (error) {
        /*
         * 11. Si Authentication fue actualizado,
         * pero Firestore falló, restauramos
         * los valores anteriores.
         */
        if (authenticationActualizado) {
          try {
            await getAuth().updateUser(
                uidUsuario,
                {
                  email: emailAnterior,
                  displayName: nombreAnterior,
                },
            );
          } catch (rollbackError) {
            console.error(
                "No se pudo revertir Authentication:",
                rollbackError,
            );
          }
        }

        console.error(
            "Error actualizando usuario:",
            error,
        );

        if (
          error.code ===
          "auth/email-already-exists"
        ) {
          throw new HttpsError(
              "already-exists",
              "Ya existe una cuenta con ese correo.",
          );
        }

        if (
          error.code ===
          "auth/invalid-email"
        ) {
          throw new HttpsError(
              "invalid-argument",
              "El correo electrónico no es válido.",
          );
        }

        if (error instanceof HttpsError) {
          throw error;
        }

        throw new HttpsError(
            "internal",
            "No fue posible actualizar el usuario.",
        );
      }
    },
);

/**
 * Activa o desactiva de forma segura
 * un usuario existente.
 *
 * Actualiza:
 *
 * 1. Firebase Authentication
 * 2. Firestore: usuarios/{uid}
 */
exports.cambiarEstadoUsuarioAdministrado = onCall(
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "Debes iniciar sesión para cambiar el estado de un usuario.",
        );
      }

      const uidSolicitante = request.auth.uid;
      const db = getFirestore();

      const perfilSolicitanteDoc = await db
          .collection("usuarios")
          .doc(uidSolicitante)
          .get();

      if (!perfilSolicitanteDoc.exists) {
        throw new HttpsError(
            "permission-denied",
            "El usuario conectado no tiene perfil administrativo.",
        );
      }

      const perfilSolicitante =
        perfilSolicitanteDoc.data();

      if (perfilSolicitante.estado !== "activo") {
        throw new HttpsError(
            "permission-denied",
            "La cuenta del administrador no está activa.",
        );
      }

      const esSuperadmin =
        perfilSolicitante.rol === "superadmin";

      const esAdminEmpresa =
        perfilSolicitante.rol === "admin_empresa";

      if (!esSuperadmin && !esAdminEmpresa) {
        throw new HttpsError(
            "permission-denied",
            "No tienes autorización para cambiar el estado de usuarios.",
        );
      }

      const datos = request.data || {};

      const uidUsuario =
        String(datos.uid || "").trim();

      const nuevoEstado =
        String(datos.estado || "").trim();

      if (!uidUsuario) {
        throw new HttpsError(
            "invalid-argument",
            "No se recibió el usuario.",
        );
      }

      if (
        nuevoEstado !== "activo" &&
        nuevoEstado !== "inactivo"
      ) {
        throw new HttpsError(
            "invalid-argument",
            "El estado seleccionado no es válido.",
        );
      }

      if (uidUsuario === uidSolicitante) {
        throw new HttpsError(
            "failed-precondition",
            "No puedes desactivar tu propia cuenta.",
        );
      }

      const usuarioRef = db
          .collection("usuarios")
          .doc(uidUsuario);

      const usuarioDoc = await usuarioRef.get();

      if (!usuarioDoc.exists) {
        throw new HttpsError(
            "not-found",
            "El usuario seleccionado no existe.",
        );
      }

      const usuarioActual = usuarioDoc.data();

      if (usuarioActual.rol === "superadmin") {
        throw new HttpsError(
            "permission-denied",
            "El administrador global no puede desactivarse desde este módulo.",
        );
      }

      if (esAdminEmpresa) {
        const empresaAdministrador =
          String(
              perfilSolicitante.empresaId || "",
          ).trim();

        if (!empresaAdministrador) {
          throw new HttpsError(
              "failed-precondition",
              "El administrador no tiene una empresa asignada.",
          );
        }

        if (
          usuarioActual.empresaId !==
          empresaAdministrador
        ) {
          throw new HttpsError(
              "permission-denied",
              "No puedes modificar usuarios de otra empresa.",
          );
        }

        if (
          usuarioActual.rol === "admin_empresa"
        ) {
          throw new HttpsError(
              "permission-denied",
              "Un administrador de empresa no puede " +
              "desactivar a otro administrador.",
          );
        }
      }

      const deshabilitar =
        nuevoEstado === "inactivo";

      const estadoAnterior =
        usuarioActual.estado || "activo";

      let authenticationActualizado = false;

      try {
        await getAuth().updateUser(
            uidUsuario,
            {
              disabled: deshabilitar,
            },
        );

        authenticationActualizado = true;

        await usuarioRef.update({
          estado: nuevoEstado,
          fechaActualizacion:
            FieldValue.serverTimestamp(),
          actualizadoPor: uidSolicitante,
        });

        return {
          ok: true,
          uid: uidUsuario,
          estado: nuevoEstado,
          disabled: deshabilitar,
        };
      } catch (error) {
        if (authenticationActualizado) {
          try {
            await getAuth().updateUser(
                uidUsuario,
                {
                  disabled:
                    estadoAnterior === "inactivo",
                },
            );
          } catch (rollbackError) {
            console.error(
                "No se pudo revertir el estado " +
                "en Authentication:",
                rollbackError,
            );
          }
        }

        console.error(
            "Error cambiando estado del usuario:",
            error,
        );

        if (
          error.code ===
          "auth/user-not-found"
        ) {
          throw new HttpsError(
              "not-found",
              "La cuenta no existe en " +
              "Firebase Authentication.",
          );
        }

        if (error instanceof HttpsError) {
          throw error;
        }

        throw new HttpsError(
            "internal",
            "No fue posible cambiar el estado del usuario.",
        );
      }
    },
);

/**
 * Cambia de forma segura la contraseña temporal
 * de un usuario existente.
 *
 * Actualiza únicamente Firebase Authentication.
 */
exports.cambiarPasswordTemporalAdministrado = onCall(
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "Debes iniciar sesión para cambiar contraseñas.",
        );
      }

      const uidSolicitante = request.auth.uid;
      const db = getFirestore();

      const perfilSolicitanteDoc = await db
          .collection("usuarios")
          .doc(uidSolicitante)
          .get();

      if (!perfilSolicitanteDoc.exists) {
        throw new HttpsError(
            "permission-denied",
            "El usuario conectado no tiene perfil administrativo.",
        );
      }

      const perfilSolicitante =
        perfilSolicitanteDoc.data();

      if (perfilSolicitante.estado !== "activo") {
        throw new HttpsError(
            "permission-denied",
            "La cuenta del administrador no está activa.",
        );
      }

      const esSuperadmin =
        perfilSolicitante.rol === "superadmin";

      const esAdminEmpresa =
        perfilSolicitante.rol === "admin_empresa";

      if (!esSuperadmin && !esAdminEmpresa) {
        throw new HttpsError(
            "permission-denied",
            "No tienes autorización para cambiar contraseñas.",
        );
      }

      const datos = request.data || {};

      const uidUsuario =
        String(datos.uid || "").trim();

      const password =
        String(datos.password || "");

      if (!uidUsuario) {
        throw new HttpsError(
            "invalid-argument",
            "No se recibió el usuario.",
        );
      }

      if (!password || password.length < 6) {
        throw new HttpsError(
            "invalid-argument",
            "La contraseña temporal debe tener al menos 6 caracteres.",
        );
      }

      const usuarioRef = db
          .collection("usuarios")
          .doc(uidUsuario);

      const usuarioDoc = await usuarioRef.get();

      if (!usuarioDoc.exists) {
        throw new HttpsError(
            "not-found",
            "El usuario seleccionado no existe.",
        );
      }

      const usuarioActual = usuarioDoc.data();

      if (usuarioActual.rol === "superadmin") {
        throw new HttpsError(
            "permission-denied",
            "La contraseña del administrador global " +
            "no puede cambiarse desde este módulo.",
        );
      }

      if (esAdminEmpresa) {
        const empresaAdministrador =
          String(
              perfilSolicitante.empresaId || "",
          ).trim();

        if (!empresaAdministrador) {
          throw new HttpsError(
              "failed-precondition",
              "El administrador no tiene una empresa asignada.",
          );
        }

        if (
          usuarioActual.empresaId !==
          empresaAdministrador
        ) {
          throw new HttpsError(
              "permission-denied",
              "No puedes modificar usuarios de otra empresa.",
          );
        }

        if (
          usuarioActual.rol === "admin_empresa"
        ) {
          throw new HttpsError(
              "permission-denied",
              "Un administrador de empresa no puede " +
              "cambiar la contraseña de otro administrador.",
          );
        }
      }

      try {
        await getAuth().updateUser(
            uidUsuario,
            {
              password,
            },
        );

        await usuarioRef.update({
          fechaActualizacion:
            FieldValue.serverTimestamp(),
          actualizadoPor: uidSolicitante,
          passwordActualizado:
            FieldValue.serverTimestamp(),
        });

        return {
          ok: true,
          uid: uidUsuario,
        };
      } catch (error) {
        console.error(
            "Error cambiando contraseña:",
            error,
        );

        if (
          error.code ===
          "auth/user-not-found"
        ) {
          throw new HttpsError(
              "not-found",
              "La cuenta no existe en Firebase Authentication.",
          );
        }

        if (
          error.code ===
          "auth/invalid-password"
        ) {
          throw new HttpsError(
              "invalid-argument",
              "La contraseña temporal no es válida.",
          );
        }

        if (error instanceof HttpsError) {
          throw error;
        }

        throw new HttpsError(
            "internal",
            "No fue posible cambiar la contraseña.",
        );
      }
    },
);
