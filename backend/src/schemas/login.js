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
    post: {
      tags: ['Login'],
      summary: 'Autentica um usuário e retorna um token JWT',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
      },
      responses: {
        200: {
          description: 'Login realizado com sucesso',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
        },
        400: { description: 'Email e senha são obrigatórios', ...resErro },
        401: { description: 'Credenciais inválidas', ...resErro },
        500: { description: 'Erro interno do servidor', ...resErro },
      },
    },
  },
};
