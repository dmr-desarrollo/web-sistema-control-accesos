const ROLES_SUPERADMIN = [
  {
    valor: 'admin_empresa',
    etiqueta: 'Administrador de empresa'
  },
  {
    valor: 'operador',
    etiqueta: 'Operador'
  }
];

const ROLES_ADMIN_EMPRESA = [
  {
    valor: 'operador',
    etiqueta: 'Operador'
  }
];

function UsuarioForm({
  modo,
  formulario,
  empresas,
  guardando,
  empresaBloqueada,
  esAdminEmpresa = false,
  error,
  onChange,
  onSubmit,
  onCancelar
}) {
  const esEdicion =
    modo === 'editar';

  const rolesDisponibles =
    esAdminEmpresa
      ? ROLES_ADMIN_EMPRESA
      : ROLES_SUPERADMIN;

  const empresaSeleccionada =
    empresas.find(
      (empresa) =>
        empresa.id === formulario.empresaId
    );

  const nombreEmpresa =
    empresaSeleccionada?.nombre ||
    formulario.empresaId ||
    'Empresa no identificada';

  return (
    <form
      className="formulario-empresa"
      onSubmit={onSubmit}
    >
      {error && (
        <div className="error campo-completo">
          {error}
        </div>
      )}

      <div className="campo-formulario">
        <label htmlFor="nombre">
          Nombre
        </label>

        <input
          id="nombre"
          name="nombre"
          type="text"
          value={formulario.nombre}
          onChange={onChange}
          maxLength={80}
          autoComplete="given-name"
          disabled={guardando}
          required
        />
      </div>

      <div className="campo-formulario">
        <label htmlFor="apellido">
          Apellido
        </label>

        <input
          id="apellido"
          name="apellido"
          type="text"
          value={formulario.apellido}
          onChange={onChange}
          maxLength={80}
          autoComplete="family-name"
          disabled={guardando}
        />
      </div>

      <div className="campo-formulario campo-completo">
        <label htmlFor="email">
          Correo electrónico
        </label>

        <input
          id="email"
          name="email"
          type="email"
          value={formulario.email}
          onChange={onChange}
          maxLength={150}
          autoComplete="email"
          disabled={guardando}
          required
        />
      </div>

      {!esEdicion && (
        <div className="campo-formulario campo-completo">
          <label htmlFor="password">
            Contraseña temporal
          </label>

          <input
            id="password"
            name="password"
            type="password"
            value={formulario.password}
            onChange={onChange}
            minLength={6}
            autoComplete="new-password"
            disabled={guardando}
            required
          />

          <small>
            Debe contener al menos 6 caracteres.
          </small>
        </div>
      )}

      <div className="campo-formulario">
        <label htmlFor="empresaId">
          Empresa
        </label>

        {empresaBloqueada ? (
          <>
            <input
              id="empresaId-visible"
              type="text"
              value={nombreEmpresa}
              disabled
              readOnly
            />

            <input
              type="hidden"
              name="empresaId"
              value={formulario.empresaId}
            />

            <small>
              Esta empresa está asociada a tu
              perfil y no puede modificarse.
            </small>
          </>
        ) : (
          <select
            id="empresaId"
            name="empresaId"
            value={formulario.empresaId}
            onChange={onChange}
            disabled={guardando}
            required
          >
            <option value="">
              Seleccionar empresa
            </option>

            {empresas.map((empresa) => (
              <option
                key={empresa.id}
                value={empresa.id}
              >
                {empresa.nombre ||
                  empresa.id}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="campo-formulario">
        <label htmlFor="rol">
          Rol
        </label>

        <select
          id="rol"
          name="rol"
          value={
            esAdminEmpresa
              ? 'operador'
              : formulario.rol
          }
          onChange={onChange}
          disabled={
            guardando ||
            esAdminEmpresa
          }
          required
        >
          {rolesDisponibles.map((rol) => (
            <option
              key={rol.valor}
              value={rol.valor}
            >
              {rol.etiqueta}
            </option>
          ))}
        </select>

        {esAdminEmpresa && (
          <small>
            Un administrador de empresa solo
            puede administrar operadores de su
            propia empresa.
          </small>
        )}
      </div>

      <div className="modal-acciones campo-completo">
        <button
          type="button"
          className="boton-cancelar"
          onClick={onCancelar}
          disabled={guardando}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="boton-guardar"
          disabled={guardando}
        >
          {guardando
            ? esEdicion
              ? 'Guardando cambios...'
              : 'Creando usuario...'
            : esEdicion
              ? 'Guardar cambios'
              : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}

export default UsuarioForm;
