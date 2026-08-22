import { useEffect, useState } from 'react';
import {
  PiCameraFill,
  PiApertureFill,
  PiMapPinFill,
  PiArrowSquareOutBold,
  PiImageFill,
} from 'react-icons/pi';
import { formatSize } from '../../../shared/format';

const TILE = 256;
const ZOOM = 14;
const MAP_WIDTH = 288;
const MAP_HEIGHT = 176;

/* Web Mercator, the projection every slippy map uses. Fractional tile
   coordinates rather than whole ones, so the marker lands on the exact
   spot instead of the corner of the tile that contains it. */
const tileX = (lon, zoom) => ((lon + 180) / 360) * 2 ** zoom;

const tileY = (lat, zoom) => {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
};

const MetadataPanel = ({ photo, onClose }) => {
  const [meta, setMeta] = useState(undefined);

  useEffect(() => {
    const api = globalThis.api?.library;
    if (!api?.metadata) {
      setMeta(null);
      return undefined;
    }

    let live = true;
    setMeta(undefined);
    api
      .metadata(photo.path, photo.kind)
      .then((value) => live && setMeta(value))
      .catch(() => live && setMeta(null));

    return () => {
      live = false;
    };
  }, [photo.path, photo.kind]);

  const rows = meta
    ? [
        ['Cámara', meta.camera],
        ['Objetivo', meta.lens],
        ['Apertura', meta.aperture ? `f/${meta.aperture}` : null],
        ['Distancia focal', meta.focal ? `${meta.focal} mm` : null],
        ['Exposición', meta.shutter],
        ['ISO', meta.iso],
        ['Resolución', meta.width && meta.height ? `${meta.width} × ${meta.height}` : null],
      ].filter(([, value]) => value !== null && value !== undefined && value !== '')
    : [];

  return (
    <aside className="glass-media absolute bottom-4 right-4 top-24 z-10 flex w-[336px] flex-col overflow-hidden rounded-lg">
      <header className="flex items-center gap-2 px-5 pb-3 pt-4">
        <PiImageFill className="text-ink-3" />
        <h2 className="eyebrow flex-1 text-ink-2">Información</h2>
        <button
          type="button"
          onClick={onClose}
          className="eyebrow text-ink-3 transition-colors duration-200 hover:text-ink"
        >
          Ocultar
        </button>
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto px-5 pb-5">
        <Row label="Archivo" value={photo.name} mono />
        <Row label="Tamaño" value={formatSize(photo.size)} />

        {meta === undefined && <p className="mt-4 text-[13px] text-ink-3">Leyendo metadatos…</p>}

        {meta !== undefined && !rows.length && (
          <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
            {photo.kind === 'video'
              ? 'Los vídeos no llevan datos EXIF que PhotoBase pueda leer.'
              : 'Esta imagen no lleva metadatos EXIF. Las capturas de pantalla casi nunca los traen.'}
          </p>
        )}

        {rows.length > 0 && (
          <>
            <Divider icon={PiCameraFill} label="Captura" />
            {rows.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </>
        )}

        {meta?.lat != null && meta?.lon != null && (
          <>
            <Divider icon={PiMapPinFill} label="Ubicación" />
            <MiniMap lat={meta.lat} lon={meta.lon} />
          </>
        )}
      </div>
    </aside>
  );
};

const Row = ({ label, value, mono }) => (
  <div className="flex items-baseline gap-3 border-b border-[rgba(255,255,255,0.07)] py-2.5 last:border-0">
    <span className="eyebrow shrink-0 text-ink-3">{label}</span>
    <span
      className={`min-w-0 flex-1 break-words text-right text-[13px] text-ink ${
        mono ? 'font-mono text-[12px]' : ''
      }`}
    >
      {value}
    </span>
  </div>
);

const Divider = ({ icon: Icon, label }) => (
  <div className="mt-5 flex items-center gap-2">
    <Icon className="text-[13px] text-ink-3" />
    <span className="eyebrow text-ink-3">{label}</span>
    <span className="h-px flex-1 bg-[rgba(255,255,255,0.1)]" />
  </div>
);

/* A 3×3 mosaic of map tiles rather than a mapping library: the tiles are
   plain images, the projection is nine lines of maths, and the panel does
   not need panning to answer "where was this taken". */
const MiniMap = ({ lat, lon }) => {
  const fx = tileX(lon, ZOOM);
  const fy = tileY(lat, ZOOM);
  const originX = Math.floor(fx);
  const originY = Math.floor(fy);

  const tiles = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const x = originX + dx;
      const y = originY + dy;
      tiles.push({
        x,
        y,
        left: (x - fx) * TILE + MAP_WIDTH / 2,
        top: (y - fy) * TILE + MAP_HEIGHT / 2,
      });
    }
  }

  const coords = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  return (
    <div className="mt-3">
      <div
        className="relative overflow-hidden rounded-sm bg-[var(--frame)]"
        style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
      >
        {tiles.map((tile) => (
          <img
            key={`${tile.x}-${tile.y}`}
            src={`https://tile.openstreetmap.org/${ZOOM}/${tile.x}/${tile.y}.png`}
            alt=""
            width={TILE}
            height={TILE}
            loading="lazy"
            className="pointer-events-none absolute max-w-none"
            style={{ left: tile.left, top: tile.top }}
          />
        ))}

        <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-md" />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink-2">{coords}</span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`}
          target="_blank"
          rel="noreferrer"
          className="eyebrow flex shrink-0 items-center gap-1 text-ink-3 transition-colors duration-200 hover:text-accent"
        >
          Abrir <PiArrowSquareOutBold />
        </a>
      </div>
    </div>
  );
};

export const MetadataToggleIcon = PiApertureFill;
export default MetadataPanel;
