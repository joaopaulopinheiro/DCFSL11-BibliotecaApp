// Button.jsx
export function Button({ variant = 'primary', size = 'md', icon, children, loading, actionType, ...props }) {
  // actionType: 'view' | 'edit' | 'delete' — adds hover colour class for ghost icon buttons
  const actionClass = actionType ? ` btn--action-${actionType}` : '';
  const iconOnly = !children && icon;

  return (
    <button
      className={`btn btn--${variant} btn--${size}${iconOnly ? ' btn--icon' : ''}${actionClass}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="btn__spinner" /> : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
