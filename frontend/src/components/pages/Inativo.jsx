import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/index';

export default function Inativo() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__brand">
          <span className="login-card__logo">🔒</span>
          <h1 className="login-card__title">Conta Inativa</h1>
          <p className="login-card__sub">
            Olá, {user?.username}. Sua conta está inativa.
            Entre em contato com a administração para solicitar a reativação.
          </p>
        </div>
        <Button variant="ghost" onClick={handleLogout} style={{ width: '100%', marginTop: '16px' }}>
          Voltar ao Login
        </Button>
      </div>
    </div>
  );
}
