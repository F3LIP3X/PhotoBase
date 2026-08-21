import { useState } from 'react';
import Rail from './Components/Rail';
import Toolbar from './Components/Toolbar';
import ContactSheet from './Components/ContactSheet';
import StoragePill from './Components/StoragePill';

const GalleryPage = () => {
  const [condensed, setCondensed] = useState(false);

  const handleScroll = (event) => {
    setCondensed(event.currentTarget.scrollTop > 8);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="ambient">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
      </div>

      {/* Full-bleed scroller: the sheet runs edge to edge and passes
          beneath the chrome, which is what makes the glass read as glass. */}
      <main
        onScroll={handleScroll}
        className="scroll-thin absolute inset-0 z-10 overflow-y-auto"
      >
        <div className="pb-28 pl-[108px] pr-6 pt-[104px]">
          <ContactSheet />
        </div>
      </main>

      <Rail />
      <Toolbar condensed={condensed} />
      <StoragePill />
    </div>
  );
};

export default GalleryPage;
