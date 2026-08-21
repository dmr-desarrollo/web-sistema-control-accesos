const ETIQUETAS_ROL = {
  superadmin: 'Administrador global',
  admin_empresa: 'Administrador de empresa',
  operador: 'Operador'
};

function obtenerNombreEmpresa(
  empresaId,
  empresas
) {
  const empresa = empresas.find(
    (item) => item.id === empresaId
  );

  return (
    empresa?.nombre ||
    empresaId ||
    'Sin empresa'
  );
}

function UsuarioTable({
  usuarios,
  empresas,
  usuarioActualUid,
  rolActual,
  onEditar,
  onCambiarEstado,
  onCambiarPassword,
  usuarioProcesando
}) {
  if (usuarios.length === 0) {
    return (
      <div className="admin-sin-datos">
        <h2>No hay usuarios registrados</h2>

        <p>
          Pulsa “Nuevo usuario” para crear
          el primero.
        </p>
      </div>
    );
  }

  return (
    <section className="tabla-contenedor">
      <table className="tabla-admin">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Empresa</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {usuarios.map((usuario) => {
            const nombreCompleto = [
              usuario.nombre,
              usuario.apellido
            ]
              .filter(Boolean)
              .join(' ');

            const estaActivo =
              usuario.estado === 'activo';

            const esSuperadmin =
              usuario.rol === 'superadmin';

            const esPropioUsuario =
              usuario.uid === usuarioActualUid;

            const esCuentaAdministradoraPropia =
              esPropioUsuario &&
              rolActual === 'admin_empresa';

            const protegido =
              esSuperadmin ||
              esCuentaAdministradoraPropia;

            const procesando =
              usuarioProcesando ===
              usuario.uid;

            return (
              <tr key={usuario.uid}>
                <td>
                  <strong>
                    {nombreCompleto ||
                      'Sin nombre'}
                  </strong>
                </td>

                <td>
                  {usuario.email ||
                    'Sin correo'}
                </td>

                <td>
                  {obtenerNombreEmpresa(
                    usuario.empresaId,
                    empresas
                  )}
                </td>

                <td>
                  {ETIQUETAS_ROL[
                    usuario.rol
                  ] ||
                    usuario.rol ||
                    'Sin rol'}
                </td>

                <td>
                  <span
                    className={
                      estaActivo
                        ? 'estado-activo'
                        : 'estado-inactivo'
                    }
                  >
                    {estaActivo
                      ? 'Activo'
                      : 'Inactivo'}
                  </span>
                </td>

                <td>
                  <div className="acciones-usuario">
                    {protegido ? (
                      <span className="usuario-protegido">
                        {esCuentaAdministradoraPropia
                          ? 'Cuenta administradora'
                          : 'Protegido'}
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onEditar(usuario)
                          }
                          disabled={procesando}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onCambiarPassword(
                              usuario
                            )
                          }
                          disabled={procesando}
                        >
                          Contraseña
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onCambiarEstado(
                              usuario
                            )
                          }
                          disabled={procesando}
                        >
                          {procesando
                            ? 'Procesando...'
                            : estaActivo
                              ? 'Desactivar'
                              : 'Activar'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default UsuarioTable;
