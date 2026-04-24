# Especificação da API — Biblioteca Universitária

> Base URL: `http://localhost:3000`
> Autenticação: `Authorization: Bearer <token>` (JWT, exceto onde indicado)

---

## Sumário de Perfis

| Perfil  | Descrição |
|---------|-----------|
| `aluno` | Pode ver catálogo, fazer/cancelar pedidos, ver próprio histórico, alterar própria senha |
| `colab` | Tudo do aluno + aprovar/reprovar pedidos, registrar devolução, CRUD de autores/categorias/livros (sem delete) |
| `admin` | CRUD total, gerenciar usuários, aprovar/reprovar/devolver pedidos |

---

### Estrutura de Pastas React Sugerida
```
src/
├── api/
│   ├── client.js          # fetch wrapper com token
│   ├── autores.js
│   ├── categorias.js
│   ├── livros.js
│   ├── usuarios.js
│   ├── pedidos.js
│   └── auth.js
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   └── Layout.jsx
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Toast.jsx
│   │   ├── Badge.jsx
│   │   ├── SearchBox.jsx
│   │   ├── Pagination.jsx
│   │   ├── index.js
│   │   ├── EmptyState.jsx
│   │   └── ConfirmDialog.jsx
│   ├── pedidos/
│       └── PedidoStatusBadge.jsx
├── pages/
│   ├── Login.jsx
│   ├── Catalogo.jsx
│   ├── Livros.jsx
│   ├── Autores.jsx
│   ├── Categorias.jsx
│   ├── Pedidos.jsx
│   ├── Usuarios.jsx
│   ├── MeuPerfil.jsx
│   └── Inativo.jsx        # tela para usuário inativo
├── context/
│   ├── AuthContext.jsx    # token, user, login, logout
│   └── ToastContext.jsx
├── hooks/
│   ├── usePedidos.js
│   └── usePagination.js
├── utils/
│   ├── permissions.js     # isAdmin(), isColab(), canDoAction()
│   ├── estoque.js
│   └── format.js          # datas, CPF, etc.
├── routes/
│   └── PrivateRoute.jsx   # redireciona se não autenticado
├── App.jsx
└── main.jsx
```

---

## 1. Login

### `POST /login`
> Público (sem autenticação)

**Request Body:**
```json
{
  "email": "string",
  "senha": "string"
}
```

**Respostas:**

| Status | Descrição |
|--------|-----------|
| 200 | Login bem-sucedido, retorna token JWT |
| 400 | Email ou senha não informados |
| 401 | Credenciais inválidas (usuário não encontrado ou senha errada) |
| 403 | Status de usuário inválido no banco |
| 500 | Erro interno |

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "aviso": null
}
```

O campo `aviso` é retornado (não nulo) quando o usuário está `inativo` ou `bloqueado`:
- `inativo` → `"Sua conta está inativa. Solicite a renovação do status ao administrador."`
- `bloqueado` → `"Sua conta está bloqueada por atraso na devolução. Regularize com a biblioteca."`

**Payload decodificado do JWT:**
```json
{
  "userId": 1,
  "username": "João Silva",
  "matricula": "2024001",
  "perfil": "aluno",
  "email": "joao@faculdade.edu",
  "curso": "Engenharia",
  "status": "ativo"
}
```

> ⚠️ Usuários com status `inativo` fazem login normalmente, mas o frontend redireciona para `/inativo`. Usuários com status `bloqueado` fazem login e veem tudo, mas não podem abrir novos pedidos (validado no backend em `POST /pedidos`).

---

## 2. Validação de Token

### `GET /validate-token`
> Requer autenticação

Valida se o token ainda é válido e retorna os dados do usuário.

**Response 200:** Payload decodificado do JWT (mesmo formato acima)

| Status | Descrição |
|--------|-----------|
| 200 | Token válido — retorna payload |
| 401 | Token não fornecido ou string vazia |
| 403 | Token inválido ou expirado |

---

## 3. Autores

### `GET /autores`
> Requer autenticação (qualquer perfil)

Retorna todos os autores ordenados por nome.

**Response 200:**
```json
[
  { "id": 1, "nome": "Machado de Assis" }
]
```

---

### `GET /autores/:id`
> Requer autenticação (qualquer perfil)

| Status | Descrição |
|--------|-----------|
| 200 | Autor encontrado |
| 400 | ID inválido (não é inteiro) |
| 404 | Autor não encontrado |

---

### `POST /autores`
> Requer autenticação + perfil `admin` ou `colab`

**Request Body:**
```json
{ "nome": "Machado de Assis" }
```

| Status | Descrição |
|--------|-----------|
| 201 | Criado com sucesso |
| 400 | `nome` ausente ou não é string |
| 401 | Token não fornecido |
| 403 | Perfil sem permissão |
| 409 | Já existe autor com esse nome (comparação case-insensitive) |
| 500 | Erro interno |

---

### `PUT /autores/:id`
> Requer autenticação + perfil `admin` ou `colab`

**Request Body:**
```json
{ "nome": "Novo Nome" }
```

| Status | Descrição |
|--------|-----------|
| 200 | Atualizado |
| 400 | ID inválido ou `nome` ausente |
| 404 | Autor não encontrado |
| 409 | Conflito de nome (não implementado no PUT, mas pode ocorrer via DB) |

---

### `DELETE /autores/:id`
> Requer autenticação + perfil `admin` apenas

**Response 200:** Retorna o objeto do autor deletado.

| Status | Descrição |
|--------|-----------|
| 200 | Deletado com sucesso |
| 400 | ID inválido |
| 403 | Perfil sem permissão |
| 404 | Autor não encontrado |
| 409 | Existem livros vinculados a este autor |

---

## 4. Categorias

> Mesmas regras de acesso dos Autores.

### `GET /categorias`
> Requer autenticação (qualquer perfil)

**Response 200:**
```json
[
  { "id": 1, "nome": "Ficção Científica" }
]
```

---

### `GET /categorias/:id`
> Requer autenticação

---

### `POST /categorias`
> Requer autenticação + `admin` ou `colab`

**Request Body:**
```json
{ "nome": "Ficção Científica" }
```

| Status | Descrição |
|--------|-----------|
| 201 | Criado com sucesso |
| 400 | `nome` ausente ou não é string |
| 409 | Já existe categoria com esse nome (case-insensitive) |

---

### `PUT /categorias/:id`
> Requer autenticação + `admin` ou `colab`

---

### `DELETE /categorias/:id`
> Requer autenticação + `admin` apenas

**Response 200:** Retorna o objeto da categoria deletada.

| Status | Descrição |
|--------|-----------|
| 409 | Existem livros vinculados a esta categoria |

---

## 5. Livros

### `GET /livros`
> Requer autenticação (qualquer perfil)

Retorna todos os livros com autores e categorias aninhados, ordenados por título.

**Response 200:**
```json
[
  {
    "id": 1,
    "titulo": "Dom Casmurro",
    "descricao": "Romance clássico...",
    "edicao": "3ª",
    "autorId": 1,
    "categoriaId": 2,
    "img": "/uploads/1234567890.jpg",
    "idioma": "Português",
    "num_paginas": 256,
    "editora": "Companhia das Letras",
    "estoque": 5,
    "data_publicacao": "1899-01-01T00:00:00.000Z",
    "autores": { "id": 1, "nome": "Machado de Assis" },
    "categorias": { "id": 2, "nome": "Romance" }
  }
]
```

---

### `GET /livros/catalogo`
> Requer autenticação (qualquer perfil)

Retorna livros com disponibilidade calculada em tempo real. Alunos veem apenas livros com `disponivel > 0`.

**Response 200:**
```json
[
  {
    "id": 1,
    "titulo": "Dom Casmurro",
    "estoque_total": 5,
    "disponivel": 3,
    "pedidos_ativos": 2,
    "autores": { "id": 1, "nome": "Machado de Assis" },
    "categorias": { "id": 2, "nome": "Romance" }
  }
]
```

> ⚠️ Esta rota deve ser chamada **antes** de `/livros/:id` nas definições de rota, pois `/catalogo` seria interpretado como um `:id`. O backend já faz isso corretamente em `livrosRoutes.js`.

---

### `GET /livros/:id`
> Requer autenticação

| Status | Descrição |
|--------|-----------|
| 200 | Livro com autores e categorias aninhados |
| 400 | ID inválido (não é inteiro positivo) |
| 404 | Livro não encontrado |

---

### `POST /livros`
> Requer autenticação + `admin` ou `colab`
> `Content-Type: multipart/form-data` (suporta upload de imagem) **ou** `application/json` (sem imagem)

**Campos obrigatórios:** `titulo`, `autorId`, `categoriaId`

**Campos opcionais:** `descricao`, `edicao`, `img` (arquivo até 5 MB — jpeg/jpg/png/gif/webp), `idioma`, `num_paginas`, `editora`, `estoque`, `data_publicacao`

O campo `img` pode ser enviado como **arquivo** (multipart) ou como **URL string** (JSON). Se enviado como arquivo, a imagem é salva em `public/uploads/` e o campo `img` no banco recebe o caminho `/uploads/<nome>`.

| Status | Descrição |
|--------|-----------|
| 201 | Criado |
| 400 | Campos obrigatórios ausentes ou validação falhou (ver array `errors`) |
| 409 | `autorId` ou `categoriaId` inexistente (violação de FK — Prisma P2003) |

**Response 400** (validação):
```json
{ "errors": ["Campo \"titulo\" é obrigatório e deve ser uma string não vazia."] }
```

---

### `PUT /livros/:id`
> Requer autenticação + `admin` ou `colab`
> Suporta atualização parcial — apenas campos enviados são alterados.

| Status | Descrição |
|--------|-----------|
| 200 | Atualizado |
| 400 | ID inválido ou falha de validação |
| 404 | Livro não encontrado (Prisma P2025) |
| 409 | `autorId` ou `categoriaId` inexistente |

---

### `DELETE /livros/:id`
> Requer autenticação + `admin` apenas

**Response 200:**
```json
{ "message": "Livro deletado com sucesso." }
```

| Status | Descrição |
|--------|-----------|
| 400 | ID inválido |
| 404 | Livro não encontrado |
| 409 | Existem pedidos vinculados a este livro |

---

## 6. Usuários

### `GET /usuarios`
> Requer autenticação + `admin`

**Response 200:**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "matricula": "2024001",
    "perfil": "aluno",
    "curso": "Engenharia",
    "cpf": "12345678901",
    "data_nascimento": "2000-05-15T00:00:00.000Z",
    "email": "joao@faculdade.edu",
    "senha": "<hash bcrypt>",
    "status": "ativo"
  }
]
```

> ⚠️ O campo `senha` é retornado pela API (como hash bcrypt). O frontend omite esse campo ao renderizar.

---

### `GET /usuarios/:id`
> Requer autenticação (qualquer perfil)

> O backend não valida se o aluno está acessando o próprio perfil — essa verificação é feita no frontend.

| Status | Descrição |
|--------|-----------|
| 400 | ID inválido (não é inteiro positivo) |
| 404 | Usuário não encontrado |

---

### `POST /usuarios`
> Requer autenticação + `admin`

**Request Body:**
```json
{
  "nome": "string",
  "email": "string",
  "cpf": "string (11 dígitos)",
  "senha": "string (mín. 8 chars)",
  "perfil": "aluno | colab | admin",
  "status": "ativo | inativo | bloqueado",
  "data_nascimento": "YYYY-MM-DD",
  "matricula": "string (opcional)",
  "curso": "string (opcional)"
}
```

A senha é armazenada como **hash bcrypt** (10 rounds).

| Status | Descrição |
|--------|-----------|
| 201 | Criado |
| 400 | Campos obrigatórios ausentes, senha < 8 chars, ou CPF/email/matrícula duplicado (Prisma P2002) |

---

### `PUT /usuarios/:id`
> Requer autenticação + `admin`

Todos os campos são opcionais. A senha só é alterada se enviada; se enviada, é re-hasheada.

| Status | Descrição |
|--------|-----------|
| 200 | Atualizado |
| 400 | ID inválido, senha < 8 chars, ou duplicidade (P2002) |
| 404 | Usuário não encontrado (P2025) |

---

### `PUT /usuarios/:id/status`
> Requer autenticação + `admin`

**Request Body:**
```json
{ "status": "ativo | inativo | bloqueado" }
```

| Status | Descrição |
|--------|-----------|
| 200 | Status atualizado |
| 400 | ID inválido ou status não é um dos valores válidos |
| 404 | Usuário não encontrado |

---

### `DELETE /usuarios/:id`
> Requer autenticação + `admin`

**Response 204** (sem corpo).

| Status | Descrição |
|--------|-----------|
| 204 | Deletado |
| 400 | ID inválido |
| 404 | Usuário não encontrado (Prisma P2025) |
| 409 | Usuário possui pedidos com status `pendente` ou `aprovado` |

---

## 7. Pedidos

### `GET /pedidos`
> Requer autenticação (qualquer perfil)

Retorna **todos** os pedidos. A filtragem por usuário é feita no frontend para alunos.

**Response 200:**
```json
[
  {
    "id": 1,
    "uuid": "clg5z8b9v0000...",
    "livro_id": 3,
    "usuario_id": 7,
    "data_inicio": "2025-03-01T00:00:00.000Z",
    "data_prevista": "2025-03-15T00:00:00.000Z",
    "data_entrega": null,
    "status": "pendente",
    "aprovado_por": null,
    "motivo_reprovacao": null,
    "matricula_snapshot": "2024001",
    "cpf_snapshot": "12345678901"
  }
]
```

**Status possíveis de um pedido:**

| Status | Descrição |
|--------|-----------|
| `pendente` | Criado pelo aluno, aguarda aprovação |
| `aprovado` | Aprovado por colab/admin |
| `reprovado` | Negado por colab/admin (campo `motivo_reprovacao` preenchido) |
| `devolvido` | Livro devolvido; `data_entrega` preenchida e estoque incrementado |
| `cancelado` | Cancelado pelo próprio aluno (somente se `pendente`) |

---

### `GET /pedidos/:id`
> Requer autenticação (qualquer perfil)

| Status | Descrição |
|--------|-----------|
| 400 | ID inválido |
| 404 | Pedido não encontrado |

---

### `POST /pedidos`
> Requer autenticação (qualquer perfil autenticado)

O backend valida todas as regras de negócio:

**Request Body:**
```json
{
  "livroId": 3,
  "usuarioId": 7
}
```

O pedido é criado com:
- `status: "pendente"`
- `data_inicio`: hoje (UTC 00:00:00)
- `data_prevista`: hoje + 14 dias
- `matricula_snapshot` e `cpf_snapshot` capturados do usuário no momento da criação

| Status | Descrição |
|--------|-----------|
| 201 | Pedido criado |
| 400 | `livroId` ou `usuarioId` ausentes |
| 400 | Livro sem estoque (`estoque <= 0`) |
| 400 | Aluno já tem pedido `pendente` ou `aprovado` para este livro |
| 400 | Limite de 5 pedidos ativos atingido |
| 403 | Usuário `inativo` ou `bloqueado` |
| 403 | Usuário tem pedido aprovado com `data_prevista` vencida (atraso) |
| 404 | Livro ou usuário não encontrado |
| 500 | Erro interno |

> ℹ️ A validação de atraso bloqueia a criação de novos pedidos enquanto houver algum pedido com `status = 'aprovado'` e `data_prevista < hoje`.

---

### `POST /pedidos/:id/aprovar`
> Requer autenticação + `admin` ou `colab`

Aprova um pedido pendente. O `aprovado_por` é extraído do token (não do body).

**Request Body:** *(opcional — o backend aceita body vazio)*
```json
{
  "data_inicio": "2025-03-10",
  "data_prevista": "2025-03-24"
}
```

> ⚠️ O backend atual **não aplica** `data_inicio` e `data_prevista` do body na aprovação — apenas muda o status para `aprovado` e registra `aprovado_por`. O frontend envia essas datas, mas elas são ignoradas pelo controller. As datas definidas na criação do pedido permanecem.

| Status | Descrição |
|--------|-----------|
| 200 | Pedido aprovado |
| 400 | ID inválido ou pedido não está `pendente` |
| 401 | `userId` ausente no token |
| 404 | Pedido não encontrado |

---

### `POST /pedidos/:id/reprovar`
> Requer autenticação + `admin` ou `colab`

**Request Body:**
```json
{ "motivo_reprovacao": "Livro indisponível para este período." }
```

| Status | Descrição |
|--------|-----------|
| 200 | Pedido reprovado |
| 400 | `motivo_reprovacao` ausente ou pedido não está `pendente` |
| 404 | Pedido não encontrado |

---

### `POST /pedidos/:id/devolver`
> Requer autenticação + `admin` ou `colab`

Registra a devolução do livro. O status muda para `devolvido`, `data_entrega` é preenchida com hoje e o `estoque` do livro é **incrementado em 1** no banco.

**Response 200:**
```json
{
  "id": 1,
  "status": "devolvido",
  "data_entrega": "2025-03-20T00:00:00.000Z",
  "aviso": "Livro devolvido com sucesso"
}
```

O campo `aviso` retorna `"Livro devolvido com atraso"` se `data_prevista < hoje`.

| Status | Descrição |
|--------|-----------|
| 200 | Devolução registrada |
| 400 | Pedido não está `aprovado` |
| 404 | Pedido não encontrado |

---

### `POST /pedidos/:id/cancelar`
> Requer autenticação (qualquer perfil)

O aluno cancela o próprio pedido. O backend verifica que `pedido.usuario_id === req.usuario.userId`.

| Status | Descrição |
|--------|-----------|
| 200 | Pedido cancelado |
| 400 | Pedido não está `pendente` |
| 403 | Tentativa de cancelar pedido de outro usuário |
| 404 | Pedido não encontrado |

---

### `PUT /pedidos/:id`
> Requer autenticação + `admin` apenas (rota legada)

Atualização genérica de campos. Campos obrigatórios no body: `livroId`, `usuarioId`, `data_inicio`, `data_prevista`.

---

### `DELETE /pedidos/:id`
> Requer autenticação + `admin` apenas

**Response 200:** Retorna o objeto do pedido deletado.

| Status | Descrição |
|--------|-----------|
| 400 | ID inválido |
| 404 | Pedido não encontrado |

---

## 8. Documentação Swagger

### `GET /docs`

Interface Swagger UI gerada automaticamente a partir dos schemas em `src/schemas/`. Disponível apenas em ambiente local por padrão.

---

## 9. Resumo de Permissões por Endpoint

| Endpoint | aluno | colab | admin |
|----------|-------|-------|-------|
| `GET /autores` | ✅ | ✅ | ✅ |
| `GET /autores/:id` | ✅ | ✅ | ✅ |
| `POST /autores` | ❌ | ✅ | ✅ |
| `PUT /autores/:id` | ❌ | ✅ | ✅ |
| `DELETE /autores/:id` | ❌ | ❌ | ✅ |
| `GET /categorias` | ✅ | ✅ | ✅ |
| `GET /categorias/:id` | ✅ | ✅ | ✅ |
| `POST /categorias` | ❌ | ✅ | ✅ |
| `PUT /categorias/:id` | ❌ | ✅ | ✅ |
| `DELETE /categorias/:id` | ❌ | ❌ | ✅ |
| `GET /livros` | ✅ | ✅ | ✅ |
| `GET /livros/catalogo` | ✅ | ✅ | ✅ |
| `GET /livros/:id` | ✅ | ✅ | ✅ |
| `POST /livros` | ❌ | ✅ | ✅ |
| `PUT /livros/:id` | ❌ | ✅ | ✅ |
| `DELETE /livros/:id` | ❌ | ❌ | ✅ |
| `GET /usuarios` | ❌ | ❌ | ✅ |
| `GET /usuarios/:id` | próprio* | ❌ | ✅ |
| `POST /usuarios` | ❌ | ❌ | ✅ |
| `PUT /usuarios/:id` | ❌ | ❌ | ✅ |
| `PUT /usuarios/:id/status` | ❌ | ❌ | ✅ |
| `DELETE /usuarios/:id` | ❌ | ❌ | ✅ |
| `GET /pedidos` | ✅ (todos) | ✅ | ✅ |
| `GET /pedidos/:id` | ✅ | ✅ | ✅ |
| `POST /pedidos` | ✅ | ✅ | ✅ |
| `POST /pedidos/:id/aprovar` | ❌ | ✅ | ✅ |
| `POST /pedidos/:id/reprovar` | ❌ | ✅ | ✅ |
| `POST /pedidos/:id/devolver` | ❌ | ✅ | ✅ |
| `POST /pedidos/:id/cancelar` | próprio | ✅ | ✅ |
| `PUT /pedidos/:id` | ❌ | ❌ | ✅ |
| `DELETE /pedidos/:id` | ❌ | ❌ | ✅ |
| `GET /validate-token` | ✅ | ✅ | ✅ |

*\* Validação de "próprio" feita no frontend — o backend aceita qualquer ID autenticado.*

---

## 10. Modelo de Dados

### Pedido — campos relevantes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | integer | PK serial |
| `uuid` | string | CUID único, gerado pelo Prisma |
| `livro_id` | integer | FK → livros |
| `usuario_id` | integer | FK → usuarios (criador) |
| `aprovado_por` | integer \| null | FK → usuarios (colab/admin que aprovou) |
| `status` | string | `pendente \| aprovado \| reprovado \| devolvido \| cancelado` |
| `data_inicio` | date \| null | Data de início do empréstimo |
| `data_prevista` | date \| null | Data prevista de devolução |
| `data_entrega` | date \| null | Data real de devolução |
| `motivo_reprovacao` | string \| null | Preenchido ao reprovar |
| `matricula_snapshot` | string \| null | Matrícula do aluno no momento do pedido |
| `cpf_snapshot` | string \| null | CPF do aluno no momento do pedido |

---

## 11. Observações e Inconsistências Conhecidas

| Ponto | Situação atual |
|-------|----------------|
| Datas na aprovação | `POST /pedidos/:id/aprovar` aceita `data_inicio` e `data_prevista` no body, mas o controller as ignora — as datas definidas na criação permanecem |
| Campo `senha` na listagem | `GET /usuarios` retorna o hash da senha; o frontend não exibe esse campo |
| Validação de "próprio perfil" | `GET /usuarios/:id` não restringe alunos a ver apenas o próprio perfil — validação é feita no frontend |
| `status = devolvido` vs `entregue` | O backend usa `"devolvido"` como status final; a spec antiga e o Swagger usavam `"entregue"`. O valor real no banco é `"devolvido"` |
| Estoque na devolução | `POST /pedidos/:id/devolver` faz `estoque + 1` diretamente no banco, diferente das demais rotas que calculam o estoque dinamicamente |
| CORS | `cors()` sem restrições de origem — em produção, especificar `origin` |
