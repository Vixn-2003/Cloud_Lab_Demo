'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileCode, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DEFAULT_EXTENSIONS = ['.py', '.sh', '.js', '.ts', '.java', '.cpp', '.c', '.txt'];
const LABTAINER_EXTENSIONS = ['.zip', '.tar.gz', '.tgz'];
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const LABTAINER_MAX_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getLanguageFromExtension(filename: string): string {
  const nameLower = filename.toLowerCase();
  if (nameLower.endsWith('.tar.gz')) return 'Labtainer Tarball';
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    '.py': 'Python',
    '.sh': 'Bash Shell',
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.java': 'Java',
    '.cpp': 'C++',
    '.c': 'C',
    '.txt': 'Text',
    '.zip': 'Labtainer ZIP Archive',
    '.tgz': 'Labtainer Tarball',
  };
  return map[ext] || 'Unknown';
}

interface FileUploadZoneProps {
  onSubmit: (file: File) => Promise<void>;
  isSubmitting: boolean;
  profileLanguage?: string;
  isLabtainer?: boolean; // New: Adapt interface for Labtainer offline zip submissions
  className?: string;
}

export function FileUploadZone({
  onSubmit,
  isSubmitting,
  profileLanguage,
  isLabtainer = false,
  className,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = isLabtainer ? LABTAINER_EXTENSIONS : DEFAULT_EXTENSIONS;
  const maxFileSize = isLabtainer ? LABTAINER_MAX_SIZE : DEFAULT_MAX_SIZE;

  const validateFile = useCallback((file: File): string | null => {
    const filenameLower = file.name.toLowerCase();
    let ext = '.' + filenameLower.split('.').pop();
    if (filenameLower.endsWith('.tar.gz')) {
      ext = '.tar.gz';
    }

    if (!allowedExtensions.includes(ext)) {
      return `Định dạng không hỗ trợ: "${ext}". Chỉ chấp nhận: ${allowedExtensions.join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File quá lớn (${formatFileSize(file.size)}). Giới hạn tối đa cho phép: ${formatFileSize(maxFileSize)}`;
    }
    return null;
  }, [allowedExtensions, maxFileSize]);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, [validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [handleFile]);

  const handleSubmit = useCallback(async () => {
    if (!selectedFile || isSubmitting) return;
    await onSubmit(selectedFile);
  }, [selectedFile, isSubmitting, onSubmit]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={allowedExtensions.join(',')}
        className="hidden"
        onChange={handleInputChange}
        disabled={isSubmitting}
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        {/* Drop zone */}
        <div
          onClick={() => !isSubmitting && inputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative flex w-full max-w-lg cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all duration-200',
            dragActive
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : selectedFile
              ? 'border-success/50 bg-success/5 hover:bg-success/10'
              : error
              ? 'border-destructive/50 bg-destructive/5'
              : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5',
            isSubmitting && 'pointer-events-none opacity-60'
          )}
        >
          {/* Animated gradient ring when drag active */}
          {dragActive && (
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-4 ring-primary/30 animate-pulse" />
          )}

          {selectedFile ? (
            <>
              {/* File selected state */}
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 ring-4 ring-success/20 mb-4">
                <FileCode className="h-7 w-7 text-success" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground break-all">{selectedFile.name}</p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {getLanguageFromExtension(selectedFile.name)}
                  </Badge>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Click để chọn file khác
              </p>
            </>
          ) : (
            <>
              {/* Empty state */}
              <div className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full mb-4 transition-colors',
                dragActive ? 'bg-primary/20' : 'bg-muted'
              )}>
                <Upload className={cn('h-7 w-7 transition-colors', dragActive ? 'text-primary' : 'text-muted-foreground')} />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  {dragActive ? 'Thả file vào đây' : 'Kéo thả hoặc click để chọn file'}
                </p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {isLabtainer 
                    ? 'Tải lên file ZIP xuất từ môi trường Labtainer offline (stoplab) để chấm điểm tự động'
                    : profileLanguage 
                    ? `Bài lab này yêu cầu ngôn ngữ: ${profileLanguage}` 
                    : 'Upload file bài giải của bạn'}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                {allowedExtensions.map(ext => (
                  <Badge key={ext} variant="outline" className="text-[10px] font-mono px-1.5 py-0.5 text-muted-foreground">
                    {ext}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Giới hạn: {formatFileSize(maxFileSize)}</p>
            </>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex w-full max-w-lg items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {selectedFile && !isSubmitting && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFile}
              className="gap-1.5"
            >
              <X className="h-4 w-4" />
              Xóa file
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className="gap-1.5 min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang chấm điểm...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Nộp file để chấm điểm
              </>
            )}
          </Button>
        </div>

        {/* Instruction note */}
        <p className="max-w-md text-center text-xs text-muted-foreground leading-relaxed">
          {isLabtainer
            ? '💡 Hệ thống sẽ tự động giải nén, đọc manifest.json xác thực định danh và trích xuất kết quả kết quả thực hành từ results.json/logs.'
            : '💡 Hệ thống sẽ đọc nội dung file của bạn, chạy trên môi trường Docker cô lập, và so khớp đầu ra với các testcase tự động.'}
        </p>
      </div>
    </div>
  );
}
