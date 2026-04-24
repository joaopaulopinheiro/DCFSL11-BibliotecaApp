export const isAdmin = (user) => user?.perfil === 'admin';
export const isColab = (user) => user?.perfil === 'colab';
export const isAluno = (user) => user?.perfil === 'aluno';
export const isAdminOrColab = (user) => isAdmin(user) || isColab(user);

export const canManageUsers = (user) => isAdmin(user);
export const canDeleteResource = (user) => isAdmin(user);
export const canCreateOrEditResource = (user) => isAdminOrColab(user);
export const canApprovePedido = (user) => isAdminOrColab(user);

export const canCreatePedido = (user, livro, pedidosDoAluno, todosPedidos) => {
  if (!user || user.status !== 'ativo') return false;
  if (!isAluno(user) && !isAdmin(user)) return false;
  const ativos = pedidosDoAluno.filter(p => ['pendente', 'aprovado'].includes(p.status));
  if (ativos.length >= 5) return false;
  const jaTemPedido = ativos.some(p => p.livro_id === livro.id);
  if (jaTemPedido) return false;
  const estoqueDisp = estoqueDisponivel(livro, todosPedidos);
  if (estoqueDisp <= 0) return false;
  return true;
};

export const estoqueDisponivel = (livro, pedidos) => {
  const ativos = pedidos.filter(p =>
    p.livro_id === livro.id &&
    ['pendente', 'aprovado'].includes(p.status)
  ).length;
  return (livro.estoque ?? 0) - ativos;
};

export const temAtraso = (pedidosDoAluno) => {
  const hoje = new Date();
  return pedidosDoAluno.some(p =>
    p.status === 'aprovado' &&
    p.data_prevista &&
    new Date(p.data_prevista) < hoje
  );
};
