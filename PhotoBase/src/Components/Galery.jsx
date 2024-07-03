import React from 'react';

const Gallery = () => {
  return (
    <div className="p-4 flex-1">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(12)].map((_, index) => (
          <div key={index} className="bg-gray-300 p-2">
            <p className="text-center">Recuerdos</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="bg-gray-400 h-20"></div>
              ))}
            </div>
            <p className="text-center mt-2">Fecha</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
