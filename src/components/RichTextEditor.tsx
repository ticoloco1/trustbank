"use client";

import { useMemo, useState, useEffect, useRef, useLayoutEffect } from "react";
import { BACKGROUND_OPTIONS } from "@/lib/article-page";

export { BACKGROUND_OPTIONS } from "@/lib/article-page";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

const FONT_OPTIONS = [
  { value: "", label: "Fonte" },
  { value: "sans-serif", label: "Sem serifa" },
  { value: "serif", label: "Serifada" },
  { value: "monospace", label: "Monoespaçada" },
  { value: "Arial", label: "Arial" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Verdana", label: "Verdana" },
  { value: "Courier New", label: "Courier New" },
];

const SIZE_OPTIONS = [
  { value: "", label: "Tamanho" },
  { value: "10px", label: "10px" },
  { value: "12px", label: "12px" },
  { value: "14px", label: "14px" },
  { value: "16px", label: "16px" },
  { value: "18px", label: "18px" },
  { value: "20px", label: "20px" },
  { value: "24px", label: "24px" },
  { value: "32px", label: "32px" },
];

let quillRegistered = false;

function registerQuillFormats(Quill: { import: (path: string) => unknown; register: (a: unknown, b?: boolean) => void }) {
  if (typeof window === "undefined" || !Quill || quillRegistered) return;
  try {
    const Size = Quill.import("attributors/style/size") as { whitelist?: string[] } | null;
    if (Size) {
      (Size as { whitelist: string[] }).whitelist = SIZE_OPTIONS.filter((o) => o.value).map((o) => o.value);
      Quill.register(Size, true);
    }
    const Font = Quill.import("attributors/style/font") as { whitelist?: string[] } | null;
    if (Font) {
      (Font as { whitelist: string[] }).whitelist = FONT_OPTIONS.filter((o) => o.value).map((o) => o.value);
      Quill.register(Font, true);
    }
    quillRegistered = true;
  } catch {
    quillRegistered = true;
  }
}

function RichTextEditorInner({
  value,
  onChange,
  placeholder = "Escreva o artigo... (negrito, itálico, cores, emojis — cole ou digite)",
  minHeight = 320,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<{ format: (name: string, value: string) => void } | null>(null);

  const ReactQuill = useMemo(() => (typeof window !== "undefined" ? require("react-quill") : null), []);
  const Quill = useMemo(() => (ReactQuill?.Quill ?? null), [ReactQuill]);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || !Quill) return;
    registerQuillFormats(Quill);
    setMounted(true);
  }, [Quill]);

  // Marca editor como pronto após montar (permite buscar a instância Quill)
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => setEditorReady(true), 150);
    return () => clearTimeout(t);
  }, [mounted]);

  // Captura a instância do Quill (mesmo módulo que react-quill usa) depois que o editor monta
  useEffect(() => {
    if (!mounted || !editorReady || !wrapperRef.current || !Quill || typeof Quill.find !== "function") return;
    const timer = setTimeout(() => {
      try {
        const el = wrapperRef.current?.querySelector(".ql-editor");
        if (el) {
          const q = Quill.find(el);
          if (q) quillInstanceRef.current = q;
        }
      } catch {}
    }, 50);
    return () => clearTimeout(timer);
  }, [mounted, editorReady, value, Quill]);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image"],
        ["blockquote", "code-block"],
        ["clean"],
      ],
      clipboard: { matchVisual: false },
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "align",
    "link",
    "image",
    "blockquote",
    "code-block",
    "font",
    "size",
  ];

  useEffect(() => {
    if (!mounted) return;
    const link = document.createElement("link");
    link.href = "https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      try {
        if (link.parentNode) document.head.removeChild(link);
      } catch {}
    };
  }, [mounted]);

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v && quillInstanceRef.current) {
      try {
        quillInstanceRef.current.format("size", v);
      } catch {}
    }
    e.target.value = "";
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v && quillInstanceRef.current) {
      try {
        quillInstanceRef.current.format("font", v);
      } catch {}
    }
    e.target.value = "";
  };

  if (!mounted || !ReactQuill) {
    return (
      <div style={{ minHeight, border: "1px solid #ccc", borderRadius: 8, padding: 16, background: "#f9fafb" }}>
        <p style={{ color: "#6b7280", margin: 0 }}>Carregando editor…</p>
      </div>
    );
  }

  const QuillComponent = ReactQuill.default;

  return (
    <div className="rich-text-editor-wrap" ref={wrapperRef}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rich-text-editor-wrap .ql-editor { min-height: ${minHeight}px; }
        .rich-text-editor-wrap .ql-size-10px { font-size: 10px; }
        .rich-text-editor-wrap .ql-size-12px { font-size: 12px; }
        .rich-text-editor-wrap .ql-size-14px { font-size: 14px; }
        .rich-text-editor-wrap .ql-size-16px { font-size: 16px; }
        .rich-text-editor-wrap .ql-size-18px { font-size: 18px; }
        .rich-text-editor-wrap .ql-size-20px { font-size: 20px; }
        .rich-text-editor-wrap .ql-size-24px { font-size: 24px; }
        .rich-text-editor-wrap .ql-size-32px { font-size: 32px; }
        .rich-text-editor-custom-toolbar { display: flex; gap: 8px; padding: 6px 10px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px 8px 0 0; border-bottom: none; flex-wrap: wrap; align-items: center; }
        .rich-text-editor-custom-toolbar select { padding: 4px 8px; border-radius: 4px; border: 1px solid #d1d5db; font-size: 13px; background: #fff; }
      `,
        }}
      />
      <div className="rich-text-editor-custom-toolbar">
        <select aria-label="Tamanho da fonte" onChange={handleSizeChange} defaultValue="">
          {SIZE_OPTIONS.map((opt) => (
            <option key={opt.value || "label"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select aria-label="Fonte" onChange={handleFontChange} defaultValue="">
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.value || "label"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>
          Selecione o texto e escolha tamanho/fonte
        </span>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
        <QuillComponent
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}

export default function RichTextEditor(props: RichTextEditorProps) {
  return <RichTextEditorInner {...props} />;
}
