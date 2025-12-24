import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Removed curly braces because it's a default export
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);