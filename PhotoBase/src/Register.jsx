import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './assets/Icon.png';

function Register() {
  return (
    <div className="flex items-center justify-center min-h-screen overflow-hidden">
      <div className="card card-compact w-96 shadow-xl bg-gray-900 dark:bg-gray-900 h-full">
        <figure className="bg-white p-4">
          <img src={Icon} alt="Icon PhotoBase" className="h-24 mx-auto" />
        </figure>
        <div className="card-body text-gray-100">
          <h2 className="card-title text-center text-white">Crear Cuenta</h2>
          <form>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-gray-300">Nombre</span>
              </label>
              <input 
                type="text" 
                placeholder="Tu nombre" 
                className="input input-bordered w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-transparent" 
                onFocus={(e) => e.target.setAttribute('placeholder', '')} 
                onBlur={(e) => e.target.setAttribute('placeholder', 'Tu nombre')}
              />
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-gray-300">Correo Electrónico</span>
              </label>
              <input 
                type="email" 
                placeholder="email@example.com" 
                className="input input-bordered w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-transparent" 
                onFocus={(e) => e.target.setAttribute('placeholder', '')} 
                onBlur={(e) => e.target.setAttribute('placeholder', 'email@example.com')}
              />
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text text-gray-300">Contraseña</span>
              </label>
              <input 
                type="password" 
                placeholder="***********" 
                className="input input-bordered w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-transparent" 
                onFocus={(e) => e.target.setAttribute('placeholder', '')} 
                onBlur={(e) => e.target.setAttribute('placeholder', '***********')}
              />
            </div>
            <div className="card-actions justify-center">
              <button type="submit" className="btn btn-primary w-full text-gray-100">Crear Cuenta</button>
            </div>
            <div className="card-actions justify-center p-3">
              <p>¿Ya tienes una cuenta? <Link to="/"><b>Iniciar Sesión</b></Link></p>
              <p>¿Has olvidado la contraseña? <b>Restablecer Contraseña</b></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
