/* One place for units and dates, so a size never reads as "0,1 GB" on
   one screen and "102 MB" on another. */
export const formatSize = (bytes) => {
  const value = Number(bytes) || 0;

  const gb = value / 1024 ** 3;
  if (gb >= 1) return `${gb.toLocaleString('es-ES', { maximumFractionDigits: 1 })} GB`;

  const mb = value / 1024 ** 2;
  if (mb >= 1) {
    return `${mb.toLocaleString('es-ES', { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024)).toLocaleString('es-ES')} KB`;
};

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
