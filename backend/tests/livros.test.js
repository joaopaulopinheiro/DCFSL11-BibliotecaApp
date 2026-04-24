import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockLivros = {
  findMany:   jest.fn(),
  findUnique: jest.fn(),
  create:     jest.fn(),
  update:     jest.fn(),
  delete:     jest.fn(),
};
const mockPedidos = { count: jest.fn() };

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    livros:  mockLivros,
    pedidos: mockPedidos,
  })),
}));

// Multer precisa ser mockado pois o upload.single() seria middleware real
jest.unstable_mockModule('multer', () => {
  const multerMock = () => ({
    single: () => (req, _res, next) => { req.file = null; next(); },
  });
  multerMock.diskStorage = jest.fn(() => ({}));
  return { default: multerMock };
});

// ── App ───────────────────────────────────────────────────────────────────────

const {
  getLivros, getLivroById, createLivro, updateLivro, deleteLivro, getCatalogo,
} = await import('../src/controllers/livrosControllers.js');

const app = express();
app.use(express.json());
app.use((req, _res, next) => { req.usuario = { userId: 1, perfil: 'colab' }; next(); });

// Simula o middleware do multer (sem upload real)
const noopUpload = (req, _res, next) => { req.file = null; next(); };

app.get('/livros/catalogo', getCatalogo);
app.get('/livros',          getLivros);
app.get('/livros/:id',      getLivroById);
app.post('/livros',         noopUpload, createLivro);
app.put('/livros/:id',      noopUpload, updateLivro);
app.delete('/livros/:id',   deleteLivro);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const livro = {
  id: 1, titulo: 'Dom Casmurro', descricao: null, edicao: '1ª',
  autorId: 1, categoriaId: 2, img: null, idioma: 'Português',
  num_paginas: 256, editora: 'Ática', estoque: 5,
  data_publicacao: null,
  autores:    { id: 1, nome: 'Machado de Assis' },
  categorias: { id: 2, nome: 'Romance' },
};

const payloadCreate = {
  titulo: 'Dom Casmurro', autorId: '1', categoriaId: '2',
  idioma: 'Português', editora: 'Ática', num_paginas: '256', estoque: '5',
};

// ── Testes ────────────────────────────────────────────────────────────────────

describe('GET /livros', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – retorna lista de livros', async () => {
    mockLivros.findMany.mockResolvedValue([livro]);
    const res = await request(app).get('/livros');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('500 – erro no banco', async () => {
    mockLivros.findMany.mockRejectedValue(new Error('DB'));
    const res = await request(app).get('/livros');
    expect(res.status).toBe(500);
  });
});

describe('GET /livros/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – retorna livro existente', async () => {
    mockLivros.findUnique.mockResolvedValue(livro);
    const res = await request(app).get('/livros/1');
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Dom Casmurro');
  });

  it('404 – livro não encontrado', async () => {
    mockLivros.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/livros/99');
    expect(res.status).toBe(404);
  });

  it('400 – ID inválido (string)', async () => {
    const res = await request(app).get('/livros/abc');
    expect(res.status).toBe(400);
  });

  it('400 – ID zero', async () => {
    const res = await request(app).get('/livros/0');
    expect(res.status).toBe(400);
  });
});

describe('GET /livros/catalogo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – retorna catálogo com disponibilidade para colab', async () => {
    mockLivros.findMany.mockResolvedValue([livro]);
    mockPedidos.count.mockResolvedValue(1); // 1 pedido ativo → disponivel = 4

    const res = await request(app).get('/livros/catalogo');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('disponivel', 4);
    expect(res.body[0]).toHaveProperty('estoque_total', 5);
  });

  it('200 – aluno não vê livros sem disponibilidade', async () => {
    // Substituir o middleware de usuário por aluno neste teste
    const appAluno = express();
    appAluno.use(express.json());
    appAluno.use((req, _res, next) => { req.usuario = { perfil: 'aluno' }; next(); });
    appAluno.get('/livros/catalogo', getCatalogo);

    mockLivros.findMany.mockResolvedValue([livro]);
    mockPedidos.count.mockResolvedValue(5); // estoque=5, pedidos=5 → disponivel=0

    const res = await request(appAluno).get('/livros/catalogo');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0); // filtrado para aluno
  });

  it('500 – erro no banco', async () => {
    mockLivros.findMany.mockRejectedValue(new Error('DB'));
    const res = await request(app).get('/livros/catalogo');
    expect(res.status).toBe(500);
  });
});

describe('POST /livros', () => {
  beforeEach(() => jest.clearAllMocks());

  it('201 – cria livro com sucesso', async () => {
    mockLivros.create.mockResolvedValue(livro);
    const res = await request(app).post('/livros').send(payloadCreate);
    expect(res.status).toBe(201);
  });

  it('400 – titulo ausente', async () => {
    const { titulo, ...semTitulo } = payloadCreate;
    const res = await request(app).post('/livros').send(semTitulo);
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.stringMatching(/titulo/i)]));
  });

  it('400 – autorId ausente', async () => {
    const { autorId, ...semAutor } = payloadCreate;
    const res = await request(app).post('/livros').send(semAutor);
    expect(res.status).toBe(400);
  });

  it('400 – categoriaId ausente', async () => {
    const { categoriaId, ...semCategoria } = payloadCreate;
    const res = await request(app).post('/livros').send(semCategoria);
    expect(res.status).toBe(400);
  });

  it('400 – titulo excede 200 caracteres', async () => {
    const res = await request(app)
      .post('/livros')
      .send({ ...payloadCreate, titulo: 'a'.repeat(201) });
    expect(res.status).toBe(400);
  });

  it('400 – estoque negativo', async () => {
    const res = await request(app)
      .post('/livros')
      .send({ ...payloadCreate, estoque: '-1' });
    expect(res.status).toBe(400);
  });

  it('409 – chave estrangeira inválida (P2003)', async () => {
    const p2003 = Object.assign(new Error('FK'), { code: 'P2003' });
    mockLivros.create.mockRejectedValue(p2003);

    const res = await request(app).post('/livros').send(payloadCreate);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/chave estrangeira/i);
  });

  it('500 – erro genérico no banco', async () => {
    mockLivros.create.mockRejectedValue(new Error('DB'));
    const res = await request(app).post('/livros').send(payloadCreate);
    expect(res.status).toBe(500);
  });
});

describe('PUT /livros/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – atualiza livro com sucesso', async () => {
    const atualizado = { ...livro, titulo: 'Memórias Póstumas' };
    mockLivros.update.mockResolvedValue(atualizado);

    const res = await request(app)
      .put('/livros/1')
      .send({ titulo: 'Memórias Póstumas', autorId: '1', categoriaId: '2' });

    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Memórias Póstumas');
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).put('/livros/abc').send({ titulo: 'X' });
    expect(res.status).toBe(400);
  });

  it('400 – titulo excede 200 caracteres', async () => {
    const res = await request(app)
      .put('/livros/1')
      .send({ titulo: 'a'.repeat(201) });
    expect(res.status).toBe(400);
  });

  it('404 – livro não encontrado (P2025)', async () => {
    const p2025 = Object.assign(new Error('Not found'), { code: 'P2025' });
    mockLivros.update.mockRejectedValue(p2025);

    const res = await request(app)
      .put('/livros/99')
      .send({ titulo: 'X', autorId: '1', categoriaId: '2' });

    expect(res.status).toBe(404);
  });

  it('409 – chave estrangeira inválida (P2003)', async () => {
    const p2003 = Object.assign(new Error('FK'), { code: 'P2003' });
    mockLivros.update.mockRejectedValue(p2003);

    const res = await request(app)
      .put('/livros/1')
      .send({ titulo: 'X', autorId: '99', categoriaId: '2' });

    expect(res.status).toBe(409);
  });
});

describe('DELETE /livros/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – deleta livro sem pedidos', async () => {
    mockPedidos.count.mockResolvedValue(0);
    mockLivros.delete.mockResolvedValue(livro);

    const res = await request(app).delete('/livros/1');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sucesso/i);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).delete('/livros/abc');
    expect(res.status).toBe(400);
  });

  it('409 – livro com pedidos vinculados', async () => {
    mockPedidos.count.mockResolvedValue(2);
    const res = await request(app).delete('/livros/1');
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/pedidos vinculados/i);
  });

  it('404 – livro não encontrado (P2025)', async () => {
    mockPedidos.count.mockResolvedValue(0);
    const p2025 = Object.assign(new Error('Not found'), { code: 'P2025' });
    mockLivros.delete.mockRejectedValue(p2025);

    const res = await request(app).delete('/livros/99');
    expect(res.status).toBe(404);
  });
});
