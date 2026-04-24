// Modal.jsx
export function Modal({ open, onClose, title, children, footer, size }) {
  if (!open) return null;
  const sizeClass = size === 'lg' ? ' modal--lg' : size === 'sm' ? ' modal--sm' : '';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal${sizeClass}`} onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
