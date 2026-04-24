import { get, post, put, del } from './client';

export const getUsuarios = () => get('/usuarios');
export const getUsuario = (id) => get(`/usuarios/${id}`);
export const createUsuario = (data) => post('/usuarios', data);
export const updateUsuario = (id, data) => put(`/usuarios/${id}`, data);
export const deleteUsuario = (id) => del(`/usuarios/${id}`);
