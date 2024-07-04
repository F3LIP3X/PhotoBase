import React from 'react';
import { Link } from 'react-router-dom';
import { AiFillHome, AiFillFolder, AiFillStar, AiFillDelete, AiFillCloud } from 'react-icons/ai';

// Img
import ImgLogo from '../assets/Icon.png';

const Sidebar = () => {
  return (
    <div className="w-64 bg-purple-100 text-gray-900 min-h-screen p-4">
      <Link to="/" className="mb-8 block">
        <img src={ImgLogo} alt="Icon" className="h-24 mx-auto" />
      </Link>
      <ul className="space-y-4">
        <li>
          <Link to="/fotos" className="flex items-center w-full">
            <button className="bg-white px-6 py-3 text-gray-900 relative overflow-hidden z-30 group hover:bg-purple-200 transition-all duration-500 rounded tracking-wider font-semibold flex items-center w-full">
              <AiFillHome className="mr-2" /> Fotos
            </button>
          </Link>
        </li>
        <li>
          <Link to="/explorar" className="flex items-center w-full">
            <button className="bg-white px-6 py-3 text-gray-900 relative overflow-hidden z-30 group hover:bg-purple-200 transition-all duration-500 rounded tracking-wider font-semibold flex items-center w-full">
              <AiFillFolder className="mr-2" /> Explorar
            </button>
          </Link>
        </li>
        <li>
          <Link to="/compartido" className="flex items-center w-full">
            <button className="bg-white px-6 py-3 text-gray-900 relative overflow-hidden z-30 group hover:bg-purple-200 transition-all duration-500 rounded tracking-wider font-semibold flex items-center w-full">
              <AiFillStar className="mr-2" /> Compartido
            </button>
          </Link>
        </li>
        <li>
          <Link to="/favoritos" className="flex items-center w-full">
            <button className="bg-white px-6 py-3 text-gray-900 relative overflow-hidden z-30 group hover:bg-purple-200 transition-all duration-500 rounded tracking-wider font-semibold flex items-center w-full">
              <AiFillStar className="mr-2" /> Favoritos
            </button>
          </Link>
        </li>
        <li>
          <Link to="/papelera" className="flex items-center w-full">
            <button className="bg-white px-6 py-3 text-gray-900 relative overflow-hidden z-30 group hover:bg-purple-200 transition-all duration-500 rounded tracking-wider font-semibold flex items-center w-full">
              <AiFillDelete className="mr-2" /> Papelera
            </button>
          </Link>
        </li>
      </ul>
      <div className="mt-8 p-4 bg-white rounded-lg">
        <p className="flex items-center mb-2">
          <AiFillCloud className="mr-2" size={24} /> Almacenamiento: 67GB de 100GB en uso
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '67%' }}></div>
        </div>
        <button className="bg-purple-500 text-white w-full py-2 rounded transition-all duration-500 hover:bg-purple-600">
          Aumentar Espacio
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
