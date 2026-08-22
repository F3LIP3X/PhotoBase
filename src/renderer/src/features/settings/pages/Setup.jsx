import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiFolderOpenFill, PiArrowRightBold } from 'react-icons/pi';
import Mark from '../../../components/ui/Mark';
import { useSettings } from '../hooks/useSettings';

/* First run: the two things PhotoBase cannot guess. The folder is
   prefilled with a sensible suggestion but stays editable, because photo
   libraries often belong on a second drive. */
function Setup() {
  const navigate = useNavigate();
  const { settings, loading, save, pickFolder } = useSettings();

  const [folder, setFolder] = useState('');
  const [quota, setQuota] = useState('30');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!settings) return;
    setFolder(settings.libraryPath ?? settings.suggestedPath ?? '');
    if (settings.quotaGB) setQuota(String(settings.quotaGB));
  }, [settings]);

  const quotaValue = Number(quota);
  const quotaValid = Number.isFinite(quotaValue) && quotaValue > 0;
  const canContinue = folder.trim() && quotaValid && !saving;

  const browse = async () => {
    const chosen = await pickFolder();
    if (chosen) setFolder(chosen);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canContinue) return;

    setSaving(true);
    setError(null);
    try {
      await save({ libraryPath: folder.trim(), quotaGB: quotaValue });
      navigate('/fotos');
    } catch (cause) {
      /* Say what failed instead of leaving the button spinning. */
      setError(cause?.message ?? 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden">
      <div className="ambient">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
      </div>

      <form
        onSubmit={submit}
        className="glass glass-strong relative z-10 w-[520px] rounded-lg px-9 py-9"
      >
        <Mark size={30} />

        <h1 className="mt-5 text-[22px] text-ink">Prepara tu biblioteca</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
          Dos cosas y empezamos. Podrás cambiarlas más adelante en Ajustes.
        </p>

        <label className="mt-7 block">
          <span className="eyebrow text-ink-3">Carpeta de la biblioteca</span>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
              spellCheck={false}
              className="min-w-0 flex-1 rounded-sm bg-[var(--glass-bg-strong)] px-3.5 py-2.5 font-mono text-[12px] text-ink outline-none"
            />
            <button
              type="button"
              onClick={browse}
              className="flex shrink-0 items-center gap-2 rounded-sm border border-[var(--glass-brd)] px-4 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:border-accent hover:text-ink"
            >
              <PiFolderOpenFill />
              Examinar
            </button>
          </div>
          <p className="mt-2 text-[12px] text-ink-3">
            Si no existe, se creará. Puedes elegir otro disco si tienes uno más
            grande.
          </p>
        </label>

        <label className="mt-6 block">
          <span className="eyebrow text-ink-3">Espacio máximo</span>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={quota}
              onChange={(event) => setQuota(event.target.value)}
              className="w-28 rounded-sm bg-[var(--glass-bg-strong)] px-3.5 py-2.5 text-[14px] text-ink outline-none"
            />
            <span className="text-[14px] text-ink-2">GB</span>
          </div>
          <p className="mt-2 text-[12px] text-ink-3">
            Te avisaremos al 90 %. Al llegar al límite se detienen las copias
            nuevas: nunca se borra nada por tu cuenta.
          </p>
        </label>

        {error && (
          <p className="mt-6 whitespace-pre-line rounded-sm border border-accent-2 px-4 py-3 text-[13px] leading-relaxed text-ink-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canContinue}
          className="group mt-8 flex w-full items-center justify-center gap-2.5 rounded-full bg-accent py-3 text-[14px] font-semibold text-accent-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-40"
        >
          {saving ? 'Guardando…' : 'Empezar'}
          <PiArrowRightBold className="transition-transform duration-300 ease-glass group-hover:translate-x-1" />
        </button>
      </form>
    </div>
  );
}

export default Setup;
