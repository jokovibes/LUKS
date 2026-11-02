/**
 * Komponen Modal Import CSV Terpadu - LUKS
 * Memungkinkan pratinjau data, validasi kolom, unduh template contoh,
 * dan penyimpanan massal ke database.
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { CsvService } from '../../services/csvService';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  expectedHeaders: string[];
  sampleDownloadFn: () => void;
  sampleDownloadLabel?: string;
  onImport: (rows: string[][]) => { successCount: number; errors: string[] };
  onSuccess?: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  expectedHeaders,
  sampleDownloadFn,
  sampleDownloadLabel = 'Unduh Contoh Format CSV',
  onImport,
  onSuccess,
}) => {
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorList, setErrorList] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrorList([]);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const allLines = CsvService.parseCsv(text);
        if (allLines.length < 2) {
          setErrorList(['Berkas CSV kosong atau tidak memiliki baris data setelah header.']);
          setHeaders([]);
          setParsedRows([]);
          return;
        }

        const rawHeaders = allLines[0];
        const dataRows = allLines.slice(1);

        setHeaders(rawHeaders);
        setParsedRows(dataRows);
      } catch (err: any) {
        setErrorList([`Gagal membaca berkas CSV: ${err?.message || 'Format tidak valid'}`]);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setErrorList([]);

    setTimeout(() => {
      try {
        const result = onImport(parsedRows);
        if (result.errors.length > 0) {
          setErrorList(result.errors);
        }
        if (result.successCount > 0) {
          setSuccessMessage(`Berhasil mengimpor ${result.successCount} data ke dalam sistem.`);
          if (onSuccess) onSuccess();
        }
      } catch (err: any) {
        setErrorList([`Terjadi kesalahan saat memproses data: ${err?.message}`]);
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  };

  const resetState = () => {
    setParsedRows([]);
    setHeaders([]);
    setFileName('');
    setErrorList([]);
    setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold shrink-0">
              <Upload className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
          {/* Action to download sample template */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-blue-700 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-blue-950">Gunakan Format Kolom Standar</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Unduh contoh template agar urutan nama kolom dan tipe data sesuai sistem.
                </p>
              </div>
            </div>
            <button
              onClick={sampleDownloadFn}
              type="button"
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              {sampleDownloadLabel}
            </button>
          </div>

          {/* Expected Columns Pill List */}
          <div className="text-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Kolom yang Dikenali Sistem:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {expectedHeaders.map((h, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* File Upload Drop Area */}
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center transition bg-slate-50/50">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer block space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white text-blue-700 mx-auto flex items-center justify-center shadow-xs border border-slate-200">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs text-slate-700 font-bold">
                {fileName ? (
                  <span className="text-blue-900 font-mono">{fileName}</span>
                ) : (
                  <span>Klik untuk memilih berkas CSV dari komputer Anda</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Mendukung format .csv (Koma atau Titik Koma)</p>
            </label>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorList.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Peringatan / Catatan Validasi:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                {errorList.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-700" />
                  Pratinjau Data ({parsedRows.length} Baris Siap Diimpor)
                </span>
                <span className="text-[11px] text-slate-500">Menampilkan hingga 5 baris pertama</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-x-auto text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      {headers.map((h, i) => (
                        <th key={i} className="py-2 px-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-400">{rIdx + 1}</td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-slate-800">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            {successMessage ? 'Tutup' : 'Batal'}
          </button>

          {parsedRows.length > 0 && !successMessage && (
            <button
              type="button"
              onClick={handleProcessImport}
              disabled={isProcessing}
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isProcessing ? 'Mengimpor...' : `Konfirmasi & Import ${parsedRows.length} Data`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
