"use client";

import { useRef, useState } from "react";

type Props = {
  onUpload: (url: string) => void;
  prefix?: string;
  label?: string;
  accept?: string;
  disabled?: boolean;
};

export default function ImageUpload({
  onUpload,
  prefix = "minisite",
  label = "Upload image",
  accept = "image/jpeg,image/png,image/gif,image/webp",
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/upload?prefix=${encodeURIComponent(prefix)}`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      if (data.url) {
        onUpload(data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        disabled={disabled || loading}
        style={{ display: "none" }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
        style={{
          padding: "0.4rem 0.75rem",
          fontSize: "0.85rem",
          background: loading ? "#94a3b8" : "#0d9488",
          color: "#fff",
          border: 0,
          borderRadius: 6,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          alignSelf: "flex-start",
        }}
      >
        {loading ? "Uploading…" : label}
      </button>
      {error && (
        <span style={{ fontSize: "0.8rem", color: "#dc2626" }}>{error}</span>
      )}
    </div>
  );
}
