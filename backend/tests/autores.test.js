import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockAutores = {
  findMany:  jest.fn(),
  findUnique: jest.fn(),
  findFirst:  jest.fn(),
  create:     jest.fn(),
  update:     jest.fn(),
  delete:     jest.fn(),
};
const mockLivros = { count: jest.fn() };

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    autores: mockAutores,
    livros:  mockLivros,
  })),
}));

// ── App ───────────────────────────────────────────────────────────────────────

const {
  getAllAutores, getAutorById, createAutor, updateAutor, deleteAutor,
} = await import('../src/controllers/autoresControllers.js');

const app = express();
app.use(express.json());
// Injeta usuário fake no req para dispensar o middleware de token
app.use((req, _res, next) => { req.usuario = { perfil: 'admin' }; next(); });

app.get('/autores',     getAllAutores);
app.get('/autores/:id', getAutorById);
app.post('/autores',    createAutor);
app.put('/autores/:id', updateAutor);
app.delete('/autores/:id', deleteAutor);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const autor = { id: 1, nome: 'Machado de Assis' };

// ── Testes ────────────────────────────────────────────────────────────────────

describe('GET /autores', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – retorna lista de autores', async () => {
    mockAutores.findMany.mockResolvedValue([autor]);
    const res = await request(app).get('/autores');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([autor]);
  });

  it('500 – erro no banco', async () => {
    mockAutores.findMany.mockRejectedValue(new Error('DB'));
    const res = await request(app).get('/autores');
    expect(res.status).toBe(500);
  });
});

describe('GET /autores/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – retorna autor existente', async () => {
    mockAutores.findUnique.mockResolvedValue(autor);
    const res = await request(app).get('/autores/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(autor);
  });

  it('404 – autor não encontrado', async () => {
    mockAutores.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/autores/99');
    expect(res.status).toBe(404);
  });

  it('400 – ID inválido (string)', async () => {
    const res = await request(app).get('/autores/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /autores', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201 – cria autor com sucesso', async () => {
    mockAutores.findFirst.mockResolvedValue(null);
    mockAutores.create.mockResolvedValue(autor);

    const res = await request(app).post('/autores').send({ nome: 'Machado de Assis' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(autor);
  });

  it('400 – nome ausente', async () => {
    const res = await request(app).post('/autores').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nome/i);
  });

  it('400 – nome não é string', async () => {
    const res = await request(app).post('/autores').send({ nome: 123 });
    expect(res.status).toBe(400);
  });

  it('409 – autor duplicado', async () => {
    mockAutores.findFirst.mockResolvedValue(autor);
    const res = await request(app).post('/autores').send({ nome: 'Machado de Assis' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/já existe/i);
  });

  it('500 – erro no banco', async () => {
    mockAutores.findFirst.mockRejectedValue(new Error('DB'));
    const res = await request(app).post('/autores').send({ nome: 'Novo Autor' });
    expect(res.status).toBe(500);
  });
});

describe('PUT /autores/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – atualiza autor com sucesso', async () => {
    const atualizado = { id: 1, nome: 'Novo Nome' };
    mockAutores.findUnique.mockResolvedValue(autor);
    mockAutores.update.mockResolvedValue(atualizado);

    const res = await request(app).put('/autores/1').send({ nome: 'Novo Nome' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(atualizado);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).put('/autores/abc').send({ nome: 'X' });
    expect(res.status).toBe(400);
  });

  it('400 – nome ausente', async () => {
    const res = await request(app).put('/autores/1').send({});
    expect(res.status).toBe(400);
  });

  it('404 – autor não encontrado', async () => {
    mockAutores.findUnique.mockResolvedValue(null);
    const res = await request(app).put('/autores/99').send({ nome: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /autores/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – deleta autor sem livros vinculados', async () => {
    mockAutores.findUnique.mockResolvedValue(autor);
    mockLivros.count.mockResolvedValue(0);
    mockAutores.delete.mockResolvedValue(autor);

    const res = await request(app).delete('/autores/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(autor);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).delete('/autores/abc');
    expect(res.status).toBe(400);
  });

  it('404 – autor não encontrado', async () => {
    mockAutores.findUnique.mockResolvedValue(null);
    const res = await request(app).delete('/autores/99');
    expect(res.status).toBe(404);
  });

  it('409 – autor com livros vinculados', async () => {
    mockAutores.findUnique.mockResolvedValue(autor);
    mockLivros.count.mockResolvedValue(3);

    const res = await request(app).delete('/autores/1');
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/livros vinculados/i);
  });
});
