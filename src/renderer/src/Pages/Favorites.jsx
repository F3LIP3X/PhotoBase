import { useEffect } from 'react';
import { PiStarFill } from 'react-icons/pi';
import ContactSheet from '../Components/ContactSheet';
import EmptyState from '../Components/EmptyState';
import { useShell } from '../hooks/useShell';
import { FAVORITES, countItems } from '../data/library';

const Favorites = () => {
  const { setSubtitle } = useShell();
  const total = countItems(FAVORITES);

  useEffect(() => {
    setSubtitle(total ? `${total} elementos marcados` : '');
  }, [setSubtitle, total]);

  if (!total) {
    return (
      <EmptyState
        icon={PiStarFill}
        title="Aún no has marcado nada"
        hint="Pulsa la estrella sobre cualquier foto para tenerla siempre a mano aquí."
      />
    );
  }

  return <ContactSheet groups={FAVORITES} />;
};

export default Favorites;
