import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../layout/index';
import { SearchBox, EmptyState, Button, Modal, ConfirmDialog, Badge } from '../ui/index';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../../api/usuarios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdmin } from '../../utils/permissions';
import { formatCPF, formatDateInput, perfilLabels, userStatusLabels } from '../../utils/format';

const perfilBadge = { aluno: 'info', colab: 'warning', admin: 'danger' };
const statusBadge  = { ativo: 'success', inativo: 'muted', bloqueado: 'warning' };

export default function Usuarios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState({ open: false, usuario: null });
  const [formData, setFormData] = useState({
    nome: '', email: '', cpf: '', senha: '',
    perfil: 'aluno', status: 'ativo',
    data_nascimento: '', matricula: '', curso: '',
  });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, usuario: null });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const u = await getUsuarios();
      setUsuarios(u.map(({ senha: _omit, ...rest }) => rest));
    } catch { toast.error('Erro ao carregar usuários'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = usuarios.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.cpf?.includes(search)
  );

  const handleOpenForm = (usuario = null) => {
    if (usuario) {
      setFormData({
        nome: usuario.nome, email: usuario.email, cpf: usuario.cpf, senha: '',
        perfil: usuario.perfil, status: usuario.status,
        data_nascimento: usuario.data_nascimento ? formatDateInput(usuario.data_nascimento) : '',
        matricula: usuario.matricula || '', curso: usuario.curso || '',
      });
    } else {
      setFormData({ nome: '', email: '', cpf: '', senha: '', perfil: 'aluno', status: 'ativo', data_nascimento: '', matricula: '', curso: '' });
    }
    setFormModal({ open: true, usuario });
  };

  const validateCPF   = cpf   => /^\d{11}$/.test(cpf?.replace(/\D/g, ''));
  const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmitForm = async () => {
    const { nome, email, cpf, senha, data_nascimento } = formData;
    if (!nome || !email || !cpf || !data_nascimento) { toast.error('Preencha todos os campos obrigatórios'); return; }
    if (!validateEmail(email))   { toast.error('Email inválido'); return; }
    if (!validateCPF(cpf))       { toast.error('CPF deve conter 11 dígitos'); return; }
    if (!formModal.usuario && !senha) { toast.error('Senha é obrigatória para novo usuário'); return; }
    if (senha && senha.length < 8)    { toast.error('Senha deve ter no mínimo 8 caracteres'); return; }

    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.senha) delete payload.senha;
      if (formModal.usuario) {
        await updateUsuario(formModal.usuario.id, payload);
        toast.success('Usuário atualizado com sucesso');
      } else {
        await createUsuario(payload);
        toast.success('Usuário criado com sucesso');
      }
      loadData();
      setFormModal({ open: false, usuario: null });
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar usuário');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (usuario) => {
    try {
      await deleteUsuario(usuario.id);
      toast.success('Usuário deletado com sucesso');
      loadData();
      setConfirmDialog({ open: false, usuario: null });
    } catch (err) { toast.error(err.message || 'Erro ao deletar usuário'); }
  };

  if (!isAdmin(user)) {
    return (
      <Layout title="Usuários">
        <EmptyState icon="🚫" title="Acesso negado" description="Apenas administradores podem acessar esta página" />
      </Layout>
    );
  }

  return (
    <Layout title="Usuários">
      <div className="page-toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar por nome, email ou CPF..." />
        <Button variant="primary" onClick={() => handleOpenForm()}>+ Novo Usuário</Button>
        <span className="page-toolbar__count">{filtered.length} usuário(s)</span>
      </div>

      {loading ? (
        <div className="loading-state">Carregando usuários...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="👥" title="Nenhum usuário encontrado" />
      ) : (
        <div className="users-list">
          {filtered.map(usuario => {
            const initial = usuario.nome[0]?.toUpperCase() || '?';
            return (
              <div className="user-row" key={usuario.id}>
                <div className="user-row__avatar">{initial}</div>
                <div className="user-row__info">
                  <div className="user-row__name">{usuario.nome}</div>
                  <div className="user-row__meta">
                    {usuario.email}
                    {usuario.matricula && ` · ${usuario.matricula}`}
                    {usuario.curso && ` · ${usuario.curso}`}
                  </div>
                </div>
                <div className="user-row__badges">
                  <Badge type={perfilBadge[usuario.perfil] || 'muted'}>
                    {perfilLabels[usuario.perfil]}
                  </Badge>
                  <Badge type={statusBadge[usuario.status] || 'muted'}>
                    {userStatusLabels[usuario.status]}
                  </Badge>
                </div>
                <div className="user-row__actions">
                  <Button
                    variant="ghost" size="sm" icon="✏️"
                    actionType="edit" title="Editar"
                    onClick={() => handleOpenForm(usuario)}
                  />
                  <Button
                    variant="ghost" size="sm" icon="🗑"
                    actionType="delete" title="Excluir"
                    onClick={() => setConfirmDialog({ open: true, usuario })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, usuario: null })}
        title={formModal.usuario ? 'Editar Usuário' : 'Novo Usuário'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormModal({ open: false, usuario: null })}>Cancelar</Button>
            <Button loading={submitting} onClick={handleSubmitForm}>Salvar</Button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" type="text" value={formData.nome}
              onChange={e => setFormData(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={formData.email}
              onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">CPF (11 dígitos) *</label>
            <input className="form-input" type="text" value={formData.cpf}
              onChange={e => setFormData(f => ({ ...f, cpf: e.target.value.replace(/\D/g, '') }))} placeholder="12345678901" />
          </div>
          <div className="form-group">
            <label className="form-label">Data de Nascimento *</label>
            <input className="form-input" type="date" value={formData.data_nascimento}
              onChange={e => setFormData(f => ({ ...f, data_nascimento: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Senha {formModal.usuario ? '(deixe em branco para manter)' : '*'}</label>
          <input className="form-input" type="password" value={formData.senha}
            onChange={e => setFormData(f => ({ ...f, senha: e.target.value }))} placeholder="••••••••" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Perfil *</label>
            <select className="form-select" value={formData.perfil}
              onChange={e => setFormData(f => ({ ...f, perfil: e.target.value }))}>
              <option value="aluno">Aluno</option>
              <option value="colab">Colaborador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status *</label>
            <select className="form-select" value={formData.status}
              onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Matrícula</label>
            <input className="form-input" type="text" value={formData.matricula}
              onChange={e => setFormData(f => ({ ...f, matricula: e.target.value }))} placeholder="2024001" />
          </div>
          <div className="form-group">
            <label className="form-label">Curso</label>
            <input className="form-input" type="text" value={formData.curso}
              onChange={e => setFormData(f => ({ ...f, curso: e.target.value }))} placeholder="Engenharia" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, usuario: null })}
        title="Deletar Usuário"
        message={`Tem certeza que deseja deletar "${confirmDialog.usuario?.nome}"?`}
        danger
        onConfirm={() => handleDelete(confirmDialog.usuario)}
      />
    </Layout>
  );
}
