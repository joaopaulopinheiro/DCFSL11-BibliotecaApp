import { get, post, put, del } from './client';

export const getCategorias = () => get('/categorias');
export const getCategoria = (id) => get(`/categorias/${id}`);
export const createCategoria = (data) => post('/categorias', data);
export const updateCategoria = (id, data) => put(`/categorias/${id}`, data);
export const deleteCategoria = (id) => del(`/categorias/${id}`);
