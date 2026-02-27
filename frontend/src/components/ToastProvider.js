import { Toaster } from 'react-hot-toast';

export const ToastProvider = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: { background: '#333', color: '#fff' },
      success: { iconTheme: { primary: '#4caf50' } },
      error: { iconTheme: { primary: '#f44336' } },
    }}
  />
);
