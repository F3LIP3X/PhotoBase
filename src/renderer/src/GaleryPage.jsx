import React from 'react';
import Sidebar from './Components/Sidebar';
import GalleryHeader from './Components/GalleryHeader';
import Gallery from './Components/Galery';

const GalleryPage = () => {
  return (
    <div className="relative flex h-screen gap-4 overflow-hidden p-4">
      <div className="ambient-backdrop" />
      <div className="ambient-overlay" />

      <Sidebar />
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <GalleryHeader />
        <Gallery />
      </div>
    </div>
  );
};

export default GalleryPage;
