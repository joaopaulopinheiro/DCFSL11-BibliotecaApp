import { get, post } from './client';

export const login = (email, senha) => post('/login', { email, senha });
export const validateToken = () => get('/validate-token');
