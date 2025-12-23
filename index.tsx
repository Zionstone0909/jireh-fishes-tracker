import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // No curly braces here!
import { AppProvider } from './context/AppContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);