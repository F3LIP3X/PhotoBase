import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './Styles/index.css';

import Shell from './Components/Shell';
import Welcome from './Welcome';
import Setup from './Pages/Setup';
import Photos from './Pages/Photos';
import Explore from './Pages/Explore';
import Favorites from './Pages/Favorites';
import Devices from './Pages/Devices';
import Trash from './Pages/Trash';
import Settings from './Pages/Settings';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/configurar" element={<Setup />} />

        <Route element={<Shell />}>
          <Route path="/fotos" element={<Photos />} />
          <Route path="/explorar" element={<Explore />} />
          <Route path="/favoritos" element={<Favorites />} />
          <Route path="/dispositivos" element={<Devices />} />
          <Route path="/papelera" element={<Trash />} />
          <Route path="/ajustes" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/fotos" replace />} />
      </Routes>
    </Router>
  </React.StrictMode>,
);
