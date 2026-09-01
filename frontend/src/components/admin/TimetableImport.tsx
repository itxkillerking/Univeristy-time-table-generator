import { useState, useRef } from 'react';
import { validateTimetableData } from '../../lib/timetable/timetableValidator';
import type { RawTimetableData } from '../../lib/timetable/timetableValidator';
import { generateTimetableDiff } from '../../lib/admin/timetableDiff';
import type { DiffResult } from '../../lib/admin/timetableDiff';
import { Upload, AlertCircle, ArrowLeft, Loader2, FileText } from 'lucide-react';
import ImportPreview from './ImportPreview';
import { fetchWithAuth } from '../../lib/api/apiClient';

interface Props {
  onCancel: () => void;
  onPublished: () => void;
  currentData: RawTimetableData;
  baseVersionId?: string;
}

export default function TimetableImport({ onCancel, onPublished, currentData, baseVersionId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [importState, setImportState] = useState<'IDLE' | 'UPLOADING' | 'PARSING' | 'VALIDATING' | 'READY_FOR_REVIEW' | 'ERROR'>('IDLE');
  const [importedData, setImportedData] = useState<RawTimetableData | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setImportState('VALIDATING');
    const file = e.target.files?.[0];
    if (!file) {
      setImportState('IDLE');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // 1. Validate
        if (!validateTimetableData(json)) {
          throw new Error("Invalid timetable JSON format.");
        }
        
        // 2. Diff against passed-in currentData
        const diff = generateTimetableDiff(currentData.classes, json.classes);
        
        setImportedData(json);
        setDiffResult(diff);
        setImportState('READY_FOR_REVIEW');
      } catch (err: any) {
        setError(err.message || "Failed to parse JSON file.");
        setImportState('ERROR');
      }
    };
    reader.readAsText(file);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Please select a valid PDF file.");
      setImportState('ERROR');
      return;
    }
    
    setImportState('UPLOADING');
    const formData = new FormData();
    formData.append('file', file);

    try {
      setImportState('PARSING');
      const res = await fetchWithAuth('/api/admin/timetable/import-pdf/', {
        method: 'POST',
        headers: {}, // Do not set Content-Type, let browser set it with boundary
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse PDF.');
      }

      setImportState('VALIDATING');
      
      // 1. Validate
      if (!validateTimetableData(data)) {
        throw new Error("Parsed PDF data is structurally invalid.");
      }

      // 2. Diff against current
      const diff = generateTimetableDiff(currentData.classes, data.classes);
      
      setImportedData(data);
      setDiffResult(diff);
      setImportState('READY_FOR_REVIEW');

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during PDF parsing.");
      setImportState('ERROR');
    }
  };

  const handlePublish = async () => {
    if (!importedData) return;
    
    setIsPublishing(true);
    setError(null);
    try {
      const response = await fetchWithAuth('/api/admin/timetable/publish/', {
        method: 'POST',
        body: JSON.stringify({
          ...importedData,
          base_version_id: baseVersionId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish timetable.');
      }

      onPublished();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during publish.");
    } finally {
      setIsPublishing(false);
    }
  };

  // If we have a diff result, show the preview
  if (importState === 'READY_FOR_REVIEW' && diffResult && importedData) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start text-left gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Publish Failed</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}
        <ImportPreview 
          diff={diffResult} 
          onCancel={onCancel}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900">Import Timetable</h2>
        </div>
      </div>

      <div className="p-10 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          {(importState === 'UPLOADING' || importState === 'PARSING' || importState === 'VALIDATING') ? (
             <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
             <Upload className="w-8 h-8" />
          )}
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 mb-2">
           {importState === 'UPLOADING' ? 'Uploading PDF...' :
            importState === 'PARSING' ? 'Parsing PDF contents...' :
            importState === 'VALIDATING' ? 'Validating timetable data...' :
            'Upload Timetable Data'}
        </h3>
        
        <p className="text-slate-600 mb-8">
          Upload a raw Timetable PDF or a structured JSON file. The system will safely compare it against the current dataset before publishing.
        </p>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg flex items-start text-left gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Import Failed</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <input 
          type="file" 
          accept=".json"
          ref={jsonInputRef}
          className="hidden"
          onChange={handleJsonUpload}
        />
        <input 
          type="file" 
          accept=".pdf"
          ref={pdfInputRef}
          className="hidden"
          onChange={handlePdfUpload}
        />
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => pdfInputRef.current?.click()}
            disabled={importState !== 'IDLE' && importState !== 'ERROR'}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <FileText className="w-5 h-5" />
            Import PDF
          </button>
          
          <button 
            onClick={() => jsonInputRef.current?.click()}
            disabled={importState !== 'IDLE' && importState !== 'ERROR'}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            Import JSON
          </button>
        </div>
      </div>
    </div>
  );
}
