import React from 'react';
import { AiFillHome, AiFillFolder, AiFillStar, AiFillDelete } from 'react-icons/ai';

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 text-gray-100 min-h-screen p-4">
      <div className="mb-8">
        <img src="./assets/Icon.png" alt="Icon" className="h-12 mx-auto" />
      </div>
      <ul>
        <li className="flex items-center mb-4">
          <AiFillHome className="mr-2" /> Fotos
        </li>
        <li className="flex items-center mb-4">
          <AiFillFolder className="mr-2" /> Álbumes
        </li>
        <li className="flex items-center mb-4">
          <AiFillStar className="mr-2" /> Favoritos
        </li>
        <li className="flex items-center mb-4">
          <AiFillDelete className="mr-2" /> Papelera
        </li>
      </ul>
      <div className="mt-auto">
        <p>Almacenamiento: 67GB de 100GB en uso</p>
        <button className="btn btn-primary w-full mt-4">Aumentar Espacio</button>
      </div>
    </div>
  );
};

export default Sidebar;
