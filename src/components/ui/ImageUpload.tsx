"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  label?: string;
  value?: string;            // Current image URL (for edit mode preview)
  onUpload?: (objectUrl: string, file: File) => void;
  accept?: string;
  hint?: string;
}

export default function ImageUpload({
  label = "Upload image",
  value,
  onUpload,
  accept = "image/*",
  hint,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload?.(url, file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }

  return (
    <div className="img-upload">
      {label && <p className="img-upload__label">{label}</p>}
      <div
        className={`img-upload__zone${dragging ? " img-upload__zone--drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <img src={preview} alt="Upload preview" className="img-upload__preview" />
        ) : (
          <div className="img-upload__placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Click or drop to upload</span>
          </div>
        )}
      </div>
      {hint && <p className="img-upload__hint">{hint}</p>}
      {preview && (
        <button
          type="button"
          className="img-upload__remove"
          onClick={e => { e.stopPropagation(); setPreview(null); onUpload?.("", new File([], "")); }}
        >
          Remove
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={handleChange} />
    </div>
  );
}
