import React, { useState, useRef, ChangeEvent, DragEvent, ReactNode } from 'react';
import { FileText, FileSpreadsheet, FileCode, File, Trash2, Download, Eye, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type?: string;
  uploadedAt?: string;
  url?: string;
  status?: 'uploading' | 'completed' | 'error';
  progress?: number;
}

export interface AttachmentCardProps {
  file: FileAttachment;
  onDelete?: (id: string) => void;
  onPreview?: (file: FileAttachment) => void;
  onDownload?: (file: FileAttachment) => void;
  className?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
    return <FileSpreadsheet className="text-emerald-400 shrink-0" size={20} />;
  }
  if (ext === 'json' || ext === 'xml') {
    return <FileCode className="text-amber-400 shrink-0" size={20} />;
  }
  if (ext === 'txt' || ext === 'log' || ext === 'doc' || ext === 'pdf') {
    return <FileText className="text-sky-400 shrink-0" size={20} />;
  }
  return <File className="text-gothic-silver shrink-0" size={20} />;
}

export function AttachmentCard({
  file,
  onDelete,
  onPreview,
  onDownload,
  className = ''
}: AttachmentCardProps) {
  return (
    <div
      className={`group relative p-3.5 rounded-xl bg-gothic-ink/90 border border-gothic-silver/20 hover:border-gothic-silver/40 transition-all flex items-center justify-between gap-3 shadow-md ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 rounded-lg bg-gothic-void/60 border border-gothic-silver/10">
          {getFileIcon(file.name)}
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <h6 className="text-xs font-mono font-bold text-gothic-silver truncate">{file.name}</h6>
            {file.status === 'completed' && (
              <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
            )}
            {file.status === 'error' && (
              <AlertCircle size={12} className="text-red-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gothic-rose/60">
            <span>{formatFileSize(file.size)}</span>
            {file.uploadedAt && <span>• {file.uploadedAt}</span>}
          </div>

          {file.status === 'uploading' && (
            <div className="w-full bg-gothic-void rounded-full h-1.5 mt-1 overflow-hidden border border-gothic-silver/10">
              <div
                className="bg-gradient-to-r from-[#89A6B8] to-[#D4B26A] h-full transition-all duration-300"
                style={{ width: `${file.progress || 30}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onPreview && (
          <button
            type="button"
            onClick={() => onPreview(file)}
            title="Preview File"
            className="p-1.5 rounded-lg text-gothic-rose/60 hover:text-gothic-silver hover:bg-white/5 transition-colors"
          >
            <Eye size={15} />
          </button>
        )}
        {onDownload && (
          <button
            type="button"
            onClick={() => onDownload(file)}
            title="Download File"
            className="p-1.5 rounded-lg text-gothic-rose/60 hover:text-gothic-silver hover:bg-white/5 transition-colors"
          >
            <Download size={15} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(file.id)}
            title="Delete Attachment"
            className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-950/20 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export interface AttachmentDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  sublabel?: string;
  className?: string;
  children?: ReactNode;
}

export function AttachmentDropzone({
  onFilesSelected,
  accept = '.csv,.xlsx,.xls,.json,.txt',
  multiple = true,
  label = 'Click to browse or drop telemetry attachments',
  sublabel = 'Supports Farlight CSV, DragonStats XLSX, and alliance logs',
  className = '',
  children
}: AttachmentDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`group relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        isDragging
          ? 'border-gothic-silver bg-gothic-silver/10 shadow-lg scale-[1.01]'
          : 'border-gothic-silver/20 bg-gothic-ink/40 hover:border-gothic-silver/50 hover:bg-gothic-ink/70'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />
      {children || (
        <div className="space-y-2 pointer-events-none">
          <div className="mx-auto w-10 h-10 rounded-xl bg-gothic-silver/10 border border-gothic-silver/20 flex items-center justify-center text-gothic-silver group-hover:scale-110 transition-transform">
            <Upload size={20} />
          </div>
          <div>
            <p className="text-xs font-mono font-bold text-gothic-silver">{label}</p>
            <p className="text-[10px] font-mono text-gothic-rose/50 mt-0.5">{sublabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}
