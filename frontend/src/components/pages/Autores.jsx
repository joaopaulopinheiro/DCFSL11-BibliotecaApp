import { useState, useEffect } from 'react';
import { Layout } from '../layout/index';
import { SearchBox, EmptyState, Button, Modal, ConfirmDialog } from '../ui/index';
import { getAutores, createAutor, updateAutor, deleteAutor } from '../../api/autores';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminOrColab, isAdmin } from '../../utils/permissions';

function colorFromString(str) {
  const colors = ['#c8902e','#2e7d52','#1a6fa8','#8e44ad','#c0392b','#2980b9','#16a085'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Autores() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [autores, setAutores] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState({ open: false, autor: null });
  const [nome, setNome] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, autor: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setAutores(await getAutores()); }
    catch { toast.error('Erro ao carregar autores'); }
    finally { setLoading(false); }
  };

  const filtered = autores.filter(a =>
    a.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (autor = null) => {
    setNome(autor?.nome || '');
    setFormModal({ open: true, autor });
  };

  const handleSubmitForm = async () => {
    if (!nome.trim()) { toast.error('Preencha o nome do autor'); return; }
    setSubmitting(true);
    try {
      if (formModal.autor) {
        await updateAutor(formModal.autor.id, { nome });
        toast.success('Autor atualizado com sucesso');
      } else {
        await createAutor({ nome });
        toast.success('Autor criado com sucesso');
      }
      loadData();
      setFormModal({ open: false, autor: null });
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar autor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (autor) => {
    try {
      await deleteAutor(autor.id);
      toast.success('Autor deletado com sucesso');
      loadData();
      setConfirmDialog({ open: false, autor: null });
    } catch (err) {
      toast.error(err.message || 'Erro ao deletar autor');
    }
  };

  if (!isAdminOrColab(user)) {
    return (
      <Layout title="Autores">
        <EmptyState icon="🚫" title="Acesso negado" description="Apenas colaboradores e administradores podem acessar esta página" />
      </Layout>
    );
  }

  return (
    <Layout title="Autores">
      <div className="page-toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar autor..." />
        {isAdminOrColab(user) && (
          <Button variant="primary" onClick={() => handleOpenForm()}>+ Novo Autor</Button>
        )}
        <span className="page-toolbar__count">{filtered.length} autor(es)</span>
      </div>

      {loading ? (
        <div className="loading-state">Carregando autores...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="✍️" title="Nenhum autor encontrado" />
      ) : (
        <div className="authors-grid">
          {filtered.map(autor => {
            const color = colorFromString(autor.nome);
            const initial = autor.nome[0]?.toUpperCase() || '?';
            return (
              <div className="author-card" key={autor.id}>
                <div
                  className="author-card__avatar"
                  style={{ background: `${color}22`, borderColor: `${color}66`, color }}
                >
                  {initial}
                </div>
                <div className="author-card__name">{autor.nome}</div>
                <div className="author-card__actions">
                  <Button
                    variant="ghost" size="sm" icon="✏️"
                    actionType="edit"
                    title="Editar"
                    onClick={() => handleOpenForm(autor)}
                  />
                  {isAdmin(user) && (
                    <Button
                      variant="ghost" size="sm" icon="🗑"
                      actionType="delete"
                      title="Excluir"
                      onClick={() => setConfirmDialog({ open: true, autor })}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, autor: null })}
        title={formModal.autor ? 'Editar Autor' : 'Novo Autor'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormModal({ open: false, autor: null })}>Cancelar</Button>
            <Button loading={submitting} onClick={handleSubmitForm}>Salvar</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nome *</label>
          <input
            className="form-input" type="text"
            value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Ex: Machado de Assis" autoFocus
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, autor: null })}
        title="Deletar Autor"
        message={`Tem certeza que deseja deletar "${confirmDialog.autor?.nome}"?`}
        danger
        onConfirm={() => handleDelete(confirmDialog.autor)}
      />
    </Layout>
  );
}
