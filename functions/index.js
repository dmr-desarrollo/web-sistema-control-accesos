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
