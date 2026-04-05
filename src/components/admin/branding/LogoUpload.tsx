"use client";

import { useRef, useState } from "react";

interface LogoUploadProps {
  label: string;
  value: string;        // current URL or object URL
  onChange: (url: string) => void;
}

export default function LogoUpload({ label, value, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onChange(url);
  }

  return (
    <div className="logo-upload">
      <p className="settings-label">{label}</p>
      <div
        className={`logo-upload__drop${dragging ? " logo-upload__drop--over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="logo-upload__preview" />
        ) : (
          <span className="logo-upload__hint">Click or drag to upload</span>
        )}
      </div>
      {value && (
        <button
          type="button"
          className="logo-upload__remove"
          onClick={() => onChange("")}
        >
          Remove
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="logo-upload__input"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
