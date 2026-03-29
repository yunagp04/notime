import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Initialize the root element for the React application
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the application within StrictMode for development safety
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);