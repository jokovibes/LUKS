/**
 * Modul Audit Log - LUKS
 * Records and displays sensitive health record activities: access, create, update, and export.
 */

import React, { useState } from 'react';
import { ShieldAlert, Search, Download, Clock, Filter, CheckCircle2 } from 'lucide-react';
import { DataService } from '../../services/dataService';
import { AuditLog } from '../../types/database';

export const AuditLogViewer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const logs = DataService.getAuditLogs();

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
      </div>

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
            <option value="VIEW_RECORD">VIEW_RECORD</option>
            <option value="EXPORT_DATA">EXPORT_DATA</option>
            <option value="APPROVE_PARAMETER">APPROVE_PARAMETER</option>
          </select>
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
              {filteredLogs.map((log) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
