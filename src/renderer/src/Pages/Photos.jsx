import { useEffect } from 'react';
import { PiImagesSquareFill } from 'react-icons/pi';
import ContactSheet from '../Components/ContactSheet';
import EmptyState from '../Components/EmptyState';
import { useShell } from '../hooks/useShell';
import { useLibrary } from '../hooks/useLibrary';

const Photos = () => {
  const { setSubtitle } = useShell();
  const library = useLibrary();

  useEffect(() => {
    if (library.loading) setSubtitle('Leyendo la biblioteca…');
    else setSubtitle(`${library.total} elementos · ${library.groups.length} meses`);
  }, [setSubtitle, library.loading, library.total, library.groups.length]);

  if (library.loading) return null;

  if (!library.total) {
    return (
      <EmptyState
        icon={PiImagesSquareFill}
        title="Tu biblioteca está vacía"
        hint="Conecta el móvil por USB desde Dispositivos y crea tu primera copia de seguridad."
      />
    );
  }

  return <ContactSheet groups={library.groups} library={library} />;
};

export default Photos;
