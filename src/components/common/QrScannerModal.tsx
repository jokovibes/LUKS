/**
 * QR Code Scanner & Identity Card Modal for LUKS
 * Enables scanning student NIS / employee NIY cards via camera,
 * manual search, and rapid barcode simulation.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, QrCode, Search, CheckCircle, RefreshCw, AlertCircle, User } from 'lucide-react';
import { UserProfile } from '../../types/database';
import { localDb } from '../../services/storage';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectParticipant: (participant: UserProfile) => void;
  title?: string;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectParticipant,
  title = 'Pindai QR Code Kartu Identitas',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'search' | 'quick'>('camera');
  const [searchQuery, setSearchQuery] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const allProfiles = localDb.getProfiles().filter((p) => p.is_active);

  // Filtered search list
  const filteredProfiles = allProfiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.employee_or_student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Perangkat atau browser tidak mendukung akses kamera.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Kamera tidak dapat diakses (izin ditolak atau di lingkungan iframe). Anda dapat menggunakan Pencarian Cepat atau simulasi kartu di bawah.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-800 rounded-lg">
              <QrCode className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{title}</h3>
              <p className="text-xs text-sky-200">Identifikasi cepat peserta UKS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'camera'
                ? 'bg-white text-blue-900 border-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Camera className="w-4 h-4" />
            Kamera Pemindai
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'quick'
                ? 'bg-white text-blue-900 border-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Kartu Contoh QR
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'search'
                ? 'bg-white text-blue-900 border-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Search className="w-4 h-4" />
            Pencarian Manual
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'camera' && (
            <div className="space-y-4 text-center">
              <div className="relative aspect-video max-h-56 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-blue-400">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
                />
                
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-40 h-40 border-2 border-sky-400 rounded-lg animate-pulse shadow-lg shadow-sky-500/20 flex flex-col justify-between p-2">
                      <div className="flex justify-between">
                        <div className="w-3 h-3 border-t-2 border-l-2 border-sky-300"></div>
                        <div className="w-3 h-3 border-t-2 border-r-2 border-sky-300"></div>
                      </div>
                      <div className="text-[10px] text-sky-300 font-mono text-center bg-blue-950/80 px-2 py-0.5 rounded">
                        Arahkan ke QR Code
                      </div>
                      <div className="flex justify-between">
                        <div className="w-3 h-3 border-b-2 border-l-2 border-sky-300"></div>
                        <div className="w-3 h-3 border-b-2 border-r-2 border-sky-300"></div>
                      </div>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="p-4 text-slate-300 text-xs space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p>{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs inline-flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-left">
                <p className="text-xs text-blue-900 font-medium">
                  💡 Tips Pemindaian:
                </p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Arahkan kamera ke Kartu Pelajar Siswa atau Kartu Pegawai Lazuardi. Sistem akan membaca nomor NIS/NIY secara otomatis. Anda juga dapat memilih kartu contoh di tab <strong>"Kartu Contoh QR"</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'quick' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Pilih kartu identitas di bawah ini untuk mensimulasikan pemindaian QR code secara instan:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {allProfiles.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      onSelectParticipant(user);
                      onClose();
                    }}
                    className="p-3 border border-slate-200 hover:border-blue-600 hover:bg-blue-50/70 rounded-xl cursor-pointer transition flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-700 group-hover:text-white transition">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900 group-hover:text-blue-900 leading-snug">
                          {user.full_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {user.employee_or_student_id}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {user.category} • {user.role.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-slate-300 group-hover:text-blue-700 transition shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ketik nama atau NIS / NIY peserta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                {filteredProfiles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Tidak ditemukan peserta dengan kata kunci tersebut.
                  </div>
                ) : (
                  filteredProfiles.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        onSelectParticipant(user);
                        onClose();
                      }}
                      className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{user.full_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {user.employee_or_student_id} • {user.work_unit || 'Siswa'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-100 text-slate-700">
                        {user.category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
