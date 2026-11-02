/**
 * Official School Letterhead (Kop Surat) for Lazuardi Global Compassionate School
 * Rendered on printed reports, medical slips, and PDF views.
 */

import React from 'react';
import { LAZUARDI_LOGO_URL } from '../../constants/assets';

interface SchoolLetterheadProps {
  documentTitle: string;
  documentSubtitle?: string;
  documentNumber?: string;
}

export const SchoolLetterhead: React.FC<SchoolLetterheadProps> = ({
  documentTitle,
  documentSubtitle,
  documentNumber,
}) => {
  return (
    <div className="border-b-2 border-slate-900 pb-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* School Emblem / Logo */}
          <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
            <img
              src={LAZUARDI_LOGO_URL}
              alt="Logo Lazuardi"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/lazuardi.png';
              }}
            />
          </div>

          <div>
            <h1 className="text-lg md:text-xl font-extrabold uppercase tracking-wide text-blue-950 font-serif">
              Lazuardi Global Compassionate School
            </h1>
            <p className="text-xs font-semibold text-sky-800 tracking-wider uppercase">
              Unit Kesehatan Sekolah (UKS) Terpadu
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Jl. Merpati No. 12, Cinere, Depok, Jawa Barat 16514 | Telp: (021) 753-4820 ext 105 | Email: uks@lazuardi.sch.id
            </p>
          </div>
        </div>

        {documentNumber && (
          <div className="text-right text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 shrink-0">
            <div className="font-semibold text-slate-500 uppercase text-[10px]">Nomor Dokumen</div>
            <div className="font-mono font-bold text-blue-950 text-sm">{documentNumber}</div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 text-center">
        <h2 className="text-base md:text-lg font-bold text-slate-900 uppercase tracking-tight">
          {documentTitle}
        </h2>
        {documentSubtitle && (
          <p className="text-xs text-slate-600 font-medium mt-0.5">{documentSubtitle}</p>
        )}
      </div>
    </div>
  );
};
