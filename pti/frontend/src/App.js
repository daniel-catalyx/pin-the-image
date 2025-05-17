// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header/Header';
import WelcomePage from './pages/WelcomePage/WelcomePage';
import ImageRenderer from './pages/ImageRenderer/ImageRenderer';
import { AlchemerProvider, useAlchemer } from './context/AlchemerContext';
// import AboutPage from './pages/AboutPage/AboutPage';
// import DashboardPage from './pages/DashboardPage/DashboardPage';

// Protected route component that checks for ProjectID
function ProtectedRoute({ children }) {
  const { projectId } = useAlchemer();
  
  if (!projectId.trim()) {
    // Redirect to home page if no project ID is set
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route 
            path="/pti" 
            element={
              <ProtectedRoute>
                <ImageRenderer />
              </ProtectedRoute>
            }
          />
          {/* <Route path="/about" element={<AboutPage />} />
          <Route path="/dashboard" element={<DashboardPage />} /> */}
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AlchemerProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AlchemerProvider>
  );
}

export default App;