import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function Layout({ title, children, atraso = false, filters }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`app-layout${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
      <Sidebar open={sidebarOpen} />
      <div className="app-main">
        <Topbar
          title={title}
          atraso={atraso}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
          filters={filters}
        />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
