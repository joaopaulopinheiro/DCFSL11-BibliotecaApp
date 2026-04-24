import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// lista todos os pedidos
export async function getAllPedidos(req, res) {
  try {
    const pedidos = await prisma.pedidos.findMany({orderBy: { id: 'asc' }   });
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// lista um pedido por ID
export async function getPedidoById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const pedido = await prisma.pedidos.findUnique({ where: { id } });
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    } else {
      res.json(pedido);
    }
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// cria um novo pedido
export async function createPedido(req, res) {
  try {
    const { livroId, usuarioId } = req.body;
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);

    // 1. Validar campos obrigatórios
    if (!livroId || !usuarioId) {
      return res.status(400).json({ error: 'Campos livroId e usuarioId são obrigatórios' });
    }

    // 2. Validar se usuário existe e está ativo
    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (usuario.status !== 'ativo') {
      return res.status(403).json({ error: 'Usuário inativo ou bloqueado. Operação não permitida.' });
    }

    // 3. Validar se livro existe e tem estoque disponível
    const livro = await prisma.livros.findUnique({
      where: { id: livroId }
    });

    if (!livro) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    if (!livro.estoque || livro.estoque <= 0) {
      return res.status(400).json({ error: 'Livro não disponível. Estoque insuficiente.' });
    }

    // 4. Validar se não tem pedido pendente ou aprovado para o mesmo livro
    const pedidoDuplicado = await prisma.pedidos.findFirst({
      where: {
        usuario_id: usuarioId,
        livro_id: livroId,
        status: {
          in: ['pendente', 'aprovado']
        }
      }
    });

    if (pedidoDuplicado) {
      return res.status(400).json({ error: 'Você já tem um pedido pendente ou aprovado para este livro.' });
    }

    // 5. Validar se usuário tem atraso (pedido com data_prevista < hoje)
    const pedidoAtrasado = await prisma.pedidos.findFirst({
      where: {
        usuario_id: usuarioId,
        data_prevista: {
          lt: hoje
        },
        status: {
          in: ['aprovado']
        }
      }
    });

    if (pedidoAtrasado) {
      return res.status(403).json({ error: 'Você tem pedidos em atraso. Regularize antes de criar novos pedidos.' });
    }

    // 6. Validar limite de 5 livros ativos
    const pedidosAtivos = await getPedidosAtivos(usuarioId);

    if (pedidosAtivos >= 5) {
      return res.status(400).json({ error: 'Limite de 5 livros simultâneos atingido. Devolva alguns livros antes de pedir novos.' });
    }

    // 7. Criar pedido com snapshot de matrícula/CPF e UUID
    const data_limite = new Date(hoje);
    data_limite.setDate(data_limite.getDate() + 14); // 14 dias

    const novoPedido = await prisma.pedidos.create({
      data: {
        livro_id: livroId,
        usuario_id: usuarioId,
        data_inicio: hoje,
        data_prevista: data_limite,
        status: 'pendente',
        matricula_snapshot: usuario.matricula,
        cpf_snapshot: usuario.cpf
      }
    });

    res.status(201).json(novoPedido);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// cancela um pedido (pelo próprio aluno)
export async function cancelPedido(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const pedido = await prisma.pedidos.findUnique({ where: { id } });
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Só permite cancelar se for o próprio usuário e o pedido estiver pendente
    if (pedido.usuario_id !== req.usuario.userId) {
      return res.status(403).json({ error: 'Você não pode cancelar o pedido de outro usuário.' });
    }

    if (pedido.status !== 'pendente') {
      return res.status(400).json({ error: 'Apenas pedidos pendentes podem ser cancelados.' });
    }

    const pedidoAtualizado = await prisma.pedidos.update({
      where: { id },
      data: { status: 'cancelado' }
    });

    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// atualiza um pedido existente
export async function updatePedido(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { livroId, usuarioId, data_inicio, data_prevista } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    if (!livroId || !usuarioId || !data_inicio || !data_prevista) {
      return res.status(400).json({ error: 'Campos livroId, usuarioId, data_inicio, data_prevista são obrigatórios' });
    }

    const pedidoExistente = await prisma.pedidos.findUnique({ where: { id } });
    if (!pedidoExistente) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const pedidoAtualizado = await prisma.pedidos.update({
      where: { id },
      data: { livroId, usuarioId, data_inicio, data_prevista },
    });

    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// deleta um pedido
export async function deletePedido(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const pedidoExistente = await prisma.pedidos.findUnique({ where: { id } });
    if (!pedidoExistente) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    await prisma.pedidos.delete({ where: { id } });
    res.status(200).json(pedidoExistente);
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Helper: contar pedidos ativos de um usuário
export async function getPedidosAtivos(usuarioId) {
  try {
    const pedidosAtivos = await prisma.pedidos.count({
      where: {
        usuario_id: usuarioId,
        status: {
          in: ['pendente', 'aprovado']
        }
      }
    });
    return pedidosAtivos;
  } catch (error) {
    console.error('Erro ao contar pedidos ativos:', error);
    throw error;
  }
}

// aprova um pedido (colab/admin)
export async function approvePedido(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Pegar aprovado_por do token (não do body)
    const aprovado_por = req.usuario?.userId;

    if (!aprovado_por) {
      return res.status(401).json({ error: 'Usuário não identificado no token.' });
    }

    const pedido = await prisma.pedidos.findUnique({ where: { id } });
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    if (pedido.status !== 'pendente') {
      return res.status(400).json({ error: 'Apenas pedidos pendentes podem ser aprovados.' });
    }

    const pedidoAtualizado = await prisma.pedidos.update({
      where: { id },
      data: {
        status: 'aprovado',
        aprovado_por: aprovado_por
      }
    });

    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao aprovar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// rejeita um pedido (colab/admin)
export async function rejectPedido(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { motivo_reprovacao } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Validar que motivo está preenchido
    if (!motivo_reprovacao) {
      return res.status(400).json({ error: 'Campo motivo_reprovacao é obrigatório' });
    }

    // Buscar pedido
    const pedido = await prisma.pedidos.findUnique({ where: { id } });
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Validar que pedido está pendente
    if (pedido.status !== 'pendente') {
      return res.status(400).json({ error: 'Apenas pedidos pendentes podem ser reprovados.' });
    }

    // Atualizar pedido: status = reprovado, motivo_reprovacao
    const pedidoAtualizado = await prisma.pedidos.update({
      where: { id },
      data: {
        status: 'reprovado',
        motivo_reprovacao: motivo_reprovacao
      }
    });

    res.json(pedidoAtualizado);
  } catch (error) {
    console.error('Erro ao rejeitar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// devolve um livro (colab/admin)
export async function returnPedido(req, res) {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Buscar pedido
    const pedido = await prisma.pedidos.findUnique({
      where: { id },
      include: { livros: true }
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Validar que pedido está aprovado
    if (pedido.status !== 'aprovado') {
      return res.status(400).json({ error: 'Apenas pedidos aprovados podem ser devolvidos.' });
    }

    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);

    // Atualizar pedido: status = devolvido, data_entrega = hoje
    const pedidoAtualizado = await prisma.pedidos.update({
      where: { id },
      data: {
        status: 'devolvido',
        data_entrega: hoje
      }
    });

    // Incrementar estoque do livro
    await prisma.livros.update({
      where: { id: pedido.livro_id },
      data: {
        estoque: {
          increment: 1
        }
      }
    });

    res.json({
      ...pedidoAtualizado,
      aviso: pedido.data_prevista && pedido.data_prevista < hoje ? 'Livro devolvido com atraso' : 'Livro devolvido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao devolver pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
