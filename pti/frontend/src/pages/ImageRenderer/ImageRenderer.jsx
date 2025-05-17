import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RefreshCw, MousePointer, Hand, Move } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ImageRenderer.css';

// Dummy data for pins and comments - with normalized coordinates between 0-1
const dummyPins = [
  { id: 1, x: 0.25, y: 0.2, comment: "I love the color scheme in this area!" },
  { id: 2, x: 0.4, y: 0.35, comment: "The layout here is confusing. Could be improved." },
  { id: 3, x: 0.6, y: 0.25, comment: "This section feels very intuitive to use." },
  { id: 4, x: 0.3, y: 0.5, comment: "The text is too small to read comfortably." },
  { id: 5, x: 0.55, y: 0.55, comment: "Great visual hierarchy in this section." },
  { id: 6, x: 0.7, y: 0.35, comment: "Would be nice to have more contrast here." },
  { id: 7, x: 0.2, y: 0.4, comment: "Navigation in this area works well." },
  { id: 8, x: 0.65, y: 0.2, comment: "This part seems unnecessarily complex." },
  { id: 9, x: 0.3, y: 0.7, comment: "I really like how this information is organized." },
  { id: 10, x: 0.6, y: 0.6, comment: "The interactive elements here are fun to use!" },
];

// Interaction modes
const INTERACTION_MODES = {
  SELECT: 'select',
  PAN: 'pan'
};

const ImageAnnotationApp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get the image URL from the route state, or use a default
  const defaultImageUrl = '/api/annotation-image/';
  const imageUrlFromState = location.state?.imageUrl || defaultImageUrl;
  
  const [pins, setPins] = useState(dummyPins);
  const [selectedPins, setSelectedPins] = useState([]);
  const [selectionActive, setSelectionActive] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [imageUrl, setImageUrl] = useState(imageUrlFromState);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [availableImages, setAvailableImages] = useState([]);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [imageRect, setImageRect] = useState({ width: 0, height: 0, left: 0, top: 0 });
  const [interactionMode, setInteractionMode] = useState(INTERACTION_MODES.SELECT);
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);
  const imageRef = useRef(null);
  const viewportRef = useRef(null);

  // Disable text selection when in selection mode
  useEffect(() => {
    const preventSelection = (e) => {
      if (interactionMode === INTERACTION_MODES.SELECT && selectionActive) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('selectstart', preventSelection);
    return () => {
      document.removeEventListener('selectstart', preventSelection);
    };
  }, [interactionMode, selectionActive]);

  // Load available images on component mount
  useEffect(() => {
    fetch('/api/available-images/')
      .then(response => response.json())
      .then(data => {
        if (data.images && data.images.length > 0) {
          setAvailableImages(data.images);
          
          // If no specific image was passed and we have images available,
          // set the first available image
          if (!location.state?.imageUrl && data.images.length > 0) {
            setImageUrl(data.images[0].url);
          }
        }
      })
      .catch(error => {
        console.error('Error fetching available images:', error);
      });
  }, [location.state]);

  // Load image when imageUrl changes
  useEffect(() => {
    if (!imageUrl) {
      return;
    }
    
    // Reset error state when trying to load a new image
    setImageError(false);
    setImageLoaded(false);
    setPanPosition({ x: 0, y: 0 }); // Reset pan position
    
    // Create an image element to test loading
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      setImageError(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Update image rect when image loads or container resizes
  useEffect(() => {
    if (!imageLoaded || !imageRef.current) return;

    const updateImageRect = () => {
      const containerRect = imageContainerRef.current.getBoundingClientRect();
      const imgRect = imageRef.current.getBoundingClientRect();
      
      setImageRect({
        width: imgRect.width / scale,
        height: imgRect.height / scale,
        left: (imgRect.left - containerRect.left) / scale,
        top: (imgRect.top - containerRect.top) / scale
      });
    };

    updateImageRect();
    
    // Add resize observer to detect container size changes
    const resizeObserver = new ResizeObserver(updateImageRect);
    resizeObserver.observe(imageContainerRef.current);

    // Also update when scale or panPosition changes
    window.addEventListener('resize', updateImageRect);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateImageRect);
    };
  }, [imageLoaded, scale, panPosition]);

  // Handle keyboard events for mode switching
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Hold Spacebar to temporarily switch to pan mode
      if (e.code === 'Space' && !e.repeat && interactionMode === INTERACTION_MODES.SELECT) {
        e.preventDefault(); // Prevent page scrolling on space
        setInteractionMode(INTERACTION_MODES.PAN);
      }
    };

    const handleKeyUp = (e) => {
      // Release Spacebar to go back to selection mode
      if (e.code === 'Space' && interactionMode === INTERACTION_MODES.PAN) {
        e.preventDefault();
        setInteractionMode(INTERACTION_MODES.SELECT);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [interactionMode]);

  // Handle change to a different image
  const handleImageChange = (newImageUrl) => {
    setImageUrl(newImageUrl);
    // Reset selection and pins when changing images
    resetSelection();
    setPanPosition({ x: 0, y: 0 }); // Reset pan position
  };

  // Go back to welcome page
  const handleBackToWelcome = () => {
    navigate('/');
  };

  // Toggle interaction mode
  const toggleInteractionMode = () => {
    setInteractionMode(prev => 
      prev === INTERACTION_MODES.SELECT ? INTERACTION_MODES.PAN : INTERACTION_MODES.SELECT
    );
  };

  // Convert normalized pin coordinates to viewport coordinates
  const getPinViewportPosition = (pin) => {
    // We're using normalized coordinates where pins are positioned in 0-1 range
    // relative to the image dimensions, not absolute pixel positions
    
    if (!imageRef.current) return { x: 0, y: 0 };
    
    const imgElement = imageRef.current;
    const imgRect = imgElement.getBoundingClientRect();
    
    // Calculate actual displayed image dimensions (accounting for object-fit: contain)
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const containerAspect = containerRect.width / containerRect.height;
    const imageAspect = imageDimensions.width / imageDimensions.height;
    
    let displayWidth, displayHeight;
    
    if (imageAspect > containerAspect) {
      // Image is wider than container (letterboxed)
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / imageAspect;
    } else {
      // Image is taller than container (pillarboxed)
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * imageAspect;
    }
    
    // Calculate the position within the actual displayed image
    const x = pin.x * displayWidth;
    const y = pin.y * displayHeight;
    
    // Account for centering (object-fit: contain centers the image)
    const offsetX = (containerRect.width - displayWidth) / 2;
    const offsetY = (containerRect.height - displayHeight) / 2;
    
    // Apply scale and pan
    return {
      x: offsetX + x * scale + panPosition.x,
      y: offsetY + y * scale + panPosition.y
    };
  };

  // Convert viewport coordinates to normalized coordinates
  const viewportToNormalizedCoords = (viewportX, viewportY) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    
    const imgElement = imageRef.current;
    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const imageAspect = imageDimensions.width / imageDimensions.height;
    const containerAspect = containerRect.width / containerRect.height;
    
    let displayWidth, displayHeight;
    
    if (imageAspect > containerAspect) {
      // Image is wider than container
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / imageAspect;
    } else {
      // Image is taller than container
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * imageAspect;
    }
    
    // Account for centering (object-fit: contain centers the image)
    const offsetX = (containerRect.width - displayWidth) / 2;
    const offsetY = (containerRect.height - displayHeight) / 2;
    
    // Adjust for pan and scale
    const adjustedX = (viewportX - offsetX - panPosition.x) / scale;
    const adjustedY = (viewportY - offsetY - panPosition.y) / scale;
    
    // Convert to normalized coordinates (0-1)
    return {
      x: adjustedX / displayWidth,
      y: adjustedY / displayHeight
    };
  };

  // Handle mouse down
  const handleMouseDown = (e) => {
    if (!imageLoaded) return;

    // Get mouse position relative to the container
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (interactionMode === INTERACTION_MODES.SELECT && !selectionActive) {
      // Start selection
      const normalizedPos = viewportToNormalizedCoords(x, y);
      setSelectionStart(normalizedPos);
      setSelectionEnd(normalizedPos);
      setSelectionActive(true);
      
      // Prevent default browser selection
      e.preventDefault();
    } else if (interactionMode === INTERACTION_MODES.PAN) {
      // Start panning
      setPanStart({ x: e.clientX, y: e.clientY });
      setIsPanning(true);
      // Change cursor during panning
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    }
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    if (!imageLoaded) return;

    // Get mouse position relative to the container
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectionActive && interactionMode === INTERACTION_MODES.SELECT) {
      // Update selection
      const normalizedPos = viewportToNormalizedCoords(x, y);
      setSelectionEnd(normalizedPos);
      e.preventDefault();
    } else if (isPanning && interactionMode === INTERACTION_MODES.PAN) {
      // Update panning
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPanPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  // Handle mouse up
  const handleMouseUp = (e) => {
    // Restore default cursor
    document.body.style.cursor = '';

    if (selectionActive && interactionMode === INTERACTION_MODES.SELECT) {
      // Complete selection
      // Find pins within selection area, using normalized coordinates
      const selected = pins.filter(pin => {
        const minX = Math.min(selectionStart.x, selectionEnd.x);
        const maxX = Math.max(selectionStart.x, selectionEnd.x);
        const minY = Math.min(selectionStart.y, selectionEnd.y);
        const maxY = Math.max(selectionStart.y, selectionEnd.y);

        return pin.x >= minX && pin.x <= maxX && pin.y >= minY && pin.y <= maxY;
      });

      setSelectedPins(selected);
      setSelectionActive(false);
    }

    // End panning
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Reset selection and selected pins
  const resetSelection = () => {
    setSelectedPins([]);
    setSelectionActive(false);
    setSelectionStart({ x: 0, y: 0 });
    setSelectionEnd({ x: 0, y: 0 });
  };

  // Reset pan position
  const resetPan = () => {
    setPanPosition({ x: 0, y: 0 });
  };

  // Reset everything
  const resetView = () => {
    resetSelection();
    resetPan();
    setScale(1);
  };

  // Handle zoom in
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  // Handle zoom out
  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  // Calculate selection rectangle coordinates in viewport space
  const getSelectionRectStyle = () => {
    if (!selectionActive) return {};

    const startPos = getPinViewportPosition({
      x: selectionStart.x,
      y: selectionStart.y
    });
    
    const endPos = getPinViewportPosition({
      x: selectionEnd.x,
      y: selectionEnd.y
    });
    
    return {
      left: Math.min(startPos.x, endPos.x) + 'px',
      top: Math.min(startPos.y, endPos.y) + 'px',
      width: Math.abs(endPos.x - startPos.x) + 'px',
      height: Math.abs(endPos.y - startPos.y) + 'px'
    };
  };

  // Handle wheel event for zooming
  const handleWheel = (e) => {
    if (!imageLoaded) return;
    
    // Use Ctrl/Cmd + wheel for zooming
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      // Get mouse position relative to container before zoom
      const rect = imageContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate zoom factor
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.1 : 0.9;
      
      // Calculate new scale
      const newScale = Math.max(0.5, Math.min(3, scale * zoomFactor));
      
      // Calculate new pan position to zoom toward mouse position
      if (newScale !== scale) {
        const scaleRatio = newScale / scale;
        const panDeltaX = (mouseX - panPosition.x) * (scaleRatio - 1);
        const panDeltaY = (mouseY - panPosition.y) * (scaleRatio - 1);
        
        setPanPosition({
          x: panPosition.x - panDeltaX,
          y: panPosition.y - panDeltaY
        });
        
        setScale(newScale);
      }
    }
  };

  // Set cursor style based on interaction mode
  const getCursorStyle = () => {
    if (!imageLoaded) return 'default';
    if (interactionMode === INTERACTION_MODES.SELECT) return 'crosshair';
    if (interactionMode === INTERACTION_MODES.PAN) return isPanning ? 'grabbing' : 'grab';
    return 'default';
  };

  return (
    <div className="image-annotation-container">
      {/* Left panel - Image with pins */}
      <div className="image-panel">
        <div className="panel-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="panel-title">Survey Results Visualization</h2>
            <button 
              onClick={handleBackToWelcome}
              className="toolbar-button secondary-button"
              style={{ marginLeft: 'auto' }}
            >
              Back to Welcome
            </button>
          </div>
          
          {/* Image selector if multiple images are available */}
          {availableImages.length > 1 && (
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="image-selector" style={{ marginRight: '0.5rem' }}>Select Image:</label>
              <select 
                id="image-selector"
                value={imageUrl}
                onChange={(e) => handleImageChange(e.target.value)}
                style={{ 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.25rem',
                  border: '1px solid #d1d5db'
                }}
              >
                {availableImages.map((image, index) => (
                  <option key={index} value={image.url}>
                    {image.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Toolbar */}
          <div className="toolbar">
            {/* Mode toggle */}
            <button 
              onClick={toggleInteractionMode}
              className={`toolbar-button mode-button ${interactionMode === INTERACTION_MODES.SELECT ? 'mode-select' : 'mode-pan'}`}
              disabled={!imageLoaded}
              title={interactionMode === INTERACTION_MODES.SELECT ? "Selection Mode (Click to switch to Pan Mode)" : "Pan Mode (Click to switch to Selection Mode)"}
            >
              {interactionMode === INTERACTION_MODES.SELECT ? (
                <><MousePointer size={16} className="mr-1" /> Select</>
              ) : (
                <><Hand size={16} className="mr-1" /> Pan</>
              )}
            </button>

            <div className="toolbar-divider"></div>
            
            <button 
              onClick={zoomIn} 
              className="toolbar-button primary-button"
              disabled={!imageLoaded}
              title="Zoom In"
            >
              <ZoomIn size={20} />
            </button>
            <button 
              onClick={zoomOut} 
              className="toolbar-button primary-button"
              disabled={!imageLoaded}
              title="Zoom Out"
            >
              <ZoomOut size={20} />
            </button>
            <button 
              onClick={resetView} 
              className="toolbar-button secondary-button"
              disabled={!imageLoaded}
              title="Reset View"
            >
              <RefreshCw size={20} className="mr-1" /> Reset View
            </button>
            {selectedPins.length > 0 && (
              <span style={{fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem'}}>
                {selectedPins.length} pins selected
              </span>
            )}
          </div>

          {/* Keyboard shortcuts info */}
          <div className="keyboard-shortcuts">
            <span>Pro tip: Hold <kbd>Space</kbd> to temporarily switch to pan mode.</span>
            <span>Use <kbd>Ctrl</kbd> + scroll to zoom.</span>
          </div>
          
          {/* Image container */}
          <div 
            ref={imageContainerRef}
            className="image-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ 
              cursor: getCursorStyle(),
              overflow: 'hidden',
              userSelect: 'none', // Prevent text selection
            }}
          >
            {/* Placeholder or error state */}
            {imageError ? (
              <div className="placeholder-image" style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb'
              }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ marginBottom: '1rem', color: '#ef4444', fontWeight: 'bold' }}>
                    Failed to load image
                  </p>
                  <p>
                    Please make sure you've added image files to the<br/>
                    <code>pti_app/dummy_data</code> directory
                  </p>
                </div>
              </div>
            ) : !imageLoaded ? (
              <div className="placeholder-image" style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb'
              }}>
                <p>Loading image...</p>
              </div>
            ) : (
              // Image wrapper with viewport
              <div 
                ref={viewportRef}
                className="image-viewport"
              >
                <img 
                  ref={imageRef}
                  src={imageUrl}
                  alt="Annotation Image"
                  className="annotation-image"
                  style={{
                    transform: `scale(${scale}) translate(${panPosition.x / scale}px, ${panPosition.y / scale}px)`,
                    transformOrigin: 'center',
                    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                  }}
                />
                
                {/* All pins - positioned using normalized coordinates */}
                {pins.map(pin => {
                  const pinPos = getPinViewportPosition(pin);
                  return (
                    <div 
                      key={pin.id}
                      className={`pin ${
                        selectedPins.includes(pin) ? 'pin-selected' : 'pin-default'
                      } ${selectedPins.length > 0 && !selectedPins.includes(pin) ? 'pin-faded' : ''}`}
                      style={{ 
                        left: `${pinPos.x}px`, 
                        top: `${pinPos.y}px`
                      }}
                      title={`Pin #${pin.id}`}
                    />
                  );
                })}
                
                {/* Selection rectangle */}
                {selectionActive && (
                  <div 
                    className="selection-rectangle"
                    style={getSelectionRectStyle()}
                  />
                )}
              </div>
            )}

            {/* Current mode indicator */}
            <div className="mode-indicator">
              {interactionMode === INTERACTION_MODES.SELECT ? 'Selection Mode' : 'Pan Mode'}
            </div>
          </div>
          
          <div className="help-text">
            {imageLoaded 
              ? `Current mode: ${interactionMode === INTERACTION_MODES.SELECT ? 'Selection (draw to select pins)' : 'Pan (drag to move image)'}` 
              : "Add images to pti_app/dummy_data directory to get started"}
          </div>
        </div>
      </div>
      
      {/* Right panel - Comments */}
      <div className="comments-panel">
        <div className="panel-content">
          <h2 className="panel-title">Survey Comments</h2>
          
          {!imageLoaded ? (
            <div className="empty-state">
              <p>No image loaded</p>
              <p style={{fontSize: '0.875rem', marginTop: '0.5rem'}}>Please wait for the image to load or check if it exists</p>
            </div>
          ) : selectedPins.length > 0 ? (
            <div>
              {selectedPins.map(pin => (
                <div key={pin.id} className="comment-card">
                  <div className="comment-header">
                    <div className="pin-indicator"></div>
                    <span className="pin-label">Pin #{pin.id}</span>
                    <span className="pin-position">
                      Position: ({(pin.x*100).toFixed(0)}%, {(pin.y*100).toFixed(0)}%)
                    </span>
                  </div>
                  <p className="comment-text">{pin.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No pins selected</p>
              <p style={{fontSize: '0.875rem', marginTop: '0.5rem'}}>
                {interactionMode === INTERACTION_MODES.SELECT 
                  ? "Drag to select a region on the image to view comments" 
                  : "Switch to Selection mode to select pins"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnnotationApp;