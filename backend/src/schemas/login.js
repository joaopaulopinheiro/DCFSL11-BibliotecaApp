export const loginSchema = {
  LoginInput: {
    type: 'object',
    required: ['email', 'senha'],
    properties: {
      email: { type: 'string', format: 'email', description: 'Email cadastrado no sistema', example: 'usuario@email.com' },
      senha: { type: 'string', description: 'Senha da conta', example: 'senha12345' },
    },
  },
  LoginResponse: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', description: 'Token JWT com validade de 8 horas', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      aviso: { type: 'string', description: 'Aviso sobre status da conta (opcional)', nullable: true, example: 'Sua conta está inativa. Solicite a renovação do status ao administrador.' },
    },
  },
};

const resErro = {
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
};

export const loginPaths = {
  '/login': {
    // ... igual ao atual ...
  },

  '/validate-token': {
    get: {
      tags: ['Login'],
      summary: 'Valida o token JWT e retorna os dados do usuário',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Token válido — retorna payload do usuário',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId:    { type: 'integer', example: 1 },
                  username:  { type: 'string',  example: 'João Silva' },
                  matricula: { type: 'string',  example: '2024001', nullable: true },
                  perfil:    { type: 'string',  example: 'aluno' },
                  email:     { type: 'string',  example: 'joao@faculdade.edu' },
                  curso:     { type: 'string',  example: 'Engenharia', nullable: true },
                  status:    { type: 'string',  example: 'ativo' },
                },
              },
            },
          },
        },
        401: { description: 'Token não fornecido ou vazio',        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } } },
        403: { description: 'Token inválido ou expirado',          content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } } },
        500: { description: 'Erro interno do servidor',            content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } } },
      },
    },
  },
};
