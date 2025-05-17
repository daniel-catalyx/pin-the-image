// src/pages/WelcomePage/WelcomePage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAlchemer } from '../../context/AlchemerContext';
import './WelcomePage.css';

function WelcomePage() {
  // This hook gives you access to the navigate function from React Router
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get the Alchemer context values
  const { projectId, setProjectId } = useAlchemer();

  // If coming from the header navigation, redirect back to homepage if no project ID
  React.useEffect(() => {
    // Only check if we're on the ImageRenderer page
    if (location.pathname === '/pti' && !projectId.trim()) {
      navigate('/');
      setError("Please set an Alchemer Project ID before proceeding.");
    }
  }, [location.pathname, projectId, navigate]);

  const handleImageRendererClick = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First check if there are any available images
      const response = await fetch('/api/available-images/');
      const data = await response.json();
      
      if (data.images && data.images.length > 0) {
        // We have images available, navigate to the renderer page
        // We'll pass the first image URL as state to the route
        navigate('/pti', { state: { imageUrl: data.images[0].url } });
      } else {
        // No images found
        setError("No images found in the dummy_data directory. Please add some images first.");
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setError("Failed to connect to the backend. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectIdChange = (e) => {
    setProjectId(e.target.value);
  };

  const handleProjectIdSubmit = (e) => {
    e.preventDefault();
    // Here you could add validation or make an API call if needed
    alert(`Alchemer Project ID set to: ${projectId}`);
  };

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h2>Welcome to Pin-The-Image App!</h2>
       
        
        {/* Alchemer Project ID input form */}
        <div className="project-id-section">
          <h3>Alchemer Project Settings</h3>
          <form onSubmit={handleProjectIdSubmit} className="project-id-form">
            <div className="form-group">
              <label htmlFor="projectId">Alchemer Project ID:</label>
              <input
                type="text"
                id="projectId"
                value={projectId}
                onChange={handleProjectIdChange}
                placeholder="Enter project ID"
                required
              />
            </div>
            <button type="submit" className="welcome-button">Save Project ID</button>
          </form>
        </div>
        
        <div className="action-buttons">
          {/* Button to navigate to the ImageRenderer page */}
          <button 
            className="welcome-button"
            onClick={handleImageRendererClick}
            disabled={loading || !projectId.trim()}
          >
            {loading ? 'Loading...' : 'Go to Image Renderer'}
          </button>
        </div>
        
        {/* Error message if any */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {/* Display a message if no project ID is set */}
        {!projectId.trim() && (
          <p className="info-message">Please set an Alchemer Project ID before proceeding.</p>
        )}
      </div>
    </div>
  );
}

export default WelcomePage;