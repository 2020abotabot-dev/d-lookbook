"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownEditorProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function MarkdownEditor({
  name,
  value = "",
  onChange,
  placeholder = "Write product description here… (Markdown supported)",
  rows = 10,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="md-editor">
      <div className="md-editor__toolbar">
        <button
          type="button"
          className={`md-editor__tab${mode === "write" ? " md-editor__tab--active" : ""}`}
          onClick={() => setMode("write")}
        >
          Write
        </button>
        <button
          type="button"
          className={`md-editor__tab${mode === "preview" ? " md-editor__tab--active" : ""}`}
          onClick={() => setMode("preview")}
        >
          Preview
        </button>
        <span className="md-editor__hint">Markdown</span>
      </div>

      {mode === "write" ? (
        <textarea
          name={name}
          className="md-editor__textarea"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange?.(e.target.value)}
        />
      ) : (
        <div className="md-editor__preview">
          {value.trim() ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="md-editor__empty">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
