import { useEffect, useMemo } from 'react';
import { PiImagesSquareFill, PiMagnifyingGlassBold } from 'react-icons/pi';
import ContactSheet from '../Components/ContactSheet';
import EmptyState from '../Components/EmptyState';
import { useShell } from '../hooks/useShell';
import { useLibrary } from '../hooks/useLibrary';
import { filterGroups, countPhotos } from '../search';

const Photos = () => {
  const { setSubtitle, query } = useShell();
  const library = useLibrary();

  const groups = useMemo(
    () => filterGroups(library.groups, query),
    [library.groups, query],
  );
  const shown = countPhotos(groups);

  useEffect(() => {
    if (library.loading) setSubtitle('Leyendo la biblioteca…');
    else if (query) setSubtitle(`${shown} de ${library.total} elementos`);
    else setSubtitle(`${library.total} elementos · ${library.groups.length} meses`);
  }, [setSubtitle, library.loading, library.total, library.groups.length, query, shown]);

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

  if (query && !shown) {
    return (
      <EmptyState
        icon={PiMagnifyingGlassBold}
        title={`Nada coincide con «${query}»`}
        hint="Puedes buscar por nombre de archivo, mes, año, tipo o por la cámara con la que se hizo la foto."
      />
    );
  }

  return <ContactSheet groups={groups} library={library} />;
};

export default Photos;
