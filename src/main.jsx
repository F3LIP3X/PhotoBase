import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Pages
import Login from './Login';
import Register from './Register';
import GalleryPage from './GaleryPage';  // Importa la página de la galería

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/gallery" element={<GalleryPage />} />  
      </Routes>
    </Router>
  </React.StrictMode>
);
