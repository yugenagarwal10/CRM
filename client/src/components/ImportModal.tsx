import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, Check, FileSpreadsheet, Download, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { useStatuses } from '../context/StatusContext';
import { leadsApi } from '../services/api';
import toast from 'react-hot-toast';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  const { statuses } = useStatuses();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  if (!open) return null;

  const resetState = () => {
    setStep(1);
    setImporting(false);
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const downloadTemplate = () => {
    try {
      const headers = ['Name', 'Phone', 'Email', 'Description', 'Status', 'Source'];
      
      // Template now only contains headers, no sample data
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'lead_import_template.xlsx');
      toast.success("Template downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate template.");
    }
  };

  const processFileAndImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      setImporting(true);
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const allRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        if (allRows.length === 0) {
          toast.error("The selected sheet is empty.");
          setImporting(false);
          return;
        }

        let headerRowIndex = 0;
        const firstRowNonEmpty = allRows[0] ? allRows[0].filter(c => c !== undefined && String(c).trim() !== '').length : 0;
        if (firstRowNonEmpty <= 1 && allRows.length > 1) {
          const secondRowNonEmpty = allRows[1] ? allRows[1].filter(c => c !== undefined && String(c).trim() !== '').length : 0;
          if (secondRowNonEmpty > firstRowNonEmpty) {
            headerRowIndex = 1;
          }
        }

        const rawHeaders = allRows[headerRowIndex].map(h => String(h || '').trim().toLowerCase());
        const dataRows = allRows.slice(headerRowIndex + 1).filter(row => row && row.length > 0);

        const nameIdx = rawHeaders.indexOf('name');
        const phoneIdx = rawHeaders.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'));
        const emailIdx = rawHeaders.indexOf('email');
        const descIdx = rawHeaders.findIndex(h => h.includes('desc') || h.includes('remark') || h.includes('note'));
        const statusIdx = rawHeaders.indexOf('status');
        const sourceIdx = rawHeaders.indexOf('source');

        if (nameIdx === -1) {
          toast.error("Required column 'Name' not found in the uploaded file.");
          setImporting(false);
          return;
        }

        const fallbackStatus = statuses.length > 0 ? statuses[0].name : 'New';

        const leadsToImport = dataRows.map(row => {
          const name = row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
          const phone = phoneIdx !== -1 && row[phoneIdx] !== undefined ? String(row[phoneIdx]).trim() : '';
          const email = emailIdx !== -1 && row[emailIdx] !== undefined ? String(row[emailIdx]).trim() : '';
          const notes = descIdx !== -1 && row[descIdx] !== undefined ? String(row[descIdx]).trim() : '';
          
          let status = statusIdx !== -1 && row[statusIdx] !== undefined ? String(row[statusIdx]).trim() : '';
          if (status) {
            const matched = statuses.find(s => s.name.toLowerCase() === status.toLowerCase());
            if (matched) {
              status = matched.name;
            }
          }
          if (!status) {
            status = fallbackStatus;
          }

          // Fallback to blank string instead of "Excel Import" if source is empty/not provided
          const source = sourceIdx !== -1 && row[sourceIdx] !== undefined ? String(row[sourceIdx]).trim() : '';

          return {
            name,
            phone,
            email,
            notes,
            status,
            source,
          };
        }).filter(lead => lead.name && lead.name !== '');

        if (leadsToImport.length === 0) {
          toast.error("No valid leads with a 'Name' were found in the file.");
          setImporting(false);
          return;
        }

        const response = await leadsApi.batchCreate(leadsToImport);
        setResult({
          success: response.count,
          failed: dataRows.length - response.count
        });
        setStep(2);
        onSuccess();
        toast.success("Import completed successfully!");
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to process and import file.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileAndImport(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileAndImport(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Premium Dark Glassmorphic Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-all duration-300 ease-out" 
        onClick={handleClose} 
      />
      
      {/* Modal Card with soft gradient borders and animations */}
      <div className="relative z-10 w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
        
        {/* Colorful Gradient Header Background */}
        <div className="relative overflow-hidden px-8 py-6 border-b border-slate-50 bg-gradient-to-r from-slate-50 via-slate-50/50 to-white shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-8 -mt-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -ml-6 -mb-6" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Import Leads from Excel</h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Fast, template-based bulk imports</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2 hover:bg-slate-100 active:bg-slate-200/80 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 space-y-6">
          {step === 1 && (
            <>
              {/* Premium Template Download Card with hover actions */}
              <div className="relative overflow-hidden group bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:border-slate-300/80">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-white text-emerald-600 rounded-xl border border-slate-200/50 shadow-sm shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">Download Excel Template</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Download the formatted template with columns: <strong className="text-slate-600">Name</strong>, <strong className="text-slate-600">Phone</strong>, <strong className="text-slate-600">Email</strong>, <strong className="text-slate-600">Description</strong>, <strong className="text-slate-600">Status</strong>, and <strong className="text-slate-600">Source</strong>.
                    </p>
                  </div>
                  <button 
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-95 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>

              {/* Interactive Drag & Drop Box */}
              {importing ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 bg-primary/5/10 rounded-2xl p-12 text-center min-h-[200px]">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
                  <h3 className="text-sm font-bold text-slate-700 mb-1">Importing Leads...</h3>
                  <p className="text-xs text-slate-400 max-w-xs">Reading columns, verifying rows and saving into database pipeline.</p>
                </div>
              ) : (
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-500/5/10 rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ease-in-out min-h-[200px] group shadow-inner"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".xlsx,.xls,.csv" 
                    className="hidden" 
                  />
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl mb-4 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 mb-1 group-hover:text-emerald-600 transition-colors">Upload your Excel or CSV File</h3>
                  <p className="text-[11px] text-slate-400">Drag & drop your populated template sheet here, or click to browse</p>
                </div>
              )}
            </>
          )}

          {/* STEP 2: Completed Screen with Rich Visual Results */}
          {step === 2 && result && (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full mb-5 shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-1">Leads Imported Successfully!</h3>
              <p className="text-xs text-slate-400 mb-8 max-w-sm leading-relaxed">Your data has been successfully processed and added to your CRM lead pipelines.</p>

              {/* Dynamic Counters Card */}
              <div className="grid grid-cols-2 divide-x divide-slate-100 bg-slate-50 border border-slate-100 rounded-2xl p-6 min-w-[320px] mb-8 shadow-sm">
                <div className="px-4">
                  <span className="block text-3xl font-extrabold text-emerald-500 tabular-nums">{result.success}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Leads Imported</span>
                </div>
                <div className="px-4">
                  <span className="block text-3xl font-extrabold text-slate-400 tabular-nums">{result.failed}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rows Skipped</span>
                </div>
              </div>

              <button 
                onClick={handleClose}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-br from-slate-800 to-slate-900 text-white text-xs font-bold rounded-xl hover:from-slate-700 hover:to-slate-800 transition active:scale-95 shadow-md shadow-slate-900/10"
              >
                Close & Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
