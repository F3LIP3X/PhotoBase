import { useEffect } from 'react';
import ContactSheet from '../Components/ContactSheet';
import { useShell } from '../hooks/useShell';
import { LIBRARY, countItems } from '../data/library';

const Photos = () => {
  const { setSubtitle } = useShell();

  useEffect(() => {
    setSubtitle(`${countItems(LIBRARY)} elementos · ${LIBRARY.length} días`);
  }, [setSubtitle]);

  return <ContactSheet groups={LIBRARY} />;
};

export default Photos;
