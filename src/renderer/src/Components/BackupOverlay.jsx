import { createPortal } from 'react-dom';
import { PiDeviceMobileFill, PiWarningFill } from 'react-icons/pi';
import { BackupProgress } from './BackupProgress';
import { useBackup } from '../hooks/useBackup';

/* Covers the app for as long as a copy runs.
 *
 * Not only to warn: the progress used to live on the Devices page, so
 * changing tab hid it and the copy looked like it had stopped. It never
 * had — it runs in the main process — but there is no telling that from
 * a screen that shows nothing. Now the copy is the screen. */
const BackupOverlay = () => {
  const backup = useBackup();
  if (!backup.running) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6 backdrop-blur-2xl"
      role="alertdialog"
      aria-modal="true"
      aria-label="Copia en curso"
    >
      <div className="glass-media w-full max-w-lg rounded-lg px-7 py-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--glass-bg-strong)]">
            <PiDeviceMobileFill className="text-[20px] text-accent" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[17px] leading-tight text-ink">Copia en curso</h2>
            <p className="eyebrow mt-1 truncate text-ink-3">
              {backup.deviceName ?? 'Dispositivo conectado'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-md bg-[rgba(0,0,0,0.24)] px-4 py-3">
          <PiWarningFill className="mt-0.5 shrink-0 text-accent-2" />
          <p className="text-[13px] leading-relaxed text-ink-2">
            No desconectes el móvil, no lo bloquees y no cierres PhotoBase hasta que
            termine. Si el teléfono se bloquea a mitad, la transferencia se queda
            esperando.
          </p>
        </div>

        <div className="mt-5">
          <BackupProgress backup={backup} onSurface />
        </div>

        <p className="mt-5 text-[12.5px] leading-relaxed text-ink-3">
          Puedes minimizar la ventana: la copia sigue por su cuenta y te avisamos al
          terminar. Lo que ya se haya copiado se conserva aunque se interrumpa.
        </p>
      </div>
    </div>,
    document.body,
  );
};

export default BackupOverlay;
