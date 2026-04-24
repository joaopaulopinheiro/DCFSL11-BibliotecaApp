import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockFindUnique = jest.fn();
const mockSign       = jest.fn(() => 'fake-token');
const mockCompare    = jest.fn();

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    usuarios: { findUnique: mockFindUnique },
  })),
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: mockSign, verify: jest.fn() },
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: { compare: mockCompare },
}));

// ── App ───────────────────────────────────────────────────────────────────────

const { login } = await import('../src/controllers/loginControllers.js');

const app = express();
app.use(express.json());
app.post('/login', login);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const usuarioAtivo = {
  id: 1,
  nome: 'João',
  email: 'joao@teste.com',
  senha: 'hashed',
  matricula: '2024001',
  perfil: 'aluno',
  curso: 'Informática',
  status: 'ativo',
};

// ── Testes ────────────────────────────────────────────────────────────────────

describe('POST /login', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Validação de campos ───────────────────────────────────────────────────

  it('400 – email e senha ausentes', async () => {
    const res = await request(app).post('/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatórios/i);
  });

  it('400 – só email, sem senha', async () => {
    const res = await request(app).post('/login').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });

  it('400 – só senha, sem email', async () => {
    const res = await request(app).post('/login').send({ senha: '123456' });
    expect(res.status).toBe(400);
  });

  // ── Credenciais inválidas ─────────────────────────────────────────────────

  it('401 – usuário não encontrado no banco', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCompare.mockResolvedValue(false);

    const res = await request(app)
      .post('/login')
      .send({ email: 'nao@existe.com', senha: '12345678' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/credenciais/i);
  });

  it('401 – senha errada', async () => {
    mockFindUnique.mockResolvedValue(usuarioAtivo);
    mockCompare.mockResolvedValue(false);

    const res = await request(app)
      .post('/login')
      .send({ email: usuarioAtivo.email, senha: 'senhaerrada' });

    expect(res.status).toBe(401);
  });

  // ── Login bem-sucedido ────────────────────────────────────────────────────

  it('200 – retorna token para usuário ativo', async () => {
    mockFindUnique.mockResolvedValue(usuarioAtivo);
    mockCompare.mockResolvedValue(true);

    const res = await request(app)
      .post('/login')
      .send({ email: usuarioAtivo.email, senha: 'senhaCorreta' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', 'fake-token');
    expect(res.body.aviso).toBeUndefined();
  });

  // ── Status com aviso ──────────────────────────────────────────────────────

  it('200 – retorna aviso para usuário inativo', async () => {
    mockFindUnique.mockResolvedValue({ ...usuarioAtivo, status: 'inativo' });
    mockCompare.mockResolvedValue(true);

    const res = await request(app)
      .post('/login')
      .send({ email: usuarioAtivo.email, senha: 'senhaCorreta' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.aviso).toMatch(/inativa/i);
  });

  it('200 – retorna aviso para usuário bloqueado', async () => {
    mockFindUnique.mockResolvedValue({ ...usuarioAtivo, status: 'bloqueado' });
    mockCompare.mockResolvedValue(true);

    const res = await request(app)
      .post('/login')
      .send({ email: usuarioAtivo.email, senha: 'senhaCorreta' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.aviso).toMatch(/bloquea/i);
  });

  it('403 – status inválido no banco', async () => {
    mockFindUnique.mockResolvedValue({ ...usuarioAtivo, status: 'invalido' });
    mockCompare.mockResolvedValue(true);

    const res = await request(app)
      .post('/login')
      .send({ email: usuarioAtivo.email, senha: 'senhaCorreta' });

    expect(res.status).toBe(403);
  });

  // ── Erro interno ──────────────────────────────────────────────────────────

  it('500 – erro no banco de dados', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB down'));

    const res = await request(app)
      .post('/login')
      .send({ email: usuarioAtivo.email, senha: 'senhaCorreta' });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/database/i);
  });
});
