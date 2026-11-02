/**
 * In-App Notification Center Drawer for LUKS
 */

import React from 'react';
import { Bell, X, Check, Activity, HeartPulse, Clock, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DataService } from '../../services/dataService';
import { AppNotification } from '../../types/database';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRecord?: (type: string, id?: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onNavigateToRecord,
}) => {
  const { currentUser } = useAuth();
  if (!isOpen || !currentUser) return null;

  const notifications = DataService.getNotifications(currentUser.id);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = () => {
    DataService.markAllNotificationsAsRead(currentUser.id);
  };

  const handleItemClick = (notif: AppNotification) => {
    DataService.markNotificationAsRead(notif.id);
    if (notif.target_record_type && onNavigateToRecord) {
      onNavigateToRecord(notif.target_record_type, notif.target_record_id);
      onClose();
    }
  };

  const getIcon = (type: AppNotification['notification_type']) => {
    switch (type) {
      case 'glucose_recorded':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'active_visit':
        return <HeartPulse className="w-4 h-4 text-amber-600" />;
      case 'repeat_visit':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'followup_scheduled':
      case 'followup_overdue':
        return <Clock className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] mt-12 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-bold text-sm">Pusat Notifikasi</h3>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} pemberitahuan belum dibaca` : 'Semua notifikasi telah dibaca'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
            <span className="text-[11px] text-blue-800 font-medium">Tandai sudah dibaca:</span>
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline"
            >
              <Check className="w-3.5 h-3.5" />
              Tandai Semua
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="p-2 overflow-y-auto divide-y divide-slate-100 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Belum ada notifikasi untuk Anda saat ini.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3.5 rounded-xl cursor-pointer transition flex items-start gap-3 ${
                  !notif.is_read ? 'bg-blue-50/40 hover:bg-blue-50 font-medium' : 'hover:bg-slate-50 opacity-80'
                }`}
              >
                <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0 mt-0.5">
                  {getIcon(notif.notification_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.created_at).toLocaleString('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}{' '}
                    WIB
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-500">
            Sistem Informasi UKS Lazuardi • Privasi Data Terlindungi
          </p>
        </div>
      </div>
    </div>
  );
};
