import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Valida se a senha tem pelo menos 8 caracteres
function validateSenha(senha) {
  if (!senha || senha.length < 8) {
    return { valido: false, erro: 'Senha deve ter no mínimo 8 caracteres' };
  }
  return { valido: true };
}

export async function getUsuarios(req, res) {
  try {
    const usuarios = await prisma.usuarios.findMany({
      where: { status: { not: 'deletado' } }, // Excluir usuários bloqueados da listagem
    });
    res.json(usuarios);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
}

export async function getUsuarioById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { id },
      where: { status: { not: 'deletado' } }, // Excluir usuários bloqueados
    });
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
}

export async function createUsuario(req, res) {
  const { nome, matricula, perfil, curso, cpf, data_nascimento, email, senha, status } = req.body;

  if (!nome || !cpf || !email || !senha || !perfil || !status || !data_nascimento) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, cpf, email, senha, perfil, status, data_nascimento' });
  }

  // Validar senha
  const validacaoSenha = validateSenha(senha);
  if (!validacaoSenha.valido) {
    return res.status(400).json({ error: validacaoSenha.erro });
  }

  // Criptografar a senha
  const saltoHash = 10;
  const hashedSenha = await bcrypt.hash(senha, saltoHash);

  try {
    const usuario = await prisma.usuarios.create({
      data: {
        nome,
        matricula,
        perfil,
        curso,
        cpf,
        data_nascimento: new Date(data_nascimento),
        email,
        senha: hashedSenha,
        status,
      },
    });
    res.status(201).json(usuario);
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe um usuário com este CPF, Email ou Matrícula.' });
    }
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
}

export async function updateUsuario(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });

  const { nome, matricula, perfil, curso, cpf, data_nascimento, email, senha, status } = req.body;

  // Validar senha se for fornecida
  if (senha) {
    const validacaoSenha = validateSenha(senha);
    if (!validacaoSenha.valido) {
      return res.status(400).json({ error: validacaoSenha.erro });
    }
  }

  const saltoHash = 10;
  const hashedSenha = senha ? await bcrypt.hash(senha, saltoHash) : undefined;

  try {
    const usuario = await prisma.usuarios.update({
      where: { id },
      data: {
        nome,
        matricula,
        perfil,
        curso,
        cpf,
        data_nascimento: data_nascimento ? new Date(data_nascimento) : undefined,
        email,
        senha: hashedSenha,
        status,
      },
    });
    res.json(usuario);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe um usuário com este CPF, Email ou Matrícula.' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
}

// Altera o status de um usuário (admin)
export async function changeStatusUsuario(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });

  const { status } = req.body;
  if (!status || !['ativo', 'inativo', 'bloqueado'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Deve ser entre: ativo | inativo | bloqueado' });
  }

  try {
    const usuario = await prisma.usuarios.findUnique({ where: { id } });
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    const usuarioAtualizado = await prisma.usuarios.update({
      where: { id },
      data: { status },
    });
    res.json(usuarioAtualizado);
  } catch (err) {
    console.error('Erro ao alterar status do usuário:', err);
    res.status(500).json({ error: 'Erro ao alterar status do usuário' });
  }
}

export async function deleteUsuario(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });

  try {
    const usuarioAtualizado = await prisma.usuarios.update({
      where: { id },
      data: { status: 'deletado' }  // Marca como deletado
    });
    res.json(usuarioAtualizado);
  } catch (err) {
    console.error('Erro ao deletar usuário:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
}
