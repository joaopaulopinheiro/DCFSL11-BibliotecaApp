import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * Layout principal.
 * `atraso` é opcional — páginas que já carregam usePedidos podem passar o valor;
 * nas demais o alerta simplesmente não aparece (sem fetch extra).
 */
export function Layout({ title, children, atraso = false }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Topbar title={title} atraso={atraso} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
