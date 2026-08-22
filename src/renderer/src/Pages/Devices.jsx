import { useEffect } from 'react';
import {
  PiUsbFill,
  PiDeviceMobileFill,
  PiHardDriveFill,
  PiWarningFill,
  PiArrowsClockwiseBold,
} from 'react-icons/pi';
import EmptyState from '../Components/EmptyState';
import { useShell } from '../hooks/useShell';
import { useDevices } from '../hooks/useDevices';
import { useBackup } from '../hooks/useBackup';

/* This screen backs a device up: it COPIES media onto this machine and
   never moves or deletes anything on the phone. Any future transfer
   code must preserve that — the source is read-only, always. */
const Devices = () => {
  const { setSubtitle } = useShell();
  const { devices, ready, refreshing, refresh, supported } = useDevices();
  const backup = useBackup();

  useEffect(() => {
    if (!ready) {
      setSubtitle('Buscando dispositivos…');
    } else if (devices.length) {
      setSubtitle(`${devices.length} detectado${devices.length > 1 ? 's' : ''}`);
    } else {
      setSubtitle('Ningún dispositivo conectado');
    }
  }, [setSubtitle, ready, devices.length]);

  if (!supported) {
    return (
      <EmptyState
        icon={PiWarningFill}
        title="Detección no disponible"
        hint="Esta vista necesita ejecutarse dentro de la aplicación de escritorio para poder ver los dispositivos conectados."
      />
    );
  }

  if (ready && !devices.length) {
    return (
      <EmptyState
        icon={PiUsbFill}
        title="Conecta tu teléfono por USB"
        hint="Desbloquéalo y elige «Transferir archivos» cuando te lo pida. PhotoBase lo detectará solo, pero puedes forzar una búsqueda."
      >
        <RefreshButton onClick={refresh} busy={refreshing} />
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="eyebrow text-ink-3">Conectados ahora</h2>
        <span className="h-px flex-1 bg-[var(--glass-brd)]" />
        <RefreshButton onClick={refresh} busy={refreshing} subtle />
      </div>

      <div className="flex flex-col gap-2">
        {devices.map((device) => (
          <DeviceRow key={device.id} device={device} backup={backup} />
        ))}
      </div>

      <BackupStatus backup={backup} />

      <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
        PhotoBase copia las fotos a este equipo. Nunca se borra ni se mueve nada
        del dispositivo: lo que hay en tu móvil se queda donde está.
      </p>
    </div>
  );
};

const BackupStatus = ({ backup }) => {
  const { running, progress, result, error } = backup;

  if (error) {
    return (
      <p className="mt-4 whitespace-pre-line rounded-md border border-accent-2 px-4 py-3 text-[13px] leading-relaxed text-ink-2">
        {error}
      </p>
    );
  }

  if (running) {
    /* Before the first file lands there is no count yet, so the bar shows
       the scan rather than pretending to know the total. */
    const done = progress?.copied ?? 0;
    const planned = progress?.planned ?? 0;
    const ratio = planned ? done / planned : 0;

    return (
      <div className="glass mt-4 rounded-md px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] text-ink">
            {planned ? `Copiando ${done} de ${planned}` : 'Buscando fotos nuevas…'}
          </p>
          {planned > 0 && (
            <span className="eyebrow text-ink-3">{Math.round(ratio * 100)} %</span>
          )}
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--glass-brd)]">
          <div
            className={`h-full rounded-full bg-accent transition-[width] duration-300 ease-glass ${
              planned ? '' : 'animate-pulse'
            }`}
            style={{ width: planned ? `${ratio * 100}%` : '100%' }}
          />
        </div>

        {progress?.name && (
          <p className="eyebrow mt-2 truncate text-ink-3">{progress.name}</p>
        )}
      </div>
    );
  }

  if (result) {
    if (result.blocked) {
      return (
        <p className="mt-4 rounded-md border border-accent-2 px-4 py-3 text-[13px] leading-relaxed text-ink-2">
          {result.message}
        </p>
      );
    }

    return (
      <p className="glass mt-4 rounded-md px-5 py-4 text-[13px] leading-relaxed text-ink-2">
        {result.copied > 0
          ? `Copiadas ${result.copied} fotos nuevas.`
          : 'Ya tenías todo copiado.'}
        {result.skipped > 0 && ` Se omitieron ${result.skipped} que ya estaban.`}
      </p>
    );
  }

  return null;
};

const RefreshButton = ({ onClick, busy, subtle }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className={
      subtle
        ? 'flex shrink-0 items-center gap-2 rounded-full border border-[var(--glass-brd)] px-4 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-200 hover:border-accent hover:text-ink disabled:opacity-50'
        : 'flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-[13px] font-semibold text-accent-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-50'
    }
  >
    <PiArrowsClockwiseBold className={busy ? 'animate-spin' : undefined} />
    {busy ? 'Buscando…' : 'Buscar de nuevo'}
  </button>
);

const DeviceRow = ({ device, backup }) => {
  const { name, kind, mountPath, readable } = device;
  const busy = backup.running;
  const Icon = kind === 'mtp' ? PiDeviceMobileFill : PiHardDriveFill;

  return (
    <article className="glass flex items-center gap-4 rounded-md px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--glass-bg-strong)]">
        <Icon className={`text-[18px] ${readable ? 'text-accent' : 'text-ink-3'}`} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-ink">{name}</p>
        <p className="eyebrow mt-1 truncate text-ink-3">
          {readable
            ? 'DCIM encontrado'
            : kind === 'mtp'
              ? 'Desbloquéalo y permite la transferencia de archivos'
              : (mountPath ?? 'Sin fotos que copiar')}
        </p>
      </div>

      {readable ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => backup.start(name)}
          className="shrink-0 rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-accent-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Copiando…' : 'Crear copia de seguridad'}
        </button>
      ) : (
        <span className="eyebrow shrink-0 text-ink-3">Esperando acceso</span>
      )}
    </article>
  );
};

export default Devices;
