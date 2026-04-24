import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockPedidos = {
  findMany:   jest.fn(),
  findUnique: jest.fn(),
  findFirst:  jest.fn(),
  create:     jest.fn(),
  update:     jest.fn(),
  delete:     jest.fn(),
  count:      jest.fn(),
};
const mockUsuarios = { findUnique: jest.fn() };
const mockLivros   = { findUnique: jest.fn(), update: jest.fn() };

jest.unstable_mockModule('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    pedidos:  mockPedidos,
    usuarios: mockUsuarios,
    livros:   mockLivros,
  })),
}));

// ── App ───────────────────────────────────────────────────────────────────────

const {
  getAllPedidos, getPedidoById, createPedido, updatePedido, deletePedido,
  approvePedido, rejectPedido, returnPedido, cancelPedido,
} = await import('../src/controllers/pedidosControllers.js');

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.usuario = { userId: 10, perfil: 'colab' };
  next();
});

app.get('/pedidos',                getAllPedidos);
app.get('/pedidos/:id',            getPedidoById);
app.post('/pedidos',               createPedido);
app.post('/pedidos/:id/cancelar',  cancelPedido);
app.post('/pedidos/:id/aprovar',   approvePedido);
app.post('/pedidos/:id/reprovar',  rejectPedido);
app.post('/pedidos/:id/devolver',  returnPedido);
app.put('/pedidos/:id',            updatePedido);
app.delete('/pedidos/:id',         deletePedido);

// ── Fixtures ──────────────────────────────────────────────────────────────────

const hoje = new Date();
hoje.setUTCHours(0, 0, 0, 0);

const dataPrevista = new Date(hoje);
dataPrevista.setDate(dataPrevista.getDate() + 14);

const pedidoPendente = {
  id: 1, livro_id: 5, usuario_id: 2,
  status: 'pendente', data_inicio: hoje, data_prevista: dataPrevista,
  aprovado_por: null, motivo_reprovacao: null,
  matricula_snapshot: '2024001', cpf_snapshot: '000.000.000-00',
};

const pedidoAprovado = { ...pedidoPendente, status: 'aprovado', aprovado_por: 10 };

const usuarioAtivo = { id: 2, status: 'ativo', matricula: '2024001', cpf: '000.000.000-00' };
const livroComEstoque = { id: 5, titulo: 'Dom Casmurro', estoque: 3 };

// ── Testes ────────────────────────────────────────────────────────────────────

describe('GET /pedidos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – retorna lista de pedidos', async () => {
    mockPedidos.findMany.mockResolvedValue([pedidoPendente]);
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('500 – erro no banco', async () => {
    mockPedidos.findMany.mockRejectedValue(new Error('DB'));
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(500);
  });
});

describe('GET /pedidos/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – retorna pedido existente', async () => {
    mockPedidos.findUnique.mockResolvedValue(pedidoPendente);
    const res = await request(app).get('/pedidos/1');
    expect(res.status).toBe(200);
  });

  it('404 – pedido não encontrado', async () => {
    mockPedidos.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/pedidos/99');
    expect(res.status).toBe(404);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).get('/pedidos/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /pedidos', () => {
  beforeEach(() => jest.clearAllMocks());

  const setup = () => {
    mockUsuarios.findUnique.mockResolvedValue(usuarioAtivo);
    mockLivros.findUnique.mockResolvedValue(livroComEstoque);
    mockPedidos.findFirst.mockResolvedValue(null);   // sem duplicado
    mockPedidos.count.mockResolvedValue(0);           // sem atraso / limite OK
  };

  it('201 – cria pedido com sucesso', async () => {
    setup();
    // findFirst: duplicado = null, atrasado = null
    mockPedidos.findFirst
      .mockResolvedValueOnce(null)  // duplicado
      .mockResolvedValueOnce(null); // atraso
    mockPedidos.count.mockResolvedValue(2); // pedidos ativos < 5
    mockPedidos.create.mockResolvedValue(pedidoPendente);

    const res = await request(app)
      .post('/pedidos')
      .send({ livroId: 5, usuarioId: 2 });

    expect(res.status).toBe(201);
  });

  it('400 – campos obrigatórios ausentes', async () => {
    const res = await request(app).post('/pedidos').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obrigatórios/i);
  });

  it('404 – usuário não encontrado', async () => {
    mockUsuarios.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/pedidos').send({ livroId: 5, usuarioId: 99 });
    expect(res.status).toBe(404);
  });

  it('403 – usuário inativo', async () => {
    mockUsuarios.findUnique.mockResolvedValue({ ...usuarioAtivo, status: 'inativo' });
    const res = await request(app).post('/pedidos').send({ livroId: 5, usuarioId: 2 });
    expect(res.status).toBe(403);
  });

  it('404 – livro não encontrado', async () => {
    mockUsuarios.findUnique.mockResolvedValue(usuarioAtivo);
    mockLivros.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/pedidos').send({ livroId: 99, usuarioId: 2 });
    expect(res.status).toBe(404);
  });

  it('400 – livro sem estoque', async () => {
    mockUsuarios.findUnique.mockResolvedValue(usuarioAtivo);
    mockLivros.findUnique.mockResolvedValue({ ...livroComEstoque, estoque: 0 });
    const res = await request(app).post('/pedidos').send({ livroId: 5, usuarioId: 2 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/estoque/i);
  });

  it('400 – pedido duplicado', async () => {
    mockUsuarios.findUnique.mockResolvedValue(usuarioAtivo);
    mockLivros.findUnique.mockResolvedValue(livroComEstoque);
    mockPedidos.findFirst.mockResolvedValue(pedidoPendente); // duplicado encontrado
    const res = await request(app).post('/pedidos').send({ livroId: 5, usuarioId: 2 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pendente ou aprovado/i);
  });

  it('403 – usuário com pedidos em atraso', async () => {
    mockUsuarios.findUnique.mockResolvedValue(usuarioAtivo);
    mockLivros.findUnique.mockResolvedValue(livroComEstoque);
    mockPedidos.findFirst
      .mockResolvedValueOnce(null)           // sem duplicado
      .mockResolvedValueOnce(pedidoAprovado); // pedido atrasado
    const res = await request(app).post('/pedidos').send({ livroId: 5, usuarioId: 2 });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/atraso/i);
  });

  it('400 – limite de 5 livros atingido', async () => {
    mockUsuarios.findUnique.mockResolvedValue(usuarioAtivo);
    mockLivros.findUnique.mockResolvedValue(livroComEstoque);
    mockPedidos.findFirst
      .mockResolvedValueOnce(null)  // sem duplicado
      .mockResolvedValueOnce(null); // sem atraso
    mockPedidos.count.mockResolvedValue(5); // 5 pedidos ativos
    const res = await request(app).post('/pedidos').send({ livroId: 5, usuarioId: 2 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/limite/i);
  });
});

describe('POST /pedidos/:id/cancelar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – cancela pedido pendente do próprio usuário', async () => {
    // req.usuario.userId = 10; pedido.usuario_id = 10
    const pedidoDoUsuario = { ...pedidoPendente, usuario_id: 10 };
    mockPedidos.findUnique.mockResolvedValue(pedidoDoUsuario);
    mockPedidos.update.mockResolvedValue({ ...pedidoDoUsuario, status: 'cancelado' });

    const res = await request(app).post('/pedidos/1/cancelar');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelado');
  });

  it('403 – tentar cancelar pedido de outro usuário', async () => {
    // pedido.usuario_id = 2, req.usuario.userId = 10
    mockPedidos.findUnique.mockResolvedValue(pedidoPendente);
    const res = await request(app).post('/pedidos/1/cancelar');
    expect(res.status).toBe(403);
  });

  it('400 – pedido não está pendente', async () => {
    mockPedidos.findUnique.mockResolvedValue({ ...pedidoPendente, usuario_id: 10, status: 'aprovado' });
    const res = await request(app).post('/pedidos/1/cancelar');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pendentes/i);
  });

  it('404 – pedido não encontrado', async () => {
    mockPedidos.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/pedidos/99/cancelar');
    expect(res.status).toBe(404);
  });
});

describe('POST /pedidos/:id/aprovar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – aprova pedido pendente', async () => {
    mockPedidos.findUnique.mockResolvedValue(pedidoPendente);
    mockPedidos.update.mockResolvedValue(pedidoAprovado);

    const res = await request(app).post('/pedidos/1/aprovar');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('aprovado');
  });

  it('400 – pedido não está pendente', async () => {
    mockPedidos.findUnique.mockResolvedValue(pedidoAprovado);
    const res = await request(app).post('/pedidos/1/aprovar');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pendentes/i);
  });

  it('404 – pedido não encontrado', async () => {
    mockPedidos.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/pedidos/99/aprovar');
    expect(res.status).toBe(404);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).post('/pedidos/abc/aprovar');
    expect(res.status).toBe(400);
  });
});

describe('POST /pedidos/:id/reprovar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – reprova pedido pendente com motivo', async () => {
    mockPedidos.findUnique.mockResolvedValue(pedidoPendente);
    mockPedidos.update.mockResolvedValue({ ...pedidoPendente, status: 'reprovado', motivo_reprovacao: 'Sem justificativa' });

    const res = await request(app)
      .post('/pedidos/1/reprovar')
      .send({ motivo_reprovacao: 'Sem justificativa' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('reprovado');
  });

  it('400 – motivo ausente', async () => {
    const res = await request(app).post('/pedidos/1/reprovar').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/motivo/i);
  });

  it('400 – pedido não está pendente', async () => {
    mockPedidos.findUnique.mockResolvedValue(pedidoAprovado);
    const res = await request(app).post('/pedidos/1/reprovar').send({ motivo_reprovacao: 'X' });
    expect(res.status).toBe(400);
  });

  it('404 – pedido não encontrado', async () => {
    mockPedidos.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/pedidos/99/reprovar').send({ motivo_reprovacao: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('POST /pedidos/:id/devolver', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – devolve livro no prazo', async () => {
    const pedidoComLivro = {
      ...pedidoAprovado,
      livros: livroComEstoque,
      data_prevista: dataPrevista, // futuro
    };
    mockPedidos.findUnique.mockResolvedValue(pedidoComLivro);
    mockPedidos.update.mockResolvedValue({ ...pedidoComLivro, status: 'devolvido', data_entrega: hoje });
    mockLivros.update.mockResolvedValue({ ...livroComEstoque, estoque: 4 });

    const res = await request(app).post('/pedidos/1/devolver');
    expect(res.status).toBe(200);
    expect(res.body.aviso).toMatch(/sucesso/i);
  });

  it('200 – devolve livro com atraso', async () => {
    const dataAtrasada = new Date(hoje);
    dataAtrasada.setDate(dataAtrasada.getDate() - 3); // 3 dias atrás
    const pedidoAtrasado = {
      ...pedidoAprovado, livros: livroComEstoque, data_prevista: dataAtrasada,
    };
    mockPedidos.findUnique.mockResolvedValue(pedidoAtrasado);
    mockPedidos.update.mockResolvedValue({ ...pedidoAtrasado, status: 'devolvido' });
    mockLivros.update.mockResolvedValue(livroComEstoque);

    const res = await request(app).post('/pedidos/1/devolver');
    expect(res.status).toBe(200);
    expect(res.body.aviso).toMatch(/atraso/i);
  });

  it('400 – pedido não está aprovado', async () => {
    mockPedidos.findUnique.mockResolvedValue({ ...pedidoPendente, livros: livroComEstoque });
    const res = await request(app).post('/pedidos/1/devolver');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/aprovados/i);
  });

  it('404 – pedido não encontrado', async () => {
    mockPedidos.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/pedidos/99/devolver');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /pedidos/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 – deleta pedido existente', async () => {
    mockPedidos.findUnique.mockResolvedValue(pedidoPendente);
    mockPedidos.delete.mockResolvedValue(pedidoPendente);

    const res = await request(app).delete('/pedidos/1');
    expect(res.status).toBe(200);
  });

  it('404 – pedido não encontrado', async () => {
    mockPedidos.findUnique.mockResolvedValue(null);
    const res = await request(app).delete('/pedidos/99');
    expect(res.status).toBe(404);
  });

  it('400 – ID inválido', async () => {
    const res = await request(app).delete('/pedidos/abc');
    expect(res.status).toBe(400);
  });
});
