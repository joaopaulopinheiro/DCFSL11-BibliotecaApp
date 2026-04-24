import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/index';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !senha) { toast.error('Preencha email e senha'); return; }
    setLoading(true);
    try {
      const user = await login(email, senha);
      if (user.status === 'inativo') { navigate('/inativo'); return; }
      navigate('/catalogo');
    } catch (err) {
      toast.error(err.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Floating decorative circles */}
      <div className="login-page__bg">
        <div className="login-page__circle login-page__circle--1" />
        <div className="login-page__circle login-page__circle--2" />
        <div className="login-page__circle login-page__circle--3" />
      </div>

      <div className="login-card">
        <div className="login-card__brand">
          <span className="login-card__logo">📚</span>
          <h1 className="login-card__title">
            Biblioteca<br /><em>Universitária</em>
          </h1>
        </div>
        <p className="login-card__sub">Acesse sua conta para continuar</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.edu" autoFocus
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Senha</label>
            <input
              className="form-input" type={showPwd ? 'text' : 'password'}
              value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              style={{
                position: 'absolute', right: 12, bottom: 9,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-4)', fontSize: '1rem', padding: '2px',
              }}
              aria-label="Mostrar senha"
            >
              {showPwd ? '🙈' : '👁'}
            </button>
          </div>

          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 8, padding: '11px' }}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
