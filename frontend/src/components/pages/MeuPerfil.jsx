import { useState } from 'react';
import { Layout } from '../layout/index';
import { Button, Badge } from '../ui/index';
import { updateUsuario } from '../../api/usuarios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { perfilLabels, userStatusLabels } from '../../utils/format';

const perfilBadge = { aluno: 'info', colab: 'warning', admin: 'danger' };
const statusBadge  = { ativo: 'success', inativo: 'muted', bloqueado: 'warning' };

function colorFromString(str) {
  const colors = ['#c8902e','#2e7d52','#1a6fa8','#8e44ad','#c0392b','#2980b9','#16a085'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function MeuPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ senha_atual: '', senha_nova: '', senha_confirmar: '' });

  const handleChangePassword = async () => {
    const { senha_atual, senha_nova, senha_confirmar } = formData;
    if (!senha_atual || !senha_nova || !senha_confirmar) { toast.error('Preencha todos os campos'); return; }
    if (senha_nova !== senha_confirmar) { toast.error('As senhas não coincidem'); return; }
    if (senha_nova.length < 8) { toast.error('Senha deve ter no mínimo 8 caracteres'); return; }

    setLoading(true);
    try {
      await updateUsuario(user.userId, { senha: senha_nova });
      toast.success('Senha alterada com sucesso');
      setFormData({ senha_atual: '', senha_nova: '', senha_confirmar: '' });
      setEditMode(false);
    } catch (err) { toast.error(err.message || 'Erro ao alterar senha'); }
    finally { setLoading(false); }
  };

  if (!user) {
    return <Layout title="Meu Perfil"><div className="loading-state">Carregando…</div></Layout>;
  }

  const initial = (user.username || 'U')[0].toUpperCase();
  const avatarColor = colorFromString(user.username || 'U');

  return (
    <Layout title="Meu Perfil">
      <div className="profile-container">
        <div className="profile-card">
          {/* Header */}
          <div className="profile-header">
            <div
              style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `${avatarColor}22`, border: `2px solid ${avatarColor}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: avatarColor,
              }}
            >
              {initial}
            </div>
            <div>
              <div className="profile-name">{user.username}</div>
              <div className="profile-role" style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                <Badge type={perfilBadge[user.perfil] || 'muted'}>{perfilLabels[user.perfil]}</Badge>
                <Badge type={statusBadge[user.status] || 'muted'}>{userStatusLabels[user.status]}</Badge>
              </div>
            </div>
          </div>

          <div className="profile-body">
            {/* Info grid */}
            <div className="profile-section">
              <h3>Informações Pessoais</h3>
              <div className="info-grid">
                {[
                  ['Nome',       user.username],
                  ['Email',      user.email],
                  ['Matrícula',  user.matricula || '—'],
                  ['Curso',      user.curso || '—'],
                ].map(([label, value]) => (
                  <div className="info-item" key={label}>
                    <span className="info-label">{label}</span>
                    <span className="info-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Change password */}
            <div className="profile-section">
              <h3>Alterar Senha</h3>

              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="topbar__alert" style={{ borderRadius: 6, fontSize: '.8rem' }}>
                    ⚠️ Ambiente de desenvolvimento: a senha atual não é verificada pelo servidor.
                  </div>
                  {[
                    ['senha_atual',     'Senha Atual',        'Senha atual'],
                    ['senha_nova',      'Nova Senha',         'Mínimo 8 caracteres'],
                    ['senha_confirmar', 'Confirmar Senha',    'Repita a nova senha'],
                  ].map(([key, label, placeholder]) => (
                    <div className="form-group" key={key}>
                      <label className="form-label">{label}</label>
                      <input className="form-input" type="password"
                        value={formData[key]}
                        onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="ghost" onClick={() => setEditMode(false)}>Cancelar</Button>
                    <Button loading={loading} onClick={handleChangePassword}>Atualizar Senha</Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setEditMode(true)}>Alterar Senha</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
