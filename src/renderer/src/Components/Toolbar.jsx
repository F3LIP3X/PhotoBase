import { PiMagnifyingGlassBold, PiSlidersHorizontalBold } from 'react-icons/pi';
import ThemeToggle from './ThemeToggle';

/* The query lives in the Shell, not here: this is where it is typed, but
   the pages are what it filters. */
const Toolbar = ({ title, subtitle, searchable, condensed, query, onQuery }) => (
  <header
    className={`glass absolute left-[108px] right-4 top-4 z-20 flex items-center gap-3 rounded-lg px-5 transition-[padding,background-color] duration-300 ease-glass ${
      condensed ? 'glass-strong py-2.5' : 'py-4'
    }`}
  >
    <div className="min-w-0">
      <h1 className="truncate text-[17px] leading-tight text-ink">{title}</h1>
      {subtitle && (
        <p
          className={`eyebrow overflow-hidden text-ink-3 transition-all duration-300 ease-glass ${
            condensed ? 'max-h-0 opacity-0' : 'mt-1 max-h-5 opacity-100'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>

    {searchable && (
      <label className="ml-auto flex h-9 min-w-0 max-w-[320px] flex-1 items-center gap-2 rounded-full bg-[var(--glass-bg-strong)] px-3.5">
        <PiMagnifyingGlassBold className="shrink-0 text-ink-3" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Fecha, cámara o nombre"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3"
        />
      </label>
    )}

    <div className={`flex items-center gap-1 ${searchable ? '' : 'ml-auto'}`}>
      <ThemeToggle />
      <button type="button" aria-label="Ajustes de vista" className="control h-9 w-9">
        <PiSlidersHorizontalBold />
      </button>
    </div>
  </header>
);

export default Toolbar;
