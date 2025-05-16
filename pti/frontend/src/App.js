import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to PTI App!</h1>
        <p>This is a React frontend served by Django backend.</p>
        <button 
          onClick={() => {
            fetch('/api/hello/')
              .then(response => response.json())
              .then(data => alert(data.message))
              .catch(error => console.error('Error:', error));
          }}
        >
          Test Backend Connection
        </button>
      </header>
    </div>
  );
}

export default App;