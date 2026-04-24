import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCategorias = {
  findMany:   jest.fn(),
  findUnique: jest.fn(),
  findFirst:  jest.fn(),
  create:     jest.fn(),
  update:     jest.fn(),
  delete:     jest.fn(),
};
const mockLivros = { count: jest.fn() };

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    categorias: mockCategorias,
    livros:     mockLivros,
  })),
}));

// ── App ───────────────────────────────────────────────────────────────────────

const {
  getAllCategorias, getCategoriaById, createCategoria, updateCategoria, deleteCategoria,
} = await import('../src/controllers/categoriasControllers.js');

const app = express();
app.use(express.json());
app.use((req, _res, next) => { req.usuario = { perfil: 'admin' }; next(); });

app.get('/categorias',      getAllCategorias);
app.get('/categorias/:id',  getCategoriaById);
app.post('/categorias',     createCategoria);
app.put('/categorias/:id',  updateCategoria);
app.delete('/categorias/:id', deleteCategoria);

// ── Fixture ───────────────────────────────────────────────────────────────────

const categoria = { id: 1, nome: 'Romance' };

// ── Testes ────────────────────────────────────────────────────────────────────

describe('GET /categorias', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – lista todas as categorias', async () => {
    mockCategorias.findMany.mockResolvedValue([categoria]);
    const res = await request(app).get('/categorias');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([categoria]);
  });

  it('500 – erro no banco', async () => {
    mockCategorias.findMany.mockRejectedValue(new Error('DB'));
    const res = await request(app).get('/categorias');
    expect(res.status).toBe(500);
  });
});

describe('GET /categorias/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – retorna categoria existente', async () => {
    mockCategorias.findUnique.mockResolvedValue(categoria);
    const res = await request(app).get('/categorias/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(categoria);
  });

  it('404 – categoria não encontrada', async () => {
    mockCategorias.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/categorias/99');
    expect(res.status).toBe(404);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).get('/categorias/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /categorias', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201 – cria categoria com sucesso', async () => {
    mockCategorias.findFirst.mockResolvedValue(null);
    mockCategorias.create.mockResolvedValue(categoria);

    const res = await request(app).post('/categorias').send({ nome: 'Romance' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(categoria);
  });

  it('400 – nome ausente', async () => {
    const res = await request(app).post('/categorias').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nome/i);
  });

  it('400 – nome não é string', async () => {
    const res = await request(app).post('/categorias').send({ nome: true });
    expect(res.status).toBe(400);
  });

  it('409 – categoria duplicada', async () => {
    mockCategorias.findFirst.mockResolvedValue(categoria);
    const res = await request(app).post('/categorias').send({ nome: 'Romance' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/já existe/i);
  });

  it('500 – erro no banco', async () => {
    mockCategorias.findFirst.mockRejectedValue(new Error('DB'));
    const res = await request(app).post('/categorias').send({ nome: 'Ficção' });
    expect(res.status).toBe(500);
  });
});

describe('PUT /categorias/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – atualiza categoria com sucesso', async () => {
    const atualizada = { id: 1, nome: 'Ficção Científica' };
    mockCategorias.findUnique.mockResolvedValue(categoria);
    mockCategorias.update.mockResolvedValue(atualizada);

    const res = await request(app).put('/categorias/1').send({ nome: 'Ficção Científica' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(atualizada);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).put('/categorias/abc').send({ nome: 'X' });
    expect(res.status).toBe(400);
  });

  it('400 – nome ausente', async () => {
    const res = await request(app).put('/categorias/1').send({});
    expect(res.status).toBe(400);
  });

  it('404 – categoria não encontrada', async () => {
    mockCategorias.findUnique.mockResolvedValue(null);
    const res = await request(app).put('/categorias/99').send({ nome: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /categorias/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – deleta categoria sem livros vinculados', async () => {
    mockCategorias.findUnique.mockResolvedValue(categoria);
    mockLivros.count.mockResolvedValue(0);
    mockCategorias.delete.mockResolvedValue(categoria);

    const res = await request(app).delete('/categorias/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(categoria);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).delete('/categorias/abc');
    expect(res.status).toBe(400);
  });

  it('404 – categoria não encontrada', async () => {
    mockCategorias.findUnique.mockResolvedValue(null);
    const res = await request(app).delete('/categorias/99');
    expect(res.status).toBe(404);
  });

  it('409 – categoria com livros vinculados', async () => {
    mockCategorias.findUnique.mockResolvedValue(categoria);
    mockLivros.count.mockResolvedValue(2);

    const res = await request(app).delete('/categorias/1');
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/livros vinculados/i);
  });
});
