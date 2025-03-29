import React, { useState, useRef } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // In MB
  multiple?: boolean;
  label?: string;
  dropzoneText?: string;
  buttonText?: string;
  errorText?: string;
  loadingText?: string;
  successText?: string;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  accept = 'image/*,application/pdf',
  maxSize = 5, // Default to 5MB
  multiple = false,
  label = 'Ladda upp fil',
  dropzoneText = 'Dra och släpp filen här, eller klicka för att välja',
  buttonText = 'Välj fil',
  errorText = 'Ett fel uppstod vid uppladdning',
  loadingText = 'Laddar upp...',
  successText = 'Filen har laddats upp',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      // Check file size
      const file = fileList[0];
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`Filen är för stor. Maximal storlek är ${maxSize}MB.`);
      }

      await onFileSelect(file);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setIsLoading(false);
      
      // Reset input value so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const dropzoneClass = `file-uploader-dropzone ${isDragging ? 'dragging' : ''} ${className}`;

  return (
    <div className="file-uploader">
      {label && <label className="file-uploader-label">{label}</label>}
      
      <div
        className={dropzoneClass}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept={accept}
          multiple={multiple}
          className="file-input"
          style={{ display: 'none' }}
        />
        
        {isLoading ? (
          <div className="uploading-indicator">
            <div className="spinner"></div>
            <p>{loadingText}</p>
          </div>
        ) : (
          <>
            <div className="dropzone-content">
              <span className="dropzone-icon">📁</span>
              <p className="dropzone-text">{dropzoneText}</p>
              <button type="button" className="select-file-button">
                {buttonText}
              </button>
            </div>
          </>
        )}
      </div>
      
      {error && <div className="file-uploader-error">{error}</div>}
      {success && <div className="file-uploader-success">{successText}</div>}
    </div>
  );
};

export default FileUploader; 