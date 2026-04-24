import { Badge } from '../ui/index';
import { statusLabels, statusColors } from '../../utils/format';

export function PedidoStatusBadge({ status }) {
  return <Badge type={statusColors[status] || 'muted'}>{statusLabels[status] || status}</Badge>;
}
