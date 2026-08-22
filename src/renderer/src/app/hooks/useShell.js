import { useOutletContext } from 'react-router-dom';

/* Pages report their own subtitle up to the toolbar, since only the page
   knows what it is showing. */
export const useShell = () => useOutletContext();
