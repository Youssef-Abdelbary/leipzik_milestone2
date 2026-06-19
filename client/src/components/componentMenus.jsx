import { useState, useRef, useEffect } from 'react';

/**
 * OpalSelect — a styled dropdown that matches the opal design system.
 *
 * Props:
 *   value        — current selected value
 *   onChange     — (value) => void
 *   options      — [{ value, label }] or string[]
 *   placeholder  — string shown when nothing is selected (optional)
 *   label        — floating label shown above the trigger (optional)
 *   icon         — React node shown on the left of the trigger (optional)
 *   accent       — 'violet' | 'amber' | 'teal' | 'red'  (default 'violet')
 *   disabled     — bool
 *   style        — extra style on the root wrapper
 */
export function OpalSelect({
  value,
  onChange,
  onOpenChange,
  options = [],
  placeholder = 'Select…',
  label,
  icon,
  accent = 'violet',
  disabled = false,
  style = {},
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const ACCENT = {
    violet: { main: 'var(--opal-violet)', dim: 'var(--opal-violet-dim)', border: 'rgba(124,92,252,0.35)' },
    amber:  { main: 'var(--opal-amber)',  dim: 'var(--opal-amber-dim)',  border: 'rgba(245,179,74,0.35)' },
    teal:   { main: 'var(--opal-teal)',   dim: 'var(--opal-teal-dim)',   border: 'rgba(79,209,197,0.35)'  },
    red:    { main: 'var(--opal-red)',    dim: 'var(--opal-red-dim)',    border: 'rgba(255,92,102,0.35)'  },
  };
  const a = ACCENT[accent] ?? ACCENT.violet;

  // Normalise options to { value, label }
  const normalised = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  const selected = normalised.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const choose = (v) => { onChange?.(v); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative', fontFamily: 'var(--font-body)', ...style }}>
      {label && (
        <p style={{
          margin: '0 0 5px',
          fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: open ? a.main : 'var(--opal-muted)',
          transition: 'color 0.15s',
        }}>
          {label}
        </p>
      )}

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '9px 12px',
          borderRadius: 10,
          border: open
            ? `1px solid ${a.border}`
            : '1px solid var(--opal-border)',
          background: open ? a.dim : 'var(--opal-surface)',
          color: selected ? 'var(--opal-text)' : 'var(--opal-muted)',
          fontSize: 13,
          fontWeight: selected ? 500 : 400,
          fontFamily: 'var(--font-body)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s, background 0.15s',
          textAlign: 'left',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {icon && (
          <span style={{ color: open ? a.main : 'var(--opal-muted)', fontSize: 14, flexShrink: 0, transition: 'color 0.15s' }}>
            {icon}
          </span>
        )}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            color: open ? a.main : 'var(--opal-muted)',
          }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          zIndex: 600,
          borderRadius: 12,
          border: `1px solid ${a.border}`,
          background: 'rgba(21,21,29,0.96)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          padding: '6px',
          maxHeight: 240,
          overflowY: 'auto',
        }}>
          {normalised.length === 0 && (
            <p style={{ margin: 0, padding: '10px 12px', fontSize: 13, color: 'var(--opal-muted)', textAlign: 'center' }}>
              No options
            </p>
          )}
          {normalised.map((o) => {
            const isActive = o.value === value;
            return (
              <DropdownItem
                key={o.value}
                label={o.label}
                isActive={isActive}
                accent={a}
                onClick={() => choose(o.value)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ label, isActive, accent, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '8px 10px',
        borderRadius: 8,
        border: 'none',
        background: isActive ? accent.dim : hov ? 'var(--opal-surface-hover)' : 'transparent',
        color: isActive ? accent.main : hov ? 'var(--opal-text)' : 'var(--opal-sub)',
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {isActive && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent.main, flexShrink: 0 }} />
      )}
      {!isActive && <span style={{ width: 5, flexShrink: 0 }} />}
      {label}
    </button>
  );
}

/**
 * OpalMultiSelect — same aesthetic but allows multi-selection with pill chips.
 *
 * Props: same as OpalSelect except onChange receives the new array of selected values.
 */
export function OpalMultiSelect({
  value = [],
  onChange,
  options = [],
  placeholder = 'Select…',
  label,
  icon,
  accent = 'violet',
  disabled = false,
  style = {},
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const ACCENT = {
    violet: { main: 'var(--opal-violet)', dim: 'var(--opal-violet-dim)', border: 'rgba(124,92,252,0.35)' },
    amber:  { main: 'var(--opal-amber)',  dim: 'var(--opal-amber-dim)',  border: 'rgba(245,179,74,0.35)' },
    teal:   { main: 'var(--opal-teal)',   dim: 'var(--opal-teal-dim)',   border: 'rgba(79,209,197,0.35)'  },
    red:    { main: 'var(--opal-red)',    dim: 'var(--opal-red-dim)',    border: 'rgba(255,92,102,0.35)'  },
  };
  const a = ACCENT[accent] ?? ACCENT.violet;

  const normalised = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (v) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange?.(next);
  };

  const remove = (v, e) => { e.stopPropagation(); toggle(v); };

  const selectedLabels = value.map((v) => normalised.find((o) => o.value === v)?.label ?? v);

  return (
    <div ref={ref} style={{ position: 'relative', fontFamily: 'var(--font-body)', ...style }}>
      {label && (
        <p style={{
          margin: '0 0 5px',
          fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: open ? a.main : 'var(--opal-muted)',
          transition: 'color 0.15s',
        }}>
          {label}
        </p>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 5,
          width: '100%',
          minHeight: 40,
          padding: '6px 12px',
          borderRadius: 10,
          border: open ? `1px solid ${a.border}` : '1px solid var(--opal-border)',
          background: open ? a.dim : 'var(--opal-surface)',
          color: 'var(--opal-muted)',
          fontSize: 13,
          fontFamily: 'var(--font-body)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s, background 0.15s',
          textAlign: 'left',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {icon && (
          <span style={{ color: open ? a.main : 'var(--opal-muted)', fontSize: 14, flexShrink: 0 }}>
            {icon}
          </span>
        )}
        {value.length === 0 && <span style={{ flex: 1 }}>{placeholder}</span>}
        {selectedLabels.map((lbl, i) => (
          <span
            key={value[i]}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 20,
              background: a.dim,
              border: `1px solid ${a.border}`,
              color: a.main,
              fontSize: 11, fontWeight: 600,
            }}
          >
            {lbl}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => remove(value[i], e)}
              onKeyDown={(e) => e.key === 'Enter' && remove(value[i], e)}
              style={{ cursor: 'pointer', lineHeight: 1, fontSize: 12, color: a.main }}
            >
              ×
            </span>
          </span>
        ))}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{
            marginLeft: 'auto', flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            color: open ? a.main : 'var(--opal-muted)',
          }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          zIndex: 600,
          borderRadius: 12,
          border: `1px solid ${a.border}`,
          background: 'rgba(21,21,29,0.96)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          padding: '6px',
          maxHeight: 240,
          overflowY: 'auto',
        }}>
          {normalised.map((o) => {
            const isActive = value.includes(o.value);
            return (
              <DropdownItem
                key={o.value}
                label={o.label}
                isActive={isActive}
                accent={a}
                onClick={() => toggle(o.value)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}