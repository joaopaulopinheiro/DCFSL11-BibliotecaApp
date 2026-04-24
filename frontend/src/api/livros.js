import { get, post, put, del } from './client';

export const getLivros = () => get('/livros');
export const getLivro = (id) => get(`/livros/${id}`);
export const createLivro = (data, isFormData = false) => post('/livros', data, isFormData);
export const updateLivro = (id, data, isFormData = false) => put(`/livros/${id}`, data, isFormData);
export const deleteLivro = (id) => del(`/livros/${id}`);
