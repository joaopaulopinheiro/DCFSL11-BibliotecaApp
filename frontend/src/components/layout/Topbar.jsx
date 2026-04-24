import { useAuth } from '../../context/AuthContext';

export function Topbar({ title, atraso }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <h1 className="topbar__title">{title}</h1>
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
