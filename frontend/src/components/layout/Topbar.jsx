import { useAuth } from '../../context/AuthContext';

export function Topbar({ title, atraso, sidebarOpen, onToggleSidebar, filters }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          className="topbar__toggle"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          aria-label="Toggle sidebar"
        >
          <span className={`topbar__toggle-icon${sidebarOpen ? '' : ' topbar__toggle-icon--closed'}`}>
            <span /><span /><span />
          </span>
        </button>
        <h1 className="topbar__title">{title}</h1>
      </div>

      <div className="topbar__center">
        {filters && <div className="topbar__filters">{filters}</div>}
      </div>

      <div className="topbar__alerts">
        {user?.status === 'bloqueado' && (
          <div className="topbar__alert">
            ⚠️ Sua conta está bloqueada — novos pedidos suspensos
          </div>
        )}
        {atraso && user?.status !== 'bloqueado' && (
          <div className="topbar__alert topbar__alert--danger">
            🔴 Devolução(ões) em atraso — regularize para evitar bloqueio
          </div>
        )}
      </div>
    </header>
  );
}
