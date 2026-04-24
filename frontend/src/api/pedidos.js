import { get, post, put, del } from './client';

export const getPedidos = () => get('/pedidos');
export const getPedido = (id) => get(`/pedidos/${id}`);
export const createPedido = (data) => post('/pedidos', data);
export const deletePedido = (id) => del(`/pedidos/${id}`);

// Ações específicas via endpoints dedicados
export const aprovarPedido = (id, data) => post(`/pedidos/${id}/aprovar`, data);
export const reprovarPedido = (id, data) => post(`/pedidos/${id}/reprovar`, data);
export const devolverPedido = (id) => post(`/pedidos/${id}/devolver`);
export const cancelarPedido = (id) => post(`/pedidos/${id}/cancelar`);

// Mantido para edição admin (legacy)
export const updatePedido = (id, data) => put(`/pedidos/${id}`, data);
