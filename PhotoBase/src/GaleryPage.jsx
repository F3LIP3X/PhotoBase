// GalleryPage.jsx
import React from 'react';
import Sidebar from './Components/Sidebar';
import GalleryHeader from './Components/GalleryHeader';
import Gallery from './Components/Galery';

const GalleryPage = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <GalleryHeader />
        <Gallery />
      </div>
    </div>
  );
};

export default GalleryPage;
