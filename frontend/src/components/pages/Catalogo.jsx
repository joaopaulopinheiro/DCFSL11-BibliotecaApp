import { useState, useEffect } from 'react';
import { Layout } from '../layout/index';
import { SearchBox, EmptyState, Button, Modal, Badge, Pagination } from '../ui/index';
import { createPedido } from '../../api/pedidos';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePedidos } from '../../hooks/usePedidos';
import { usePagination } from '../../hooks/usePagination';
import { estoqueDisponivelComMapa } from '../../utils/estoque';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getIndisponibilidadeReason(user, livro, pedidosDoUsuario, mapaPedidos) {
  if (!user) return 'Faça login';
  if (user.status === 'bloqueado') return 'Conta bloqueada';
  if (user.status !== 'ativo') return 'Conta inativa';
  const ativos = pedidosDoUsuario.filter(p => ['pendente', 'aprovado'].includes(p.status));
  if (ativos.length >= 5) return 'Limite de 5 pedidos atingido';
  if (ativos.some(p => p.livro_id === livro.id)) return 'Pedido já em aberto';
  if (estoqueDisponivelComMapa(livro, mapaPedidos) <= 0) return 'Sem estoque';
  return null;
}

function BookCard({ livro, onSolicitar, pedidosDoUsuario, mapaPedidos, user, onViewDetalhes }) {
  const estoque = estoqueDisponivelComMapa(livro, mapaPedidos);
  const motivo = getIndisponibilidadeReason(user, livro, pedidosDoUsuario, mapaPedidos);
  const pode = !motivo;

  return (
    <div className="book-card" onClick={() => onViewDetalhes(livro)} style={{ cursor: 'pointer' }}>
      <div className="book-card__cover">
        {livro.img
          ? <img src={`${BASE_URL}${livro.img}`} alt={livro.titulo} />
          : <div className="book-card__cover-placeholder">📖</div>
        }
        <Badge type={estoque > 0 ? 'success' : 'danger'}>
          {estoque > 0 ? `${estoque} disponível` : 'Indisponível'}
        </Badge>
      </div>
      <div className="book-card__info">
        <h3 className="book-card__title">{livro.titulo}</h3>
        <p className="book-card__author">{livro.autores?.nome || '—'}</p>
        <p className="book-card__category">{livro.categorias?.nome || '—'}</p>
        {livro.editora && (
          <p className="book-card__meta">
            {livro.editora}{livro.edicao ? ` · ${livro.edicao}` : ''}
          </p>
        )}
      </div>
      <div className="book-card__actions">
        <Button
          variant={pode ? 'primary' : 'ghost'}
          size="sm"
          disabled={!pode}
          title={motivo || ''}
          onClick={() => onSolicitar(livro)}
          style={{ width: '100%' }}
        >
          {pode ? 'Solicitar empréstimo' : (motivo || 'Indisponível')}
        </Button>
      </div>
    </div>
  );
}

export default function Catalogo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { livros, pedidosDoUsuario, mapaPedidos, atraso, loading, error, reload } = usePedidos(user?.userId);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLivro, setSelectedLivro] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [viewModal, setViewModal] = useState({ open: false, livro: null });

  const vl = viewModal.livro;

  const filtered = livros.filter(l =>
    l.titulo.toLowerCase().includes(search.toLowerCase()) ||
    l.autores?.nome?.toLowerCase().includes(search.toLowerCase()) ||
    l.categorias?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const { paginatedItems, page, totalPages, setPage, resetPage } = usePagination(filtered, 12);

  useEffect(() => { resetPage(); }, [search]);

  const handleSolicitar = (livro) => {
    setSelectedLivro(livro);
    setModalOpen(true);
  };

  const handleViewDetalhes = (livro) => {
    setViewModal({ open: true, livro });
  };

  // livroId e usuarioId são derivados automaticamente — o aluno não precisa digitar nada
  const handleConfirmarPedido = async () => {
    if (!selectedLivro || !user?.userId) return;
    setSubmitting(true);
    try {
      await createPedido({
        livroId: selectedLivro.id,
        usuarioId: user.userId,
      });
      toast.success('Pedido criado! Aguarde a aprovação.');
      await reload();
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Catálogo de Livros" atraso={atraso}>
      <div className="page-toolbar">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Buscar por título, autor ou categoria..."
        />
        <span className="page-toolbar__count">{filtered.length} livro(s)</span>
      </div>

      {error && (
        <div className="topbar__alert topbar__alert--danger" style={{ marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">Carregando catálogo...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Nenhum livro encontrado" description="Tente outro termo de busca" />
      ) : (
        <>
          <div className="book-grid">
            {paginatedItems.map(livro => (
              <BookCard
                key={livro.id}
                livro={livro}
                user={user}
                pedidosDoUsuario={pedidosDoUsuario}
                mapaPedidos={mapaPedidos}
                onSolicitar={handleSolicitar}
                onViewDetalhes={handleViewDetalhes}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
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

      {/* Modal de confirmação — sem campos manuais */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirmar solicitação"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmarPedido} loading={submitting}>
              Confirmar pedido
            </Button>
          </>
        }
      >
        {selectedLivro && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {selectedLivro.img ? (
                <img
                  src={`${BASE_URL}${selectedLivro.img}`}
                  alt={selectedLivro.titulo}
                  style={{ width: 60, height: 90, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid var(--border)' }}
                />
              ) : (
                <div style={{ width: 60, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: 6, fontSize: 28, flexShrink: 0 }}>
                  📖
                </div>
              )}
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--brown-dark)', lineHeight: 1.3, marginBottom: 4 }}>
                  {selectedLivro.titulo}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedLivro.autores?.nome}</p>
                <p style={{ fontSize: 13, color: 'var(--brown-mid)', fontWeight: 600, marginTop: 2 }}>
                  {selectedLivro.categorias?.nome}
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              ℹ️ O pedido será criado com status <strong>pendente</strong>. Um colaborador definirá as datas e aprovará o empréstimo.
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
