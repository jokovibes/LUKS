import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  Clock,
  Filter,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { AuditLog } from '../../types/database';

export const AuditLogViewer: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [recordClearAction, setRecordClearAction] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const logs = React.useMemo(() => DataService.getAuditLogs(), [reloadKey]);

  const filteredLogs = logs.filter((l) => {
    if (actionFilter && l.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return (
        l.actor_name.toLowerCase().includes(q) ||
        l.entity_type.toLowerCase().includes(q) ||
        (l.entity_id && l.entity_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleConfirmClear = async () => {
    if (!currentUser) return;
    setIsClearing(true);
    try {
      await DataService.clearAuditLogs(
        {
          id: currentUser.id,
          name: currentUser.full_name,
          role: currentUser.role,
        },
        recordClearAction
      );
      setReloadKey((k) => k + 1);
      setIsClearModalOpen(false);
      setFeedbackMessage({
        type: 'success',
        text: 'Seluruh riwayat audit log berhasil dibersihkan dari sistem.',
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: `Gagal membersihkan audit log: ${err?.message || 'Terjadi kesalahan sistem'}`,
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
            <ShieldAlert className="w-5 h-5 text-purple-700" />
            <span>Audit Log & Jejak Keamanan Sistem</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan aktivitas akses, penambahan, pengubahan, ekspor, dan penghapusan data kesehatan sesuai kebijakan audit privasi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Clear Audit Log */}
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition shadow-xs"
            title={logs.length === 0 ? 'Audit log masih kosong' : 'Bersihkan seluruh riwayat audit log'}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Clear Audit Log</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
              : 'bg-rose-50 border-rose-200 text-rose-900 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama pengguna, modul, atau ID rekaman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="w-56">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
          >
            <option value="">Semua Jenis Aksi</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE_RECORD">CREATE_RECORD</option>
            <option value="UPDATE_RECORD">UPDATE_RECORD</option>
            <option value="DELETE_RECORD">DELETE_RECORD</option>
            <option value="VIEW_RECORD">VIEW_RECORD</option>
            <option value="EXPORT_DATA">EXPORT_DATA</option>
            <option value="APPROVE_PARAMETER">APPROVE_PARAMETER</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold px-2">
          Total: <span className="font-bold text-slate-800">{filteredLogs.length}</span> entri
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Waktu (WIB)</th>
                <th className="py-3.5 px-4">Pengguna (Aktor)</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Jenis Aksi</th>
                <th className="py-3.5 px-4">Modul Target</th>
                <th className="py-3.5 px-4">Metadata Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShieldAlert className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-slate-600 text-xs">Tidak ada catatan audit log</p>
                      <p className="text-[11px] text-slate-400">
                        {logs.length === 0
                          ? 'Riwayat audit log bersih dan belum ada catatan aktivitas.'
                          : 'Tidak ada data yang cocok dengan filter pencarian.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {new Date(log.timestamp).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{log.actor_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold bg-slate-100 text-slate-700">
                        {log.actor_role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-900">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{log.entity_type}</td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {log.relevant_metadata ? JSON.stringify(log.relevant_metadata) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Konfirmasi Clear Audit Log */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Bersihkan Seluruh Audit Log?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tindakan ini akan menghapus permanen semua catatan riwayat aktivitas audit log sistem ({logs.length} entri). Jejak audit yang telah dihapus tidak dapat dipulihkan kembali.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={recordClearAction}
                  onChange={(e) => setRecordClearAction(e.target.checked)}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-600 w-4 h-4"
                />
                <span className="text-[11px] font-medium leading-tight">
                  Tinggalkan 1 catatan audit baru bahwa audit log telah dibersihkan oleh{' '}
                  <strong className="text-slate-900">{currentUser?.full_name}</strong>
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                disabled={isClearing}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Membersihkan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Bersihkan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
