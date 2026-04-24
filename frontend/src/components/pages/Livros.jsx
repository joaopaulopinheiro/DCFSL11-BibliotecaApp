import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../layout/index';
import { SearchBox, EmptyState, Button, Modal, ConfirmDialog, Badge } from '../ui/index';
import { getLivros, createLivro, updateLivro, deleteLivro } from '../../api/livros';
import { getAutores } from '../../api/autores';
import { getCategorias } from '../../api/categorias';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isAdminOrColab, isAdmin } from '../../utils/permissions';
import { formatDateInput } from '../../utils/format';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Livros() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [livros, setLivros] = useState([]);
  const [autores, setAutores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [viewModal, setViewModal] = useState({ open: false, livro: null });
  const [formModal, setFormModal] = useState({ open: false, livro: null });
  const [formData, setFormData] = useState({
    titulo: '', descricao: '', edicao: '', autorId: '', categoriaId: '',
    idioma: '', num_paginas: '', editora: '', estoque: '', data_publicacao: '', img: null,
  });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, livro: null });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [l, a, c] = await Promise.all([getLivros(), getAutores(), getCategorias()]);
      setLivros(l); setAutores(a); setCategorias(c);
    } catch { toast.error('Erro ao carregar dados'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = livros.filter(l =>
    l.titulo.toLowerCase().includes(search.toLowerCase()) ||
    l.autores?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenForm = (livro = null) => {
    if (livro) {
      setFormData({
        titulo: livro.titulo, descricao: livro.descricao || '', edicao: livro.edicao || '',
        autorId: livro.autorId, categoriaId: livro.categoriaId, idioma: livro.idioma || '',
        num_paginas: livro.num_paginas || '', editora: livro.editora || '',
        estoque: livro.estoque || '',
        data_publicacao: livro.data_publicacao ? formatDateInput(livro.data_publicacao) : '',
        img: null,
      });
    } else {
      setFormData({ titulo: '', descricao: '', edicao: '', autorId: '', categoriaId: '',
        idioma: '', num_paginas: '', editora: '', estoque: '', data_publicacao: '', img: null });
    }
    setFormModal({ open: true, livro });
  };

  const handleSubmitForm = async () => {
    if (!formData.titulo || !formData.autorId || !formData.categoriaId) {
      toast.error('Preencha todos os campos obrigatórios'); return;
    }
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.num_paginas) payload.num_paginas = parseInt(payload.num_paginas);
      if (payload.estoque)     payload.estoque     = parseInt(payload.estoque);
      if (formModal.livro) {
        await updateLivro(formModal.livro.id, payload, !!payload.img);
        toast.success('Livro atualizado com sucesso');
      } else {
        await createLivro(payload, !!payload.img);
        toast.success('Livro criado com sucesso');
      }
      loadData(); setFormModal({ open: false, livro: null });
    } catch (err) { toast.error(err.message || 'Erro ao salvar livro'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (livro) => {
    try {
      await deleteLivro(livro.id);
      toast.success('Livro deletado com sucesso');
      loadData(); setConfirmDialog({ open: false, livro: null });
    } catch (err) { toast.error(err.message || 'Erro ao deletar livro'); }
  };

  if (!isAdminOrColab(user)) {
    return (
      <Layout title="Livros">
        <EmptyState icon="🚫" title="Acesso negado" description="Apenas colaboradores e administradores podem acessar esta página" />
      </Layout>
    );
  }

  const vl = viewModal.livro;

  return (
    <Layout title="Livros">
      <div className="page-toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar por título ou autor..." />
        {isAdminOrColab(user) && (
          <Button variant="primary" onClick={() => handleOpenForm()}>+ Novo Livro</Button>
        )}
        <span className="page-toolbar__count">{filtered.length} livro(s)</span>
      </div>

      {loading ? (
        <div className="loading-state">Carregando livros...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📖" title="Nenhum livro encontrado" />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Capa</th>
                <th>Título</th>
                <th>Autor</th>
                <th>Categoria</th>
                <th>Estoque</th>
                <th>Editora</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(livro => (
                <tr key={livro.id}>
                  <td>
                    {livro.img
                      ? <img src={`${BASE_URL}${livro.img}`} alt={livro.titulo}
                          style={{ width: 38, height: 56, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
                      : <span style={{ fontSize: 22 }}>📖</span>
                    }
                  </td>
                  <td className="td--title">{livro.titulo}</td>
                  <td style={{ color: 'var(--ink-3)' }}>{livro.autores?.nome || '—'}</td>
                  <td>
                    {livro.categorias?.nome
                      ? <Badge type="warning">{livro.categorias.nome}</Badge>
                      : '—'}
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '.8rem',
                      color: livro.estoque === 0 ? 'var(--rust)' : livro.estoque <= 2 ? 'var(--warning)' : 'var(--sage)',
                      fontWeight: 700,
                    }}>
                      {livro.estoque ?? 0}
                    </span>
                  </td>
                  <td style={{ color: 'var(--ink-4)', fontSize: '.82rem' }}>{livro.editora || '—'}</td>
                  <td>
                    <div className="action-group">
                      <Button variant="ghost" size="sm" icon="👁"
                        actionType="view" title="Visualizar"
                        onClick={() => setViewModal({ open: true, livro })}
                      />
                      <Button variant="ghost" size="sm" icon="✏️"
                        actionType="edit" title="Editar"
                        onClick={() => handleOpenForm(livro)}
                      />
                      {isAdmin(user) && (
                        <Button variant="ghost" size="sm" icon="🗑"
                          actionType="delete" title="Excluir"
                          onClick={() => setConfirmDialog({ open: true, livro })}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View modal */}
      {vl && (
        <Modal
          open={viewModal.open}
          onClose={() => setViewModal({ open: false, livro: null })}
          title="Detalhes do Livro"
          size="lg"
          footer={
            <Button variant="ghost" onClick={() => setViewModal({ open: false, livro: null })}>Fechar</Button>
          }
        >
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {vl.img && (
              <img src={`${BASE_URL}${vl.img}`} alt={vl.titulo}
                style={{ width: 90, height: 135, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
              {[
                ['Título', vl.titulo], ['Autor', vl.autores?.nome || '—'],
                ['Categoria', vl.categorias?.nome || '—'], ['Edição', vl.edicao || '—'],
                ['Idioma', vl.idioma || '—'], ['Editora', vl.editora || '—'],
                ['Páginas', vl.num_paginas || '—'], ['Estoque', vl.estoque ?? '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="info-label">{label}</div>
                  <div className="info-value">{value}</div>
                </div>
              ))}
              {vl.descricao && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="info-label">Descrição</div>
                  <div className="info-value" style={{ lineHeight: 1.6 }}>{vl.descricao}</div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Form modal */}
      <Modal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, livro: null })}
        title={formModal.livro ? 'Editar Livro' : 'Novo Livro'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormModal({ open: false, livro: null })}>Cancelar</Button>
            <Button loading={submitting} onClick={handleSubmitForm}>Salvar</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Título *</label>
          <input className="form-input" type="text" value={formData.titulo}
            onChange={e => setFormData(f => ({ ...f, titulo: e.target.value }))} placeholder="Título do livro" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Autor *</label>
            <select className="form-select" value={formData.autorId}
              onChange={e => setFormData(f => ({ ...f, autorId: parseInt(e.target.value) || '' }))}>
              <option value="">Selecione…</option>
              {autores.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Categoria *</label>
            <select className="form-select" value={formData.categoriaId}
              onChange={e => setFormData(f => ({ ...f, categoriaId: parseInt(e.target.value) || '' }))}>
              <option value="">Selecione…</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Descrição</label>
          <textarea className="form-input" value={formData.descricao} rows={3}
            onChange={e => setFormData(f => ({ ...f, descricao: e.target.value }))} placeholder="Resumo do livro…" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Edição</label>
            <input className="form-input" type="text" value={formData.edicao}
              onChange={e => setFormData(f => ({ ...f, edicao: e.target.value }))} placeholder="Ex: 2ª edição" />
          </div>
          <div className="form-group">
            <label className="form-label">Idioma</label>
            <input className="form-input" type="text" value={formData.idioma}
              onChange={e => setFormData(f => ({ ...f, idioma: e.target.value }))} placeholder="Ex: Português" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Editora</label>
            <input className="form-input" type="text" value={formData.editora}
              onChange={e => setFormData(f => ({ ...f, editora: e.target.value }))} placeholder="Nome da editora" />
          </div>
          <div className="form-group">
            <label className="form-label">Data de Publicação</label>
            <input className="form-input" type="date" value={formData.data_publicacao}
              onChange={e => setFormData(f => ({ ...f, data_publicacao: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Páginas</label>
            <input className="form-input" type="number" value={formData.num_paginas}
              onChange={e => setFormData(f => ({ ...f, num_paginas: e.target.value }))} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Estoque</label>
            <input className="form-input" type="number" value={formData.estoque}
              onChange={e => setFormData(f => ({ ...f, estoque: e.target.value }))} placeholder="0" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Capa (Imagem)</label>
          <input className="form-input" type="file" accept="image/*"
            onChange={e => setFormData(f => ({ ...f, img: e.target.files[0] }))} />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, livro: null })}
        title="Deletar Livro"
        message={`Tem certeza que deseja deletar "${confirmDialog.livro?.titulo}"?`}
        danger
        onConfirm={() => handleDelete(confirmDialog.livro)}
      />
    </Layout>
  );
}
