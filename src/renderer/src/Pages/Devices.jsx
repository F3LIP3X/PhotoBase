import { useEffect } from 'react';
import { PiUsbFill, PiDeviceMobileFill, PiCheckCircleFill } from 'react-icons/pi';
import EmptyState from '../Components/EmptyState';
import { useShell } from '../hooks/useShell';
import { DEVICES } from '../data/library';

const Devices = () => {
  const { setSubtitle } = useShell();
  const connected = DEVICES.filter((device) => device.connected);

  useEffect(() => {
    setSubtitle(
      connected.length ? `${connected.length} conectado` : 'Ningún dispositivo conectado',
    );
  }, [setSubtitle, connected.length]);

  return (
    <div className="flex flex-col gap-8">
      {!connected.length && (
        <EmptyState
          icon={PiUsbFill}
          title="Conecta tu teléfono por USB"
          hint="En cuanto lo enchufes, PhotoBase encontrará las fotos y vídeos nuevos y podrás copiarlos a este equipo."
        />
      )}

      {DEVICES.length > 0 && (
        <section>
          <h2 className="eyebrow mb-3 text-ink-3">Dispositivos conocidos</h2>

          <div className="flex flex-col gap-2">
            {DEVICES.map(({ id, name, connected: isConnected, lastBackup, newItems }) => (
              <article
                key={id}
                className="glass flex items-center gap-4 rounded-md px-5 py-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--glass-bg-strong)]">
                  <PiDeviceMobileFill className="text-[18px] text-ink-3" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{name}</p>
                  <p className="eyebrow mt-1 flex items-center gap-1.5 text-ink-3">
                    {isConnected ? (
                      `${newItems} elementos nuevos`
                    ) : (
                      <>
                        <PiCheckCircleFill className="text-accent" />
                        Última copia · {lastBackup}
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!isConnected}
                  className="shrink-0 rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-accent-ink transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Copiar ahora
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Devices;
