function ListaVisitables({
  visitables,
  onEditar,
  onCambiarEstado,
  visitableProcesando
}) {
  if (visitables.length === 0) {
    return (
      <div className="admin-sin-datos">
        <h2>
          No hay personas visitables
        </h2>

        <p>
          Registra una nueva persona o cambia
          los filtros seleccionados.
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
            <th>Apellido</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {visitables.map((visitable) => {
            const estado =
              visitable.estado || 'activo';

            const estaActivo =
              estado === 'activo';

            const procesando =
              visitableProcesando ===
              visitable.id;

            return (
              <tr key={visitable.id}>
                <td>
                  <strong>
                    {visitable.nombre ||
                      'Sin nombre'}
                  </strong>
                </td>

                <td>
                  {visitable.apellido || ''}
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
                    <button
                      type="button"
                      onClick={() =>
                        onEditar(visitable)
                      }
                      disabled={procesando}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onCambiarEstado(
                          visitable
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

export default ListaVisitables;
