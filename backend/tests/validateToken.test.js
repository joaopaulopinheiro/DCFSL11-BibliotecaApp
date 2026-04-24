import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockVerify = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: mockVerify, sign: jest.fn() },
}));

// ── App ───────────────────────────────────────────────────────────────────────

const { validateToken } = await import('../src/controllers/validateTokenControllers.js');

const app = express();
app.use(express.json());

// Rota de teste: validateToken como middleware + handler que confirma sucesso
app.get('/validate-token', validateToken, (req, res) => {
  res.json({ ok: true, usuario: req.usuario });
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const decoded = {
  userId: 1, username: 'Maria', perfil: 'aluno',
  email: 'maria@teste.com', status: 'ativo',
};

// ── Testes ────────────────────────────────────────────────────────────────────

describe('GET /validate-token', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Token ausente ─────────────────────────────────────────────────────────

  it('401 – sem header Authorization', async () => {
    const res = await request(app).get('/validate-token');
    expect(res.status).toBe(401);
    expect(res.body.mensagem).toMatch(/não fornecido/i);
  });

  it('401 – header Authorization sem o Bearer token', async () => {
    const res = await request(app)
      .get('/validate-token')
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
    expect(res.body.mensagem).toMatch(/não fornecido/i);
  });

  // ── Token inválido / expirado ─────────────────────────────────────────────

  it('403 – token inválido', async () => {
    mockVerify.mockImplementation((_token, _key, cb) =>
      cb(new Error('invalid signature'), null)
    );

    const res = await request(app)
      .get('/validate-token')
      .set('Authorization', 'Bearer token.invalido.aqui');

    expect(res.status).toBe(403);
    expect(res.body.mensagem).toMatch(/inválido ou expirado/i);
  });

  it('403 – token expirado', async () => {
    const expiredErr = Object.assign(new Error('jwt expired'), { name: 'TokenExpiredError' });
    mockVerify.mockImplementation((_token, _key, cb) => cb(expiredErr, null));

    const res = await request(app)
      .get('/validate-token')
      .set('Authorization', 'Bearer token.expirado.aqui');

    expect(res.status).toBe(403);
    expect(res.body.mensagem).toMatch(/inválido ou expirado/i);
  });

  // ── Token válido ──────────────────────────────────────────────────────────

  it('200 – token válido: prossegue para a rota e expõe req.usuario', async () => {
    mockVerify.mockImplementation((_token, _key, cb) => cb(null, decoded));

    const res = await request(app)
      .get('/validate-token')
      .set('Authorization', 'Bearer token.valido.aqui');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.usuario).toMatchObject({ userId: 1, perfil: 'aluno' });
  });

  it('200 – token válido com perfil admin', async () => {
    const adminDecoded = { ...decoded, perfil: 'admin' };
    mockVerify.mockImplementation((_token, _key, cb) => cb(null, adminDecoded));

    const res = await request(app)
      .get('/validate-token')
      .set('Authorization', 'Bearer token.admin.aqui');

    expect(res.status).toBe(200);
    expect(res.body.usuario.perfil).toBe('admin');
  });

  // ── Formato do header ─────────────────────────────────────────────────────

  it('401 – header Authorization sem prefixo Bearer', async () => {
    // Sem "Bearer ", o split não extrai o token corretamente
    const res = await request(app)
      .get('/validate-token')
      .set('Authorization', 'token.sem.prefixo');

    // O split resulta em token = undefined → 401
    expect(res.status).toBe(401);
  });
});
