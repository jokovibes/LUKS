import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Bersihkan data mock pemeriksaan gula darah lama dan tindak lanjut lama agar hanya data nyata Supabase yang tampil
const STORAGE_PURGED_FLAG = 'luks_storage_purged_flag_v4';
try {
  if (!localStorage.getItem(STORAGE_PURGED_FLAG)) {
    localStorage.removeItem('luks_glucose_exams_v1');
    localStorage.removeItem('luks_glucose_followups_v1');
    localStorage.removeItem('luks_uks_followups_v1');
    localStorage.removeItem('luks_current_user_id_v1');
    localStorage.setItem(STORAGE_PURGED_FLAG, 'true');
  }
} catch (e) {
  console.warn('Storage purge error:', e);
}

createRoot(document.getElementById('root')!).render(<App />);
