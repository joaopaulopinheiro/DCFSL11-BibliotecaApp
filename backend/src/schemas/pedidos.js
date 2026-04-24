export const pedidosSchema = {
  Pedido: {
    type: 'object',
    required: ['id', 'uuid', 'livro_id', 'usuario_id', 'status'],
    properties: {
      id: { type: 'integer', description: 'ID único do pedido', example: 1 },
      uuid: { type: 'string', format: 'uuid', description: 'UUID único do pedido (CUID)', example: 'clg5z8b9v0000' },
      livro_id: { type: 'integer', description: 'ID do livro solicitado', example: 3 },
      usuario_id: { type: 'integer', description: 'ID do usuário que criou o pedido', example: 2 },
      data_inicio: { type: 'string', format: 'date', description: 'Data de início do empréstimo', nullable: true, example: '2024-04-07' },
      data_prevista: { type: 'string', format: 'date', description: 'Data prevista de devolução', nullable: true, example: '2024-04-21' },
      data_entrega: { type: 'string', format: 'date', description: 'Data real de entrega do livro', nullable: true, example: '2024-04-21' },
      status: { type: 'string', description: 'Status do pedido (pendente, aprovado, devolvido)', enum: ['pendente', 'aprovado', 'devolvido'], example: 'pendente' },
      aprovado_por: { type: 'integer', description: 'ID do usuário (colaborador) que aprovou o pedido', nullable: true, example: 5 },
      motivo_reprovacao: { type: 'string', description: 'Motivo da rejeição do pedido', nullable: true, example: 'Livro não disponível' },
      matricula_snapshot: { type: 'string', description: 'Matrícula do usuário no momento do pedido', nullable: true, example: '2024001' },
      cpf_snapshot: { type: 'string', description: 'CPF do usuário no momento do pedido', nullable: true, example: '123.456.789-00' },
    },
  },
  PedidoInput: {
    type: 'object',
    required: ['livroId', 'usuarioId'],
    properties: {
      livroId: { type: 'integer', description: 'ID do livro a emprestar', example: 3 },
      usuarioId: { type: 'integer', description: 'ID do usuário solicitante', example: 2 },
    },
  },
  PedidoAprovacao: {
    type: 'object',
    properties: {
      data_inicio: { type: 'string', format: 'date', description: 'Data de início do empréstimo', example: '2024-04-07' },
      data_prevista: { type: 'string', format: 'date', description: 'Data prevista de devolução', example: '2024-04-21' },
    },
  },
  PedidoReprovacao: {
    type: 'object',
    required: ['motivo_reprovacao'],
    properties: {
      motivo_reprovacao: { type: 'string', description: 'Motivo da rejeição', example: 'Livro indisponível' },
    },
  },
};

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer' },
  example: 1,
};

const resPedido = {
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Pedido' } } },
};
const resErro = {
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
};

export const pedidosPaths = {
  '/pedidos': {
    get: {
      tags: ['Pedidos'],
      summary: 'Lista todos os pedidos',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Lista retornada com sucesso', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Pedido' } } } } },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
    post: {
      tags: ['Pedidos'],
      summary: 'Cria um novo pedido',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PedidoInput' } } } },
      responses: {
        201: { description: 'Pedido criado com sucesso', ...resPedido },
        400: { description: 'Campos obrigatórios ausentes ou inválidos', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        403: { description: 'Acesso negado — requer privilégios de administrador', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
  },
  '/pedidos/{id}': {
    get: {
      tags: ['Pedidos'],
      summary: 'Busca um pedido pelo ID',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        200: { description: 'Pedido encontrado', ...resPedido },
        400: { description: 'ID inválido', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        404: { description: 'Pedido não encontrado', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
    put: {
      tags: ['Pedidos'],
      summary: 'Atualiza um pedido existente',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PedidoInput' } } } },
      responses: {
        200: { description: 'Pedido atualizado com sucesso', ...resPedido },
        400: { description: 'Dados inválidos', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        403: { description: 'Acesso negado — requer privilégios de administrador', ...resErro },
        404: { description: 'Pedido não encontrado', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
    delete: {
      tags: ['Pedidos'],
      summary: 'Remove um pedido',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        200: { description: 'Pedido removido com sucesso', ...resPedido },
        400: { description: 'ID inválido', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        403: { description: 'Acesso negado — requer privilégios de administrador', ...resErro },
        404: { description: 'Pedido não encontrado', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
  },
  '/pedidos/{id}/aprovar': {
    post: {
      tags: ['Pedidos'],
      summary: 'Aprova um pedido (colaborador/admin)',
      description: 'Aprova um pedido pendente e define a data de início e data prevista de devolução',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PedidoAprovacao' },
          },
        },
      },
      responses: {
        200: { description: 'Pedido aprovado com sucesso', ...resPedido },
        400: { description: 'Dados inválidos ou ID inválido', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        403: { description: 'Acesso negado — requer privilégios de colaborador/admin', ...resErro },
        404: { description: 'Pedido não encontrado', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
  },
  '/pedidos/{id}/reprovar': {
    post: {
      tags: ['Pedidos'],
      summary: 'Rejeita um pedido (colaborador/admin)',
      description: 'Rejeita um pedido pendente com um motivo de rejeição',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PedidoReprovacao' },
          },
        },
      },
      responses: {
        200: { description: 'Pedido rejeitado com sucesso', ...resPedido },
        400: { description: 'Dados inválidos ou ID inválido', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        403: { description: 'Acesso negado — requer privilégios de colaborador/admin', ...resErro },
        404: { description: 'Pedido não encontrado', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
  },
  '/pedidos/{id}/devolver': {
    post: {
      tags: ['Pedidos'],
      summary: 'Marca livro como devolvido (colaborador/admin)',
      description: 'Registra a devolução do livro e encerra o empréstimo',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        200: { description: 'Livro registrado como devolvido com sucesso', ...resPedido },
        400: { description: 'ID inválido', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        403: { description: 'Acesso negado — requer privilégios de colaborador/admin', ...resErro },
        404: { description: 'Pedido não encontrado', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
  },
};
