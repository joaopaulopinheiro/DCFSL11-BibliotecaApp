import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const secretKey = process.env.SECRET_KEY

export async function login(req, res) {
  const { email, senha } = req.body;

  try {
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { email },
    });

    const isMatch = usuario ? await bcrypt.compare(senha, usuario.senha) : false;

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Validar status do usuário
    if (!['ativo', 'inativo', 'bloqueado'].includes(usuario.status)) {
  return res.status(403).json({ error: 'Status de usuário inválido' });
}

    const payload = {
      userId: usuario.id,
      username: usuario.nome,
      matricula: usuario.matricula,
      perfil: usuario.perfil,
      email: usuario.email,
      curso: usuario.curso,
      status: usuario.status
    }

    const token = jwt.sign(payload, secretKey, { expiresIn: '8h' });

    // Retornar mensagem adicional conforme status
    const response = { token };

    if (usuario.status === 'inativo') {
    response.aviso = 'Sua conta está inativa. Solicite a renovação do status ao administrador.';
  } else if (usuario.status === 'bloqueado') {
    response.aviso = 'Sua conta está bloqueada por atraso na devolução. Regularize com a biblioteca.';
}

    return res.json(response);
  } catch (err) {
    console.error('Prisma query failed (login):', err);
    return res.status(500).json({ error: 'Database connection error' });
  }
}
