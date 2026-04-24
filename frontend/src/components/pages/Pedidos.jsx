import { useState, useCallback, useEffect } from 'react';
import { Layout } from '../layout/index';
import { SearchBox, EmptyState, Button, Modal, ConfirmDialog } from '../ui/index';
import { PedidoStatusBadge } from '../pedidos/PedidosStatusBadge';
import {
  deletePedido, aprovarPedido, reprovarPedido, devolverPedido, cancelarPedido,
} from '../../api/pedidos';
import { getUsuarios } from '../../api/usuarios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePedidos } from '../../hooks/usePedidos';
import { isAdminOrColab, isAdmin } from '../../utils/permissions';
import { formatDate, formatDateInput } from '../../utils/format';

export default function Pedidos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { livros, pedidos, atraso, loading, reload } = usePedidos(user?.userId);

  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [approveModal, setApproveModal] = useState({ open: false, pedido: null });
  const [approveData, setApproveData] = useState({ data_inicio: '', data_prevista: '' });

  const [reprovarModal, setReprovarModal] = useState({ open: false, pedido: null });
  const [motivoReprovacao, setMotivoReprovacao] = useState('');

  const [devolverModal, setDevolverModal] = useState({ open: false, pedido: null });
  const [viewModal, setViewModal]           = useState({ open: false, pedido: null });

  const [confirmDialog, setConfirmDialog] = useState({ open: false, pedido: null, action: null, label: '' });

  useEffect(() => {
    if (isAdmin(user)) {
      getUsuarios()
        .then(u => setUsuarios(u.map(({ senha: _omit, ...rest }) => rest)))
        .catch(() => toast.error('Erro ao carregar usuários'));
    }
  }, [user]);

  const getLivroTitulo = useCallback(id => livros.find(l => l.id === id)?.titulo || `#${id}`, [livros]);
  const getUsuarioNome = useCallback(id => {
    if (user.userId === id) return 'Você';
    return usuarios.find(u => u.id === id)?.nome || `#${id}`;
  }, [user, usuarios]);

  const myPedidos = isAdminOrColab(user)
    ? pedidos
    : pedidos.filter(p => p.usuario_id === user.userId);

  const filtered = myPedidos.filter(p => {
    const titulo = getLivroTitulo(p.livro_id).toLowerCase();
    const matchSearch = titulo.includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openApprove = pedido => {
    const hoje = new Date();
    const prevista = new Date();
    prevista.setDate(hoje.getDate() + 14);
    setApproveData({
      data_inicio:   formatDateInput(hoje.toISOString()),
      data_prevista: formatDateInput(prevista.toISOString()),
    });
    setApproveModal({ open: true, pedido });
  };

  const handleAprovar = async () => {
    try {
      await aprovarPedido(approveModal.pedido.id, approveData);
      toast.success('Pedido aprovado!');
      await reload(); setApproveModal({ open: false, pedido: null });
    } catch (err) { toast.error(err.message || 'Erro ao aprovar pedido'); }
  };

  const handleReprovar = async () => {
    if (!motivoReprovacao.trim()) { toast.error('Informe o motivo'); return; }
    try {
      await reprovarPedido(reprovarModal.pedido.id, { motivo_reprovacao: motivoReprovacao });
      toast.success('Pedido reprovado.');
      await reload(); setReprovarModal({ open: false, pedido: null }); setMotivoReprovacao('');
    } catch (err) { toast.error(err.message || 'Erro ao reprovar'); }
  };

  const handleDevolver = async () => {
    try {
      await devolverPedido(devolverModal.pedido.id);
      toast.success('Devolução registrada!');
      await reload(); setDevolverModal({ open: false, pedido: null });
    } catch (err) { toast.error(err.message || 'Erro ao devolver'); }
  };

  const handleCancelar = async pedido => {
    try { await cancelarPedido(pedido.id); toast.success('Pedido cancelado.'); await reload(); }
    catch (err) { toast.error(err.message || 'Erro ao cancelar'); }
  };

  const handleDelete = async pedido => {
    try { await deletePedido(pedido.id); toast.success('Pedido excluído'); await reload(); }
    catch (err) { toast.error(err.message || 'Erro ao excluir'); }
  };

  const STATUS_OPTIONS = ['pendente', 'aprovado', 'reprovado', 'devolvido', 'cancelado'];

  const vp = viewModal.pedido;

  return (
    <Layout title="Pedidos de Empréstimo" atraso={atraso}>
      <div className="page-toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Buscar por livro..." />
        <select className="form-select" style={{ maxWidth: 180 }} value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <span className="page-toolbar__count">{filtered.length} pedido(s)</span>
      </div>

      {loading ? (
        <div className="loading-state">Carregando pedidos...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📋" title="Nenhum pedido encontrado" />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {isAdminOrColab(user) && <th>Usuário</th>}
                <th>Livro</th>
                <th>Status</th>
                <th>Início</th>
                <th>Prev. Devolução</th>
                <th>Entregue em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="td--id">{`P${p.uuid?.slice(4, 10).toUpperCase() || p.id}`}</td>
                  {isAdminOrColab(user) && <td style={{ color: 'var(--ink-3)' }}>{getUsuarioNome(p.usuario_id)}</td>}
                  <td className="td--title">{getLivroTitulo(p.livro_id)}</td>
                  <td><PedidoStatusBadge status={p.status} /></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>{formatDate(p.data_inicio)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>{formatDate(p.data_prevista)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>{formatDate(p.data_entrega)}</td>
                  <td>
                    <div className="action-group">
                      {/* View detail */}
                      <Button variant="ghost" size="sm" icon="👁"
                        actionType="view" title="Detalhes"
                        onClick={() => setViewModal({ open: true, pedido: p })}
                      />

                      {/* Aluno: cancelar próprio pedido pendente */}
                      {!isAdminOrColab(user) && p.usuario_id === user.userId && p.status === 'pendente' && (
                        <Button size="sm" variant="danger"
                          onClick={() => setConfirmDialog({ open: true, pedido: p, action: 'cancelar', label: 'Cancelar pedido' })}>
                          Cancelar
                        </Button>
                      )}

                      {/* Colab/Admin: aprovar ou reprovar pendente */}
                      {isAdminOrColab(user) && p.status === 'pendente' && (
                        <>
                          <Button size="sm" variant="success" onClick={() => openApprove(p)}>Aprovar</Button>
                          <Button size="sm" variant="danger" onClick={() => {
                            setMotivoReprovacao(''); setReprovarModal({ open: true, pedido: p });
                          }}>Reprovar</Button>
                        </>
                      )}

                      {/* Colab/Admin: registrar devolução */}
                      {isAdminOrColab(user) && p.status === 'aprovado' && (
                        <Button size="sm" variant="info" onClick={() => setDevolverModal({ open: true, pedido: p })}>
                          Devolvido
                        </Button>
                      )}

                      {/* Admin: excluir */}
                      {isAdmin(user) && (
                        <Button variant="ghost" size="sm" icon="🗑"
                          actionType="delete" title="Excluir"
                          onClick={() => setConfirmDialog({ open: true, pedido: p, action: 'delete', label: 'Excluir pedido' })}
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

      {/* View detail modal */}
      {vp && (
        <Modal
          open={viewModal.open}
          onClose={() => setViewModal({ open: false, pedido: null })}
          title="Detalhes do Pedido"
          footer={<Button variant="ghost" onClick={() => setViewModal({ open: false, pedido: null })}>Fechar</Button>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
            {[
              ['Código',            `P${vp.uuid?.slice(4,10).toUpperCase() || vp.id}`],
              ['Livro',             getLivroTitulo(vp.livro_id)],
              ['Usuário',           getUsuarioNome(vp.usuario_id)],
              ['Status',            null],
              ['Início',            formatDate(vp.data_inicio)],
              ['Prev. Devolução',   formatDate(vp.data_prevista)],
              ['Entregue em',       formatDate(vp.data_entrega)],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="info-label">{label}</div>
                <div className="info-value">
                  {label === 'Status' ? <PedidoStatusBadge status={vp.status} /> : value}
                </div>
              </div>
            ))}
            {vp.motivo_reprovacao && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="info-label">Motivo Reprovação</div>
                <div className="info-value" style={{ color: 'var(--rust)' }}>{vp.motivo_reprovacao}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Aprovar */}
      <Modal open={approveModal.open} onClose={() => setApproveModal({ open: false, pedido: null })}
        title="Aprovar Pedido"
        footer={
          <>
            <Button variant="ghost" onClick={() => setApproveModal({ open: false, pedido: null })}>Cancelar</Button>
            <Button variant="success" onClick={handleAprovar}>Confirmar Aprovação</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Data de Início</label>
          <input className="form-input" type="date" value={approveData.data_inicio}
            onChange={e => setApproveData(d => ({ ...d, data_inicio: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Data Prevista de Devolução</label>
          <input className="form-input" type="date" value={approveData.data_prevista}
            onChange={e => setApproveData(d => ({ ...d, data_prevista: e.target.value }))} />
        </div>
      </Modal>

      {/* Reprovar */}
      <Modal open={reprovarModal.open} onClose={() => setReprovarModal({ open: false, pedido: null })}
        title="Reprovar Pedido"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReprovarModal({ open: false, pedido: null })}>Cancelar</Button>
            <Button variant="danger" onClick={handleReprovar}>Confirmar Reprovação</Button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Motivo da Reprovação *</label>
          <textarea className="form-input" rows={3} value={motivoReprovacao}
            onChange={e => setMotivoReprovacao(e.target.value)} placeholder="Informe o motivo…" />
        </div>
      </Modal>

      {/* Devolver */}
      <Modal open={devolverModal.open} onClose={() => setDevolverModal({ open: false, pedido: null })}
        title="Registrar Devolução"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDevolverModal({ open: false, pedido: null })}>Cancelar</Button>
            <Button variant="info" onClick={handleDevolver}>Confirmar Devolução</Button>
          </>
        }
      >
        <p style={{ color: 'var(--ink-2)' }}>
          Confirmar devolução de <strong>{getLivroTitulo(devolverModal.pedido?.livro_id)}</strong>?
        </p>
        <p style={{ marginTop: 8, fontSize: '.82rem', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
          A data de entrega será registrada como hoje e o estoque será atualizado automaticamente.
        </p>
      </Modal>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, pedido: null, action: null, label: '' })}
        title={confirmDialog.label || 'Confirmar ação'}
        message={`Tem certeza que deseja executar esta ação no pedido #${confirmDialog.pedido?.id}?`}
        confirmLabel="Confirmar" danger
        onConfirm={async () => {
          if (confirmDialog.action === 'delete')   await handleDelete(confirmDialog.pedido);
          else if (confirmDialog.action === 'cancelar') await handleCancelar(confirmDialog.pedido);
        }}
      />
    </Layout>
  );
}
