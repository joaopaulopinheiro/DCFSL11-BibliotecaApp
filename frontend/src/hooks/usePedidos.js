import { useState, useEffect, useCallback } from 'react';
import { getLivros } from '../api/livros';
import { getPedidos } from '../api/pedidos';
import { mapearPedidosAtivos } from '../utils/estoque';
import { temAtraso } from '../utils/permissions';

/**
 * Hook centralizado para pedidos e livros.
 *
 * Retorna:
 *  - livros, pedidos, loading, error
 *  - pedidosDoUsuario  → pedidos filtrados pelo userId atual
 *  - mapaPedidos       → mapa otimizado { livro_id: count } para cálculo de estoque
 *  - atraso            → true se o usuário tem algum pedido aprovado com data vencida
 *  - reload()          → re-fetch manual (após mutações)
 */
export function usePedidos(userId) {
  const [livros, setLivros] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [l, p] = await Promise.all([getLivros(), getPedidos()]);
      setLivros(l);
      setPedidos(p);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const pedidosDoUsuario = userId
    ? pedidos.filter(p => p.usuario_id === userId)
    : [];

  const mapaPedidos = mapearPedidosAtivos(pedidos);
  const atraso = temAtraso(pedidosDoUsuario);

  return {
    livros,
    pedidos,
    pedidosDoUsuario,
    mapaPedidos,
    atraso,
    loading,
    error,
    reload,
  };
}
