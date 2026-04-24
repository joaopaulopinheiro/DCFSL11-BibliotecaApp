export const livrosSchema = {
  Livro: {
    type: 'object',
    required: ['id', 'titulo', 'autorId', 'categoriaId'],
    properties: {
      id: { type: 'integer', description: 'ID único do livro', example: 1 },
      titulo: { type: 'string', description: 'Título do livro (máx 200 caracteres)', maxLength: 200, example: 'Dom Casmurro' },
      descricao: { type: 'string', description: 'Descrição ou resumo do livro', nullable: true, example: 'Romance clássico da literatura brasileira.' },
      edicao: { type: 'string', description: 'Edição do livro (máx 10 caracteres)', maxLength: 10, nullable: true, example: '3ª edição' },
      autorId: { type: 'integer', description: 'ID do autor', example: 1 },
      categoriaId: { type: 'integer', description: 'ID da categoria', example: 2 },
      img: { type: 'string', description: 'Caminho da imagem da capa (máx 300 caracteres)', maxLength: 300, nullable: true, example: '/uploads/1234567890.jpg' },
      idioma: { type: 'string', description: 'Idioma de publicação (máx 100 caracteres)', maxLength: 100, nullable: true, example: 'Português' },
      num_paginas: { type: 'integer', description: 'Número de páginas', minimum: 0, nullable: true, example: 256 },
      editora: { type: 'string', description: 'Editora (máx 200 caracteres)', maxLength: 200, nullable: true, example: 'Editora Ática' },
      estoque: { type: 'integer', description: 'Quantidade em estoque (mínimo 0)', minimum: 0, nullable: true, example: 5 },
      data_publicacao: { type: 'string', format: 'date', description: 'Data de publicação', nullable: true, example: '1899-01-01' },
      autores: { $ref: '#/components/schemas/Autor' },
      categorias: { $ref: '#/components/schemas/Categoria' },
    },
  },
  LivroInput: {
    type: 'object',
    required: ['titulo', 'autorId', 'categoriaId'],
    properties: {
      titulo: { type: 'string', description: 'Título do livro (máx 200 caracteres)', maxLength: 200, minLength: 1, example: 'Dom Casmurro' },
      descricao: { type: 'string', description: 'Descrição ou resumo do livro', example: 'Romance clássico da literatura brasileira.' },
      edicao: { type: 'string', description: 'Edição do livro (máx 10 caracteres)', maxLength: 10, example: '3ª edição' },
      autorId: { type: 'integer', description: 'ID do autor cadastrado', example: 1 },
      categoriaId: { type: 'integer', description: 'ID da categoria cadastrada', example: 2 },
      idioma: { type: 'string', description: 'Idioma de publicação (máx 100 caracteres)', maxLength: 100, example: 'Português' },
      num_paginas: { type: 'integer', description: 'Número de páginas (mínimo 0)', minimum: 0, example: 256 },
      editora: { type: 'string', description: 'Editora (máx 200 caracteres)', maxLength: 200, example: 'Editora Ática' },
      estoque: { type: 'integer', description: 'Quantidade em estoque (mínimo 0)', minimum: 0, example: 5 },
      data_publicacao: { type: 'string', format: 'date', description: 'Data de publicação (YYYY-MM-DD)', example: '1899-01-01' },
    },
  },
  LivroCatalogo: {
    type: 'object',
    properties: {
      id: { type: 'integer', description: 'ID único do livro', example: 1 },
      titulo: { type: 'string', description: 'Título do livro', example: 'Dom Casmurro' },
      descricao: { type: 'string', description: 'Descrição ou resumo do livro', nullable: true, example: 'Romance clássico da literatura brasileira.' },
      edicao: { type: 'string', description: 'Edição do livro', nullable: true, example: '3ª edição' },
      autorId: { type: 'integer', description: 'ID do autor', example: 1 },
      categoriaId: { type: 'integer', description: 'ID da categoria', example: 2 },
      img: { type: 'string', description: 'Caminho da imagem da capa', nullable: true, example: '/uploads/1234567890.jpg' },
      idioma: { type: 'string', description: 'Idioma de publicação', nullable: true, example: 'Português' },
      num_paginas: { type: 'integer', description: 'Número de páginas', nullable: true, example: 256 },
      editora: { type: 'string', description: 'Editora', nullable: true, example: 'Editora Ática' },
      estoque_total: { type: 'integer', description: 'Quantidade total em estoque', example: 5 },
      disponivel: { type: 'integer', description: 'Quantidade disponível para empréstimo (estoque total - pedidos ativos)', example: 3 },
      pedidos_ativos: { type: 'integer', description: 'Número de pedidos ativos (pendente, aprovado)', example: 2 },
      data_publicacao: { type: 'string', format: 'date', description: 'Data de publicação', nullable: true, example: '1899-01-01' },
      autores: { $ref: '#/components/schemas/Autor' },
      categorias: { $ref: '#/components/schemas/Categoria' },
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

const resLivro = {
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Livro' } } },
};
const resErro = {
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
};

// POST e PUT aceitam multipart/form-data por causa do upload de imagem
const livroFormBody = {
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/LivroInput' },
          {
            type: 'object',
            properties: {
              img: { type: 'string', format: 'binary', description: 'Imagem da capa (jpeg, jpg, png, gif, webp — máx 5MB)' },
            },
          },
        ],
      },
    },
  },
};

export const livrosPaths = {
  '/livros': {
    get: {
      tags: ['Livros'],
      summary: 'Lista todos os livros',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Lista retornada com sucesso', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Livro' } } } } },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
    post: {
      tags: ['Livros'],
      summary: 'Cria um novo livro',
      security: [{ bearerAuth: [] }],
      requestBody: livroFormBody,
      responses: {
        201: { description: 'Livro criado com sucesso', ...resLivro },
        400: { description: 'Dados inválidos', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        403: { description: 'Acesso negado — requer privilégios de administrador', ...resErro },
        409: { description: 'Chave estrangeira inválida (autorId ou categoriaId)', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
  },
  '/livros/catalogo': {
    get: {
      tags: ['Livros'],
      summary: 'Lista catálogo de livros com disponibilidade dinâmica',
      description: 'Retorna livros com informações de disponibilidade calculadas em tempo real. Alunos veem apenas livros disponíveis; colaboradores e admins veem todos.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Catálogo retornado com sucesso', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/LivroCatalogo' } } } } },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
  },
  '/livros/{id}': {
    get: {
      tags: ['Livros'],
      summary: 'Busca um livro pelo ID',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        200: { description: 'Livro encontrado', ...resLivro },
        400: { description: 'ID inválido', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        404: { description: 'Livro não encontrado', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
    put: {
      tags: ['Livros'],
      summary: 'Atualiza um livro existente',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: livroFormBody,
      responses: {
        200: { description: 'Livro atualizado com sucesso', ...resLivro },
        400: { description: 'Dados inválidos', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        403: { description: 'Acesso negado — requer privilégios de administrador', ...resErro },
        404: { description: 'Livro não encontrado', ...resErro },
        409: { description: 'Chave estrangeira inválida (autorId ou categoriaId)', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
    delete: {
      tags: ['Livros'],
      summary: 'Remove um livro',
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        200: { description: 'Livro removido com sucesso', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Livro deletado com sucesso.' } } } } } },
        400: { description: 'ID inválido', ...resErro },
        401: { description: 'Token não fornecido ou inválido', ...resErro },
        403: { description: 'Acesso negado — requer privilégios de administrador', ...resErro },
        404: { description: 'Livro não encontrado', ...resErro },
        409: { description: 'Não é possível deletar: existem registros relacionados', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
  },
};
