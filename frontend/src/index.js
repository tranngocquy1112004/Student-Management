import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Clear localStorage on dev server start (only in development mode)
if (process.env.NODE_ENV === 'development') {
  // Check if this is a fresh start (not a hot reload)
  const isFirstLoad = !sessionStorage.getItem('dev_session_started');
  
  if (isFirstLoad) {
    console.log('🔄 Development mode: Clearing localStorage for fresh start');
    localStorage.clear();
    sessionStorage.setItem('dev_session_started', 'true');
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
