// src/components/Header/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';
// Import the logo image
import logoImage from '../../assets/thacatalyx_logo_icon.png';

function Header() {
  const location = useLocation();
  
  return (
    <header className="app-header">
      <div className="logo">
        <img src={logoImage} alt="Pin-The-Image Logo" className="logo-image" />
        <h1>Pin-The-Image</h1>
      </div>
      <nav className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        <Link to="/pti" className={location.pathname.startsWith('/pti') ? 'active' : ''}>
          Image Renderer
        </Link>
        {/* Add more navigation links as needed */}
      </nav>
    </header>
  );
}

export default Header;