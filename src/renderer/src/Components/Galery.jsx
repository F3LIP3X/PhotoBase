import React from 'react';

const PLACEHOLDER_ALBUMS = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  title: 'Recuerdos',
  date: '12 AGO 2026',
}));

const Gallery = () => {
  return (
    <div className="scroll-thin flex-1 overflow-y-auto pr-1">
      <div className="grid grid-cols-4 gap-4">
        {PLACEHOLDER_ALBUMS.map(({ id, title, date }) => (
          <div key={id} className="glass overflow-hidden rounded-[var(--radius-lg)]">
            <div className="grid grid-cols-2 gap-1 p-1">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-[var(--radius-sm)] bg-[var(--glass-fill-strong)]"
                />
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-ink">{title}</p>
              <p className="text-meta text-ink-soft">{date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
