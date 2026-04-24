export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

export const formatDateInput = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
};

export const formatCPF = (cpf) => {
  if (!cpf) return '—';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const statusLabels = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const statusColors = {
  pendente: 'warning',
  aprovado: 'success',
  reprovado: 'danger',
  entregue: 'info',
  cancelado: 'muted',
};

export const perfilLabels = {
  aluno: 'Aluno',
  colab: 'Colaborador',
  admin: 'Administrador',
};

export const userStatusLabels = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  bloqueado: 'Bloqueado',
};
