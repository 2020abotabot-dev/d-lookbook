"use client";

import { useRef, useState } from "react";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const urls = Array.from(files)
      .filter(f => f.type.startsWith("image/"))
      .map(f => URL.createObjectURL(f));
    onChange([...value, ...urls]);
  }

  function remove(idx: number) {
    const next = value.filter((_, i) => i !== idx);
    URL.revokeObjectURL(value[idx]);
    onChange(next);
  }

  function move(from: number, to: number) {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="image-uploader">
      <div
        className={`image-uploader__drop${dragging ? " image-uploader__drop--over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <span className="image-uploader__hint">Click or drag images here</span>
      </div>

      {value.length > 0 && (
        <div className="image-uploader__grid">
          {value.map((url, i) => (
            <div key={url} className="image-uploader__thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`product image ${i + 1}`} className="image-uploader__img" />
              <div className="image-uploader__actions">
                {i > 0 && (
                  <button type="button" className="image-uploader__btn" onClick={() => move(i, i - 1)}>&#8592;</button>
                )}
                {i < value.length - 1 && (
                  <button type="button" className="image-uploader__btn" onClick={() => move(i, i + 1)}>&#8594;</button>
                )}
                <button type="button" className="image-uploader__btn image-uploader__btn--remove" onClick={() => remove(i)}>&#10005;</button>
              </div>
              {i === 0 && <span className="image-uploader__main-badge">Main</span>}
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="image-uploader__input"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}
