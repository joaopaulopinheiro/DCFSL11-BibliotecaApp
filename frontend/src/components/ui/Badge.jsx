// Badge.jsx
export function Badge({ type = 'muted', children }) {
  return <span className={`badge badge--${type}`}>{children}</span>;
}
