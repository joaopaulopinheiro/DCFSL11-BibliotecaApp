import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, requiredPerfil }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.status === 'inativo') return <Navigate to="/inativo" replace />;

  if (requiredPerfil) {
    const allowed = Array.isArray(requiredPerfil) ? requiredPerfil : [requiredPerfil];
    if (!allowed.includes(user.perfil)) return <Navigate to="/" replace />;
  }

  return children;
}
