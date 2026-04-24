import { jest } from '@jest/globals';
import { validateAdmin, validateColab } from '../src/helpers/common.js';

// ── Utilitário ────────────────────────────────────────────────────────────────

// Monta req, res e next falsos para testar middlewares diretamente
function mockContext(perfil) {
  const req = { usuario: { perfil } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

// ── validateAdmin ─────────────────────────────────────────────────────────────

describe('validateAdmin', () => {
  it('chama next() para perfil admin', async () => {
    const { req, res, next } = mockContext('admin');
    await validateAdmin(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('403 para perfil colab', async () => {
    const { req, res, next } = mockContext('colab');
    await validateAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/insuficientes/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('403 para perfil aluno', async () => {
    const { req, res, next } = mockContext('aluno');
    await validateAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('403 para perfil desconhecido', async () => {
    const { req, res, next } = mockContext('visitante');
    await validateAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── validateColab ─────────────────────────────────────────────────────────────

describe('validateColab', () => {
  it('chama next() para perfil colab', async () => {
    const { req, res, next } = mockContext('colab');
    await validateColab(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('chama next() para perfil admin', async () => {
    const { req, res, next } = mockContext('admin');
    await validateColab(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('403 para perfil aluno', async () => {
    const { req, res, next } = mockContext('aluno');
    await validateColab(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/insuficientes/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('403 para perfil desconhecido', async () => {
    const { req, res, next } = mockContext('visitante');
    await validateColab(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
