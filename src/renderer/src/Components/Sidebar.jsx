// Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AiFillHome, AiFillFolder, AiFillStar, AiFillDelete, AiFillCloud } from 'react-icons/ai';
import ImgLogo from '../assets/Icon.png';

const Sidebar = () => {
  return (
    <div className="w-64 bg-purple-100 text-gray-900 min-h-screen p-4">
      <Link to="/" className="mb-8 block">
        <img src={ImgLogo} alt="Icon" className="h-24 mx-auto" />
      </Link>
      <ul className="space-y-4">
        <li><SidebarButton to="/fotos" icon={<AiFillHome />} label="Fotos" /></li>
        <li><SidebarButton to="/explorar" icon={<AiFillFolder />} label="Explorar" /></li>
        <li><SidebarButton to="/compartido" icon={<AiFillFolder />} label="Compartido" /></li>
        <li><SidebarButton to="/favoritos" icon={<AiFillStar />} label="Favoritos" /></li>
        <li><SidebarButton to="/papelera" icon={<AiFillDelete />} label="Papelera" /></li>
      </ul>
      <StorageInfo />
    </div>
  );
};

const SidebarButton = ({ to, icon, label }) => (
  <Link to={to} className="flex items-center w-full">
    <button className="bg-white px-6 py-3 text-gray-900 relative overflow-hidden z-30 group hover:bg-purple-200 transition-all duration-500 rounded tracking-wider font-semibold flex items-center w-full">
      {icon} <span className="ml-2">{label}</span>
    </button>
  </Link>
);

const StorageInfo = () => (
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
);

export default Sidebar;
