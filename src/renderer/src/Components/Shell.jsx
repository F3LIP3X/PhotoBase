import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Rail from './Rail';
import Toolbar from './Toolbar';
import StoragePill from './StoragePill';
import { findSection } from '../navigation';

const Shell = () => {
  const { pathname } = useLocation();
  const [condensed, setCondensed] = useState(false);
  const [subtitle, setSubtitle] = useState('');

  const section = findSection(pathname);

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="ambient">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
      </div>

      {/* Full-bleed scroller: content runs edge to edge and passes beneath
          the chrome, which is what makes the glass read as glass. */}
      <main
        onScroll={(event) => setCondensed(event.currentTarget.scrollTop > 8)}
        className="scroll-thin absolute inset-0 z-10 overflow-y-auto"
      >
        <div className="pb-28 pl-[108px] pr-6 pt-[104px]">
          <Outlet context={{ setSubtitle }} />
        </div>
      </main>

      <Rail />
      <Toolbar
        title={section?.label ?? 'PhotoBase'}
        subtitle={subtitle}
        searchable={section?.searchable ?? false}
        condensed={condensed}
      />
      <StoragePill />
    </div>
  );
};

export default Shell;
