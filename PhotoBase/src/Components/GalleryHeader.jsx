import React from 'react';

const GalleryHeader = () => {
  return (
    <div className="p-4 bg-gray-700 text-gray-100 flex items-center justify-between">
      <h1 className="text-2xl">Página Galería</h1>
      <div className="flex items-center">
        <input type="text" placeholder="Buscar 'Granada'" className="input input-bordered bg-gray-600 text-gray-100 placeholder-gray-400 mr-2" />
        <button className="btn btn-primary">Buscar</button>
      </div>
    </div>
  );
};

export default GalleryHeader;
