import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { purgeLocalStorageData } from './services/storage';

// Hapus seluruh jejak data lama di localStorage agar aplikasi hanya menggunakan Supabase
purgeLocalStorageData();

createRoot(document.getElementById('root')!).render(<App />);
