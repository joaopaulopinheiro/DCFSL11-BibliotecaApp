import { get, post, put, del } from './client';

export const getAutores = () => get('/autores');
export const getAutor = (id) => get(`/autores/${id}`);
export const createAutor = (data) => post('/autores', data);
export const updateAutor = (id, data) => put(`/autores/${id}`, data);
export const deleteAutor = (id) => del(`/autores/${id}`);
