// GalleryHeader.jsx
import React from 'react';

//Img
import ImgLogo from '../assets/Icon.png';

const GalleryHeader = () => {
  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl text-white dark:text-gray-400">Galería</a>
      </div>
      <div className="flex-none gap-3">
        <div className="form-control w-auto ">
          <input type="text" placeholder="Buscar 'Granada'" className="input input-bordered w-auto" />
        </div>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
            <div className="w-10 rounded-full">
              <img
                alt="Tailwind CSS Navbar component"
                src={ImgLogo} />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
            <li>
              <a className="justify-between">
                Perfil
              </a>
            </li>
            <li><a>Ajustes</a></li>
            <li><a>Cerrar Sesión</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GalleryHeader;
