import { useState, useEffect } from 'react';
import { Layout } from '../layout/index';
import { SearchBox, EmptyState, Button, Modal, ConfirmDialog } from '../ui/index';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../../api/categorias';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminOrColab, isAdmin } from '../../utils/permissions';

function colorFromString(str) {
  const colors = ['#c8902e','#2e7d52','#1a6fa8','#8e44ad','#c0392b','#2980b9','#16a085'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Categorias() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState({ open: false, categoria: null });
  const [nome, setNome] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, categoria: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setCategorias(await getCategorias()); }
    catch { toast.error('Erro ao carregar categorias'); }
    finally { setLoading(false); }
  };

  const filtered = categorias.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (categoria = null) => {
    setNome(categoria?.nome || '');
    setFormModal({ open: true, categoria });
  };

  const handleSubmitForm = async () => {
    if (!nome.trim()) { toast.error('Preencha o nome da categoria'); return; }
    setSubmitting(true);
    try {
      if (formModal.categoria) {
        await updateCategoria(formModal.categoria.id, { nome });
        toast.success('Categoria atualizada com sucesso');
      } else {
        await createCategoria({ nome });
        toast.success('Categoria criada com sucesso');
      }
      loadData();
      setFormModal({ open: false, categoria: null });
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar categoria');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoria) => {
    try {
      await deleteCategoria(categoria.id);
      toast.success('Categoria deletada com sucesso');
      loadData();
      setConfirmDialog({ open: false, categoria: null });
    } catch (err) {
      toast.error(err.message || 'Erro ao deletar categoria');
    }
  };

  if (!isAdminOrColab(user)) {
    return (
      <Layout title="Categorias">
        <EmptyState icon="🚫" title="Acesso negado" description="Apenas colaboradores e administradores podem acessar esta página" />
      </Layout>
    );
  }

  return (
    <Layout title="Categorias">
      <div className="page-toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar categoria..." />
        {isAdminOrColab(user) && (
          <Button variant="primary" onClick={() => handleOpenForm()}>+ Nova Categoria</Button>
        )}
        <span className="page-toolbar__count">{filtered.length} categoria(s)</span>
      </div>

      {loading ? (
        <div className="loading-state">Carregando categorias...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🏷️" title="Nenhuma categoria encontrada" />
      ) : (
        <div className="tags-grid">
          {filtered.map(categoria => {
            const color = colorFromString(categoria.nome);
            return (
              <div className="tag-card" key={categoria.id}>
                <div className="tag-card__dot" style={{ background: color }} />
                <span className="tag-card__name">{categoria.nome}</span>
                <div className="tag-card__actions">
                  <Button
                    variant="ghost" size="sm" icon="✏️"
                    actionType="edit" title="Editar"
                    onClick={() => handleOpenForm(categoria)}
                  />
                  {isAdmin(user) && (
                    <Button
                      variant="ghost" size="sm" icon="🗑"
                      actionType="delete" title="Excluir"
                      onClick={() => setConfirmDialog({ open: true, categoria })}
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
        onClose={() => setFormModal({ open: false, categoria: null })}
        title={formModal.categoria ? 'Editar Categoria' : 'Nova Categoria'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormModal({ open: false, categoria: null })}>Cancelar</Button>
            <Button loading={submitting} onClick={handleSubmitForm}>Salvar</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nome *</label>
          <input
            className="form-input" type="text"
            value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Ex: Ficção Científica" autoFocus
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, categoria: null })}
        title="Deletar Categoria"
        message={`Tem certeza que deseja deletar "${confirmDialog.categoria?.nome}"?`}
        danger
        onConfirm={() => handleDelete(confirmDialog.categoria)}
      />
    </Layout>
  );
}
