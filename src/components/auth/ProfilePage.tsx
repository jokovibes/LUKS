/**
 * Halaman Profil Pengguna - LUKS
 * View and update permitted contact information & emergency contacts.
 */

import React, { useState } from 'react';
import { User, Phone, Mail, Building2, Save, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateCurrentUserProfile } = useAuth();

  const [contact, setContact] = useState(currentUser?.contact_information || '');
  const [emergencyContact, setEmergencyContact] = useState(currentUser?.emergency_contact || '');
  const [emergencyPhone, setEmergencyPhone] = useState(currentUser?.emergency_phone || '');
  const [success, setSuccess] = useState(false);

  if (!currentUser) return null;

  const units = DataService.getUnits();
  const unit = units.find((u) => u.id === currentUser.unit_id);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUserProfile({
      contact_information: contact.trim(),
      emergency_contact: emergencyContact.trim(),
      emergency_phone: emergencyPhone.trim(),
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white font-black text-xl flex items-center justify-center shadow-xs">
            {currentUser.full_name.charAt(0)}
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-900">{currentUser.full_name}</h1>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              {currentUser.employee_or_student_id} • {currentUser.email}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-900 border border-blue-200">
                {currentUser.role.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-500">
                {unit?.unit_name || 'Lazuardi Global School'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Informasi kontak berhasil diperbarui.
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
          Pengaturan Kontak Pribadi & Darurat
        </h3>

        <div className="space-y-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Nomor Telepon Pribadi / WhatsApp:</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="0812-xxxx-xxxx"
              className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Kontak Darurat:</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Contoh: Rahmat Subagyo (Orang Tua / Pasangan)"
                className="w-full border border-slate-300 rounded-xl p-2.5"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor Telepon Darurat:</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            Simpan Perubahan Kontak
          </button>
        </div>
      </form>
    </div>
  );
};
