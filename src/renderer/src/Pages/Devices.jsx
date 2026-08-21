import { useEffect } from 'react';
import {
  PiUsbFill,
  PiDeviceMobileFill,
  PiHardDriveFill,
  PiWarningFill,
} from 'react-icons/pi';
import EmptyState from '../Components/EmptyState';
import { useShell } from '../hooks/useShell';
import { useDevices } from '../hooks/useDevices';

/* This screen backs a device up: it COPIES media onto this machine and
   never moves or deletes anything on the phone. Any future transfer
   code must preserve that — the source is read-only, always. */
const Devices = () => {
  const { setSubtitle } = useShell();
  const { devices, ready, supported } = useDevices();

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
        hint="Desbloquéalo y elige «Transferir archivos» cuando te lo pida. PhotoBase lo detectará solo y podrás copiar sus fotos a este equipo."
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="eyebrow text-ink-3">Conectados ahora</h2>
        <span className="h-px flex-1 bg-[var(--glass-brd)]" />
      </div>

      <div className="flex flex-col gap-2">
        {devices.map((device) => (
          <DeviceRow key={device.id} device={device} />
        ))}
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
        PhotoBase copia las fotos a este equipo. Nunca se borra ni se mueve nada
        del dispositivo: lo que hay en tu móvil se queda donde está.
      </p>
    </div>
  );
};

const DeviceRow = ({ device }) => {
  const { name, kind, mountPath, readable } = device;
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
          className="shrink-0 rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-accent-ink transition-opacity duration-200 hover:opacity-90"
        >
          Crear copia de seguridad
        </button>
      ) : (
        <span className="eyebrow shrink-0 text-ink-3">Esperando acceso</span>
      )}
    </article>
  );
};

export default Devices;
