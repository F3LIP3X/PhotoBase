import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './Styles/index.css';

// Pages
import Welcome from './Welcome';
import GalleryPage from './GaleryPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/gallery" element={<GalleryPage />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
