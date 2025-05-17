// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import WelcomePage from './pages/WelcomePage/WelcomePage';
import ImageRenderer from './pages/ImageRenderer/ImageRenderer';
// import AboutPage from './pages/AboutPage/AboutPage';
// import DashboardPage from './pages/DashboardPage/DashboardPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/pti" element={<ImageRenderer />}/>
          {/* <Route path="/about" element={<AboutPage />} />
          <Route path="/dashboard" element={<DashboardPage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;