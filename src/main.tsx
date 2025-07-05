import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './components/Auth/AuthProvider.tsx';
import { AuthProvider } from './components/Auth/AuthProvider.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
