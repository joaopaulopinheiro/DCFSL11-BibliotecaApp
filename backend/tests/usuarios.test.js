import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUsuarios = {
  findMany:   jest.fn(),
  findUnique: jest.fn(),
  create:     jest.fn(),
  update:     jest.fn(),
  delete:     jest.fn(),
};
const mockPedidos = { count: jest.fn() };

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    usuarios: mockUsuarios,
    pedidos:  mockPedidos,
  })),
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash:    jest.fn(() => 'hashed_password'),
    compare: jest.fn(),
  },
}));

// ── App ───────────────────────────────────────────────────────────────────────

const {
  getUsuarios, getUsuarioById, createUsuario, updateUsuario,
  deleteUsuario, changeStatusUsuario,
} = await import('../src/controllers/usuariosControllers.js');

const app = express();
app.use(express.json());
app.use((req, _res, next) => { req.usuario = { perfil: 'admin', userId: 1 }; next(); });

app.get('/usuarios',              getUsuarios);
app.get('/usuarios/:id',          getUsuarioById);
app.post('/usuarios',             createUsuario);
app.put('/usuarios/:id',          updateUsuario);
app.put('/usuarios/:id/status',   changeStatusUsuario);
app.delete('/usuarios/:id',       deleteUsuario);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const usuario = {
  id: 1, nome: 'Maria', email: 'maria@teste.com', cpf: '000.000.000-00',
  matricula: '2024002', perfil: 'aluno', curso: 'Administração',
  status: 'ativo', data_nascimento: '2000-01-01', senha: 'hashed_password',
};

const payloadCreate = {
  nome: 'Maria', email: 'maria@teste.com', cpf: '000.000.000-00',
  perfil: 'aluno', status: 'ativo', data_nascimento: '2000-01-01',
  senha: 'senha1234',
};

// ── Testes ────────────────────────────────────────────────────────────────────

describe('GET /usuarios', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – retorna lista de usuários', async () => {
    mockUsuarios.findMany.mockResolvedValue([usuario]);
    const res = await request(app).get('/usuarios');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([usuario]);
  });

  it('500 – erro no banco', async () => {
    mockUsuarios.findMany.mockRejectedValue(new Error('DB'));
    const res = await request(app).get('/usuarios');
    expect(res.status).toBe(500);
  });
});

describe('GET /usuarios/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – retorna usuário existente', async () => {
    mockUsuarios.findUnique.mockResolvedValue(usuario);
    const res = await request(app).get('/usuarios/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(usuario);
  });

  it('404 – usuário não encontrado', async () => {
    mockUsuarios.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/usuarios/99');
    expect(res.status).toBe(404);
  });

  it('400 – ID inválido (string)', async () => {
    const res = await request(app).get('/usuarios/abc');
    expect(res.status).toBe(400);
  });

  it('400 – ID zero', async () => {
    const res = await request(app).get('/usuarios/0');
    expect(res.status).toBe(400);
  });
});

describe('POST /usuarios', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201 – cria usuário com sucesso', async () => {
    mockUsuarios.create.mockResolvedValue(usuario);
    const res = await request(app).post('/usuarios').send(payloadCreate);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(usuario);
  });

  it('400 – campos obrigatórios ausentes', async () => {
    const res = await request(app).post('/usuarios').send({ nome: 'Só nome' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatórios/i);
  });

  it('400 – senha curta (menos de 8 caracteres)', async () => {
    const res = await request(app)
      .post('/usuarios')
      .send({ ...payloadCreate, senha: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/senha/i);
  });

  it('400 – CPF/email/matrícula duplicado (P2002)', async () => {
    const p2002 = Object.assign(new Error('Unique'), { code: 'P2002' });
    mockUsuarios.create.mockRejectedValue(p2002);

    const res = await request(app).post('/usuarios').send(payloadCreate);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/já existe/i);
  });

  it('500 – erro genérico no banco', async () => {
    mockUsuarios.create.mockRejectedValue(new Error('DB'));
    const res = await request(app).post('/usuarios').send(payloadCreate);
    expect(res.status).toBe(500);
  });
});

describe('PUT /usuarios/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – atualiza usuário com sucesso', async () => {
    const atualizado = { ...usuario, nome: 'Maria Editada' };
    mockUsuarios.update.mockResolvedValue(atualizado);

    const res = await request(app).put('/usuarios/1').send({ nome: 'Maria Editada' });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Maria Editada');
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).put('/usuarios/abc').send({ nome: 'X' });
    expect(res.status).toBe(400);
  });

  it('400 – senha nova muito curta', async () => {
    const res = await request(app).put('/usuarios/1').send({ senha: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/senha/i);
  });

  it('404 – usuário não encontrado (P2025)', async () => {
    const p2025 = Object.assign(new Error('Not found'), { code: 'P2025' });
    mockUsuarios.update.mockRejectedValue(p2025);

    const res = await request(app).put('/usuarios/99').send({ nome: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('PUT /usuarios/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – altera status com sucesso', async () => {
    mockUsuarios.findUnique.mockResolvedValue(usuario);
    mockUsuarios.update.mockResolvedValue({ ...usuario, status: 'inativo' });

    const res = await request(app).put('/usuarios/1/status').send({ status: 'inativo' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inativo');
  });

  it('400 – status inválido', async () => {
    const res = await request(app).put('/usuarios/1/status').send({ status: 'suspenso' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status inválido/i);
  });

  it('400 – status ausente', async () => {
    const res = await request(app).put('/usuarios/1/status').send({});
    expect(res.status).toBe(400);
  });

  it('404 – usuário não encontrado', async () => {
    mockUsuarios.findUnique.mockResolvedValue(null);
    const res = await request(app).put('/usuarios/99/status').send({ status: 'ativo' });
    expect(res.status).toBe(404);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).put('/usuarios/abc/status').send({ status: 'ativo' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /usuarios/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('204 – deleta usuário sem pedidos ativos', async () => {
    mockPedidos.count.mockResolvedValue(0);
    mockUsuarios.delete.mockResolvedValue(usuario);

    const res = await request(app).delete('/usuarios/1');
    expect(res.status).toBe(204);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).delete('/usuarios/abc');
    expect(res.status).toBe(400);
  });

  it('409 – usuário com pedidos ativos', async () => {
    mockPedidos.count.mockResolvedValue(2);
    const res = await request(app).delete('/usuarios/1');
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/pedidos pendentes/i);
  });

  it('404 – usuário não encontrado (P2025)', async () => {
    mockPedidos.count.mockResolvedValue(0);
    const p2025 = Object.assign(new Error('Not found'), { code: 'P2025' });
    mockUsuarios.delete.mockRejectedValue(p2025);

    const res = await request(app).delete('/usuarios/99');
    expect(res.status).toBe(404);
  });
});
