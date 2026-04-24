export const usuariosSchema = {
  Usuario: {
    type: "object",
    required: [
      "id",
      "nome",
      "cpf",
      "email",
      "perfil",
      "status",
      "data_nascimento",
    ],
    properties: {
      id: { type: "integer", description: "ID único do usuário", example: 1 },
      nome: {
        type: "string",
        description: "Nome completo (máx 200 caracteres)",
        maxLength: 200,
        example: "João da Silva",
      },
      matricula: {
        type: "string",
        description: "Matrícula única (máx 20 caracteres)",
        maxLength: 20,
        nullable: true,
        example: "2024001",
      },
      perfil: {
        type: "string",
        description: "Perfil do usuário (aluno, colaborador, admin)",
        enum: ["aluno", "colaborador", "admin"],
        example: "aluno",
      },
      curso: {
        type: "string",
        description: "Curso (máx 100 caracteres)",
        maxLength: 100,
        nullable: true,
        example: "Informática",
      },
      cpf: {
        type: "string",
        description: "CPF sem formatação (11 dígitos)",
        pattern: "^\\d{11}$",
        example: "12345678900",
      },
      data_nascimento: {
        type: "string",
        format: "date",
        description: "Data de nascimento (YYYY-MM-DD)",
        example: "2000-05-15",
      },
      email: {
        type: "string",
        format: "email",
        description: "Email único (máx 200 caracteres)",
        maxLength: 200,
        example: "joao@email.com",
      },
      senha: {
        type: "string",
        description: "Senha (mínimo 8 caracteres)",
        minLength: 8,
        example: "senha12345",
      },
      status: {
        type: "string",
        description: "Status do usuário (ativo, inativo, bloqueado)",
        enum: ["ativo", "inativo", "bloqueado"],
        example: "ativo",
      },
    },
  },
  UsuarioInput: {
    type: "object",
    required: [
      "nome",
      "cpf",
      "email",
      "senha",
      "perfil",
      "status",
      "data_nascimento",
    ],
    properties: {
      nome: {
        type: "string",
        description: "Nome completo (máx 200 caracteres)",
        maxLength: 200,
        minLength: 1,
        example: "João da Silva",
      },
      matricula: {
        type: "string",
        description: "Matrícula única (máx 20 caracteres)",
        maxLength: 20,
        example: "2024001",
      },
      perfil: {
        type: "string",
        description: "Perfil do usuário",
        enum: ["aluno", "colaborador", "admin"],
        example: "aluno",
      },
      curso: {
        type: "string",
        description: "Curso (máx 100 caracteres)",
        maxLength: 100,
        example: "Informática",
      },
      cpf: {
        type: "string",
        description: "CPF sem formatação (11 dígitos)",
        pattern: "^\\d{11}$",
        example: "12345678900",
      },
      data_nascimento: {
        type: "string",
        format: "date",
        description: "Data de nascimento (YYYY-MM-DD)",
        example: "2000-05-15",
      },
      email: {
        type: "string",
        format: "email",
        description: "Email único (máx 200 caracteres)",
        maxLength: 200,
        example: "joao@email.com",
      },
      senha: {
        type: "string",
        description: "Senha (mínimo 8 caracteres)",
        minLength: 8,
        example: "senha12345",
      },
      status: {
        type: "string",
        description: "Status do usuário",
        enum: ["ativo", "inativo", "bloqueado"],
        example: "ativo",
      },
    },
  },
  StatusChange: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        description: "Novo status",
        enum: ["ativo", "inativo", "bloqueado"],
        example: "inativo",
      },
    },
  },
};

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer" },
  example: 1,
};

const resUsuario = {
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Usuario" } },
  },
};
const resErro = {
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Erro" } },
  },
};

export const usuariosPaths = {
  "/usuarios": {
    get: {
      tags: ["Usuários"],
      summary: "Lista todos os usuários",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lista retornada com sucesso",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Usuario" },
              },
            },
          },
        },
        401: { description: "Token não fornecido ou inválido", ...resErro },
        403: {
          description: "Acesso negado — requer privilégios de administrador",
          ...resErro,
        },
        500: { description: "Erro interno do servidor", ...resErro },
      },
    },
    post: {
      tags: ["Usuários"],
      summary: "Cria um novo usuário",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UsuarioInput" },
          },
        },
      },
      responses: {
        201: { description: "Usuário criado com sucesso", ...resUsuario },
        400: {
          description: "Dados inválidos ou CPF/Email/Matrícula já cadastrado",
          ...resErro,
        },
        401: { description: "Token não fornecido ou inválido", ...resErro },
        403: {
          description: "Acesso negado — requer privilégios de administrador",
          ...resErro,
        },
        500: { description: "Erro interno do servidor", ...resErro },
      },
    },
  },
  "/usuarios/{id}": {
    get: {
      tags: ["Usuários"],
      summary: "Busca um usuário pelo ID",
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        200: { description: "Usuário encontrado", ...resUsuario },
        400: { description: "ID inválido", ...resErro },
        401: { description: "Token não fornecido ou inválido", ...resErro },
        404: { description: "Usuário não encontrado", ...resErro },
        500: { description: "Erro interno do servidor", ...resErro },
      },
    },
    put: {
      tags: ["Usuários"],
      summary: "Atualiza um usuário existente",
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UsuarioInput" },
          },
        },
      },
      responses: {
        200: { description: "Usuário atualizado com sucesso", ...resUsuario },
        400: {
          description: "Dados inválidos ou CPF/Email/Matrícula já cadastrado",
          ...resErro,
        },
        401: { description: "Token não fornecido ou inválido", ...resErro },
        403: {
          description: "Acesso negado — requer privilégios de administrador",
          ...resErro,
        },
        404: { description: "Usuário não encontrado", ...resErro },
        500: { description: "Erro interno do servidor", ...resErro },
      },
    },
    delete: {
      tags: ["Usuários"],
      summary: "Remove um usuário",
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      responses: {
        204: { description: "Usuário removido com sucesso (soft delete)" },
        400: { description: "ID inválido", ...resErro },
        401: { description: "Token não fornecido ou inválido", ...resErro },
        403: {
          description: "Acesso negado — requer privilégios de administrador",
          ...resErro,
        },
        404: { description: "Usuário não encontrado", ...resErro },
        409: {
          description: "Usuário possui pedidos pendentes ou aprovados",
          ...resErro,
        },
        500: { description: "Erro interno do servidor", ...resErro },
      },
    },
  },
  "/usuarios/{id}/status": {
    put: {
      tags: ["Usuários"],
      summary: "Altera o status de um usuário (admin)",
      description:
        "Permite alterar o status de um usuário entre ativo, inativo ou bloqueado",
      security: [{ bearerAuth: [] }],
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/StatusChange" },
          },
        },
      },
      responses: {
        200: { description: "Status atualizado com sucesso", ...resUsuario },
        400: { description: "Status inválido ou ID inválido", ...resErro },
        401: { description: "Token não fornecido ou inválido", ...resErro },
        403: {
          description: "Acesso negado — requer privilégios de administrador",
          ...resErro,
        },
        404: { description: "Usuário não encontrado", ...resErro },
        500: { description: "Erro interno do servidor", ...resErro },
      },
    },
  },
};
