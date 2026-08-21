import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AiOutlineMail, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import Icon from './assets/Icon.png';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí añadirías la lógica para autenticar al usuario
    // Si la autenticación es exitosa, redirige a la página principal
    navigate('/gallery');
  };

  return (
    <div className="flex items-center justify-center min-h-screen overflow-hidden">
      <div className="card card-compact w-96 shadow-xl bg-gray-900 dark:bg-gray-900 h-full">
        <figure className="bg-white p-4">
          <img src={Icon} alt="Icon PhotoBase" className="h-24 mx-auto" />
        </figure>
        <div className="card-body text-gray-100">
          <h2 className="card-title text-center">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-control mb-4 flex items-center">
              <AiOutlineMail className="text-gray-300 mr-2" style={{ width: '1.5em', height: '1.5em' }} />
              <input 
                type="email" 
                placeholder="Correo Electrónico" 
                className="input input-bordered w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-transparent ml-2" 
              />
            </div>
            <div className="form-control mb-4 flex items-center relative">
              <AiOutlineLock className="text-gray-300 mr-2" style={{ width: '1.5em', height: '1.5em' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Contraseña" 
                value={password}
                onChange={handlePasswordChange}
                className="input input-bordered w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-transparent ml-2" 
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
            <div className="card-actions justify-center">
              <button type="submit" className="btn btn-primary w-full">Iniciar Sesión</button>
            </div>
            <div className="card-actions justify-center p-3">
              <p>¿No tienes una cuenta? <Link to="/register"><b>Crear Cuenta</b></Link></p>
              <p>¿Has olvidado la contraseña? <b>Restablecer Contraseña</b></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
