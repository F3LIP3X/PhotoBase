import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* A right-click menu native to the app rather than the OS, so it reads
   as glass like everything else here instead of dropping a flat system
   menu on top of the design.
 *
 * Positioned at the pointer, then nudged back on-screen after its real
 * size is known — a menu opened near the right or bottom edge must not
 * hang off the window. */
const ContextMenu = ({ x, y, items, onClose }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x, y, ready: false });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const { innerWidth, innerHeight } = window;
    const rect = el.getBoundingClientRect();
    const margin = 8;

    setPos({
      x: Math.min(x, innerWidth - rect.width - margin),
      y: Math.min(y, innerHeight - rect.height - margin),
      ready: true,
    });
  }, [x, y]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) onClose();
    };
    const onKey = (event) => event.key === 'Escape' && onClose();

    /* Capture phase, so this closes before the click underneath also
       fires — otherwise a click meant to dismiss the menu could land on
       whatever tile happens to be there. */
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('contextmenu', onPointerDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('contextmenu', onPointerDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ left: pos.x, top: pos.y, visibility: pos.ready ? 'visible' : 'hidden' }}
      className="glass fixed z-50 min-w-[220px] rounded-md py-1.5 shadow-lg"
    >
      {items.map((item, at) =>
        item.divider ? (
          // eslint-disable-next-line react/no-array-index-key
          <div key={`divider-${at}`} className="my-1.5 h-px bg-[var(--glass-brd)]" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className={`flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 ${
              item.danger
                ? 'text-accent-2 hover:bg-[var(--glass-bg-strong)]'
                : 'text-ink-2 hover:bg-[var(--glass-bg-strong)] hover:text-ink'
            }`}
          >
            {item.icon && <item.icon className={item.danger ? 'text-accent-2' : 'text-ink-3'} />}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </button>
        ),
      )}
    </div>,
    document.body,
  );
};

export default ContextMenu;
