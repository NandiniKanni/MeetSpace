import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import './styles/variables.css';
import './styles/base.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/meeting.css';

// This is where React attaches to the <div id="root"> in index.html.
// Providers wrap <App /> so every component can use toasts and the logged-in user.
//
// Note: we do not use <React.StrictMode> here. In development it runs effects twice,
// which would connect to your Socket.IO server twice and confuse a beginner reading the logs.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);
