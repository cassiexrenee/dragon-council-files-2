import React from 'react';
import { FileText, FileSpreadsheet, FileCode, Download, ExternalLink } from 'lucide-react';

interface AttachmentProps {
  filename: string;
  fileSize?: string | number;
  fileType?: 'json' | 'csv' | 'excel' | 'pdf' | string;
  url?: string;
  onDownload?: () => void;
}

export function AttachmentCard({
  filename,
  fileSize,
  fileType = 'excel',
  url,
  onDownload
}: AttachmentProps) {
  const getIcon = () => {
    switch (fileType.toLowerCase()) {
      case 'json':
        return <FileCode size={18} className="text-[#D4B26A]" />;
      case 'csv':
        return <FileText size={18} className="text-[#7FA8C9]" />;
      default:
        return <FileSpreadsheet size={18} className="text-[#7FB685]" />;
    }
  };

  return (
    <div className="p-3 bg-gothic-ink border border-gothic-silver/20 rounded-xl flex items-center justify-between gap-3 text-xs font-mono shadow-md hover:border-gothic-silver/40 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg bg-gothic-void border border-gothic-silver/20 shrink-0">
          {getIcon()}
        </div>
        <div className="min-w-0">
          <h5 className="font-bold text-gothic-silver truncate">{filename}</h5>
          <div className="flex items-center gap-2 text-[10px] text-gothic-rose/60">
            <span className="uppercase text-[#89A6B8]">{fileType}</span>
            {fileSize && <span>• {fileSize}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 rounded-lg bg-gothic-void border border-gothic-silver/20 text-gothic-silver hover:bg-gothic-silver/10 transition-colors cursor-pointer"
            title="Download file"
          >
            <Download size={14} />
          </button>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gothic-void border border-gothic-silver/20 text-gothic-silver hover:bg-gothic-silver/10 transition-colors"
            title="Open link"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}