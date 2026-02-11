"use client";

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image as ImageIcon, AlertCircle } from "lucide-react";
import { LIMITS, ALLOWED_FILE_TYPES } from "@/lib/types";
import { formatFileSize, isValidFileType, isValidFileSize } from "@/lib/utils";

interface UploadZoneProps {
  onFilesSelected: (_files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export default function UploadZone({
  onFilesSelected,
  disabled = false,
  maxFiles = LIMITS.MAX_FILES_PER_SUBMISSION,
}: UploadZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (newFiles: File[]): { valid: File[]; errors: string[] } => {
      const validFiles: File[] = [];
      const fileErrors: string[] = [];

      for (const file of newFiles) {
        if (!isValidFileType(file.type)) {
          fileErrors.push(
            `"${file.name}" is not a supported file type. Allowed: JPEG, PNG, GIF, WebP, PDF.`
          );
          continue;
        }

        if (!isValidFileSize(file.size)) {
          fileErrors.push(
            `"${file.name}" exceeds the ${LIMITS.MAX_FILE_SIZE_MB}MB limit.`
          );
          continue;
        }

        validFiles.push(file);
      }

      return { valid: validFiles, errors: fileErrors };
    },
    []
  );

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const totalFiles = selectedFiles.length + fileArray.length;

      if (totalFiles > maxFiles) {
        setErrors([`Maximum ${maxFiles} files allowed per submission.`]);
        return;
      }

      const { valid, errors: validationErrors } = validateFiles(fileArray);
      setErrors(validationErrors);

      if (valid.length > 0) {
        const updatedFiles = [...selectedFiles, ...valid];
        setSelectedFiles(updatedFiles);
        onFilesSelected(updatedFiles);
      }
    },
    [selectedFiles, maxFiles, validateFiles, onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
    setErrors([]);
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setErrors([]);
    onFilesSelected([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <ImageIcon className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${disabled ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60" : ""}
          ${isDragging ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_FILE_TYPES.join(",")}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
          className="hidden"
        />

        <Upload
          className={`w-12 h-12 mx-auto mb-4 ${disabled ? "text-gray-400" : "text-gray-500"}`}
        />
        <p className={`text-lg font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
          {disabled
            ? "Upload disabled"
            : "Drop files here or click to upload"}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          JPEG, PNG, GIF, WebP, or PDF • Max {LIMITS.MAX_FILE_SIZE_MB}MB per
          file • Max {maxFiles} files
        </p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          {errors.map((error, i) => (
            <div key={i} className="flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm font-medium text-gray-700">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          </div>
          {selectedFiles.map((file, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {getFileIcon(file.type)}
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
