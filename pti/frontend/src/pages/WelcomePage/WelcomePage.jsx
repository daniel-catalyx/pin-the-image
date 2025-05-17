import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';

function WelcomePage() {
  // This hook gives you access to the navigate function from React Router
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <h1>Welcome to Pin-The-Image App!</h1>
        <p>This is a React frontend served by Django backend.</p>
        
        {/* Backend test button */}
        <button 
          className="welcome-button"
          onClick={() => {
            fetch('/api/hello/')
              .then(response => response.json())
              .then(data => alert(data.message))
              .catch(error => console.error('Error:', error));
          }}
        >
          Test Backend Connection
        </button>
        
        {/* Button to navigate to the ImageRenderer page */}
        <button 
          className="welcome-button"
          onClick={handleImageRendererClick}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Go to Image Renderer'}
        </button>
        
        {/* Error message if any */}
        {error && (
          <div className="error-message" style={{ 
            color: 'red', 
            marginTop: '1rem', 
            padding: '0.5rem', 
            backgroundColor: '#ffeeee', 
            borderRadius: '4px' 
          }}>
            {error}
          </div>
        )}
        
   
      </header>
    </div>
  );
}

export default WelcomePage;