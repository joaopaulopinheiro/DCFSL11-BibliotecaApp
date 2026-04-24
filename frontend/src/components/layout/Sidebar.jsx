import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isAdmin, isAdminOrColab } from '../../utils/permissions';

function colorFromString(str) {
  const colors = ['#c8902e','#2e7d52','#1a6fa8','#8e44ad','#c0392b','#2980b9','#16a085'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Sidebar({ open }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    localStorage.setItem('bib-theme', current === 'dark' ? 'light' : 'dark');
  };

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  const navSections = [
    {
      label: 'Acervo',
      items: [
        { to: '/catalogo',    label: 'Catálogo',   icon: '🗂',  always: true },
        { to: '/livros',      label: 'Livros',     icon: '📖',  check: () => isAdminOrColab(user) },
        { to: '/autores',     label: 'Autores',    icon: '✍️',  check: () => isAdminOrColab(user) },
        { to: '/categorias',  label: 'Categorias', icon: '🏷️',  check: () => isAdminOrColab(user) },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { to: '/pedidos',   label: 'Pedidos',  icon: '📋', always: true },
        { to: '/usuarios',  label: 'Usuários', icon: '👥', check: () => isAdmin(user) },
      ],
    },
  ];

  const initial = (user?.username || 'U')[0].toUpperCase();
  const avatarColor = user?.username ? colorFromString(user.username) : '#c8902e';

  return (
    <aside className={`sidebar${open ? ' sidebar--open' : ' sidebar--closed'}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <span className="sidebar__logo">📚</span>
        <div className="sidebar__brand-text">
          <span className="sidebar__name">Biblioteca</span>
          <span className="sidebar__sub">Universitária</span>
        </div>
      </div>

      {/* User — click → Meu Perfil */}
      {user && (
        <div
          className="sidebar__user"
          onClick={() => navigate('/meu-perfil')}
          title="Ver meu perfil"
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/meu-perfil')}
        >
          <div
            className="sidebar__user-avatar"
            style={{ background: `${avatarColor}22`, borderColor: `${avatarColor}66`, color: avatarColor }}
          >
            {initial}
          </div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user.username}</span>
            <span className="sidebar__user-role">{user.perfil}</span>
          </div>
          <span className="sidebar__user-arrow">›</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navSections.map(section => (
          <div key={section.label}>
            <span className="sidebar__section-label">{section.label}</span>
            {section.items.map(item => {
              if (!item.always && item.check && !item.check()) return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                  }
                >
                  <span className="sidebar__link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: logout + dark mode */}
      <div className="sidebar__footer">
        <button className="sidebar__logout" onClick={handleLogout}>
          <span>↩</span> Sair
        </button>
        <button
          className="sidebar__theme-btn"
          onClick={toggleTheme}
          title="Alternar tema"
          id="theme-toggle-btn"
        >
          🌙
        </button>
      </div>
    </aside>
  );
}
