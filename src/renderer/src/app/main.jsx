import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import '../Styles/index.css';

import { BackupProvider } from '../features/devices/hooks/useBackup';
import Shell from '../components/layout/Shell';
import Welcome from '../features/settings/pages/Welcome';
import Setup from '../features/settings/pages/Setup';
import Lock from '../features/settings/pages/Lock';
import Photos from '../features/media/pages/Photos';
import Explore from '../features/media/pages/Explore';
import Favorites from '../features/media/pages/Favorites';
import Devices from '../features/devices/pages/Devices';
import Trash from '../features/media/pages/Trash';
import Settings from '../features/settings/pages/Settings';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BackupProvider>
      <Router>
        <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/bloqueo" element={<Lock />} />
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
    </BackupProvider>
  </React.StrictMode>,
);
