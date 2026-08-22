import { useEffect, useMemo } from 'react';
import { PiStarFill } from 'react-icons/pi';
import ContactSheet from '../Components/ContactSheet';
import EmptyState from '../Components/EmptyState';
import { useShell } from '../hooks/useShell';
import { useLibrary } from '../hooks/useLibrary';
import { filterGroups } from '../search';

const Favorites = () => {
  const { setSubtitle, query } = useShell();
  const library = useLibrary();

  /* Favourites are filtered out of the same scan rather than stored
     separately, so a photo keeps its place in its month. */
  const groups = useMemo(() => {
    const starred = library.groups
      .map((group) => ({
        ...group,
        photos: group.photos.filter((photo) => library.isFavorite(photo.path)),
      }))
      .filter((group) => group.photos.length)
      .map((group) => ({ ...group, count: group.photos.length }));

    return filterGroups(starred, query);
  }, [library, query]);

  const total = groups.reduce((sum, group) => sum + group.count, 0);

  useEffect(() => {
    setSubtitle(library.loading ? '' : `${total} marcados`);
  }, [setSubtitle, library.loading, total]);

  if (library.loading) return null;

  if (!total) {
    return (
      <EmptyState
        icon={PiStarFill}
        title="Aún no has marcado nada"
        hint="Abre cualquier foto y pulsa la estrella para tenerla siempre a mano aquí. La foto no se mueve de su sitio."
      />
    );
  }

  return <ContactSheet groups={groups} library={library} />;
};

export default Favorites;
