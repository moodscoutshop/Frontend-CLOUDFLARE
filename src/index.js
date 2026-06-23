import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ─── Debug mode gate ──────────────────────────────────────────────
// When REACT_APP_DEBUG_MODE is not 'true', suppress verbose console output so
// production end-users never see internal debug logs in the browser console.
// warnings and errors are preserved.
if (String(process.env.REACT_APP_DEBUG_MODE).toLowerCase() !== 'true') {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
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
