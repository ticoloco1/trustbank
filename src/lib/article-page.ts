export const BACKGROUND_OPTIONS = [
  { value: "default", label: "Original" },
  { value: "white", label: "Branco" },
  { value: "white-lines", label: "Branco com linhas (página pautada)" },
  { value: "yellow", label: "Amarelo (bloco de notas)" },
  { value: "yellow-lines", label: "Amarelo com linhas (caderno)" },
  { value: "yellow-no-lines", label: "Amarelo sem linhas" },
  { value: "blue", label: "Azul claro" },
  { value: "pink", label: "Rosa claro" },
  { value: "green", label: "Verde claro" },
  { value: "grey", label: "Cinza (papel de cartas)" },
  { value: "beige", label: "Bege" },
  { value: "orange", label: "Laranja clarinho" },
  { value: "lavender", label: "Lavanda" },
  { value: "mint", label: "Menta" },
  { value: "peach", label: "Pêssego" },
  { value: "cream", label: "Creme" },
  { value: "map", label: "Tipo mapa (texturizado)" },
  { value: "pirate-map", label: "Mapa pirata (pergaminho)" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "paper-crumpled", label: "Papel amassado" },
  { value: "paper-stained", label: "Papel manchado" },
] as const;

export type BackgroundOption = (typeof BACKGROUND_OPTIONS)[number]["value"];

/** Valores aceitos para o campo background (API e banco) */
export const BACKGROUND_VALUES: string[] = BACKGROUND_OPTIONS.map((o) => o.value);

export function getArticleBackgroundClass(background: string | null | undefined): string {
  return `article-bg-${background || "default"}`;
}

// Linhas de caderno (repeating gradient)
const notebookLines = `
  repeating-linear-gradient(
    transparent,
    transparent 27px,
    rgba(0,0,0,0.06) 27px,
    rgba(0,0,0,0.06) 28px
  );
`;

export const articleBackgroundStyles = `
.article-bg-default { background: #f8fafc; }
.article-bg-white { background: #ffffff; }
.article-bg-white-lines {
  background: #ffffff;
  background-image: repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.08) 27px, rgba(0,0,0,0.08) 28px);
  box-shadow: inset 0 0 0 1px #e5e7eb;
}
.article-bg-yellow { background: #fefce8; box-shadow: inset 0 0 0 1px #fde047; }
.article-bg-yellow-lines {
  background: #fefce8;
  background-image: ${notebookLines};
  box-shadow: inset 0 0 0 1px rgba(253, 224, 71, 0.5);
}
.article-bg-yellow-no-lines { background: #fef9c3; }
.article-bg-blue { background: #eff6ff; }
.article-bg-pink { background: #fce7f3; }
.article-bg-green { background: #dcfce7; }
.article-bg-grey { background: #f1f5f9; }
.article-bg-beige { background: #fef3c7; }
.article-bg-orange { background: #fff7ed; }
.article-bg-lavender { background: #f5f3ff; }
.article-bg-mint { background: #ecfdf5; }
.article-bg-peach { background: #ffedd5; }
.article-bg-cream { background: #fefce8; background-color: #fffbeb; }
.article-bg-map {
  background: #e8e4d9;
  background-image:
    linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px);
  background-size: 24px 24px;
}
.article-bg-pirate-map {
  background: #e8dcc8;
  background-image:
    linear-gradient(rgba(100,80,60,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100,80,60,0.08) 1px, transparent 1px);
  background-size: 20px 20px;
  box-shadow: inset 0 0 80px rgba(139,90,43,0.06);
}
.article-bg-pirate-map .article-content { color: #3d3225; }
.article-bg-light { background: #f1f5f9; color: #1e293b; }
.article-bg-dark { background: #1e293b; color: #e2e8f0; }
.article-bg-dark a { color: #93c5fd; }
.article-bg-dark .article-content a { color: #93c5fd; }
.article-bg-dark h1 { color: #f8fafc !important; }
.article-bg-paper-crumpled {
  background: #f5f0e6;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
}
.article-bg-paper-stained {
  background: #f0ebe0;
  background-image:
    radial-gradient(ellipse at 20% 30%, rgba(180,160,120,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(200,170,130,0.1) 0%, transparent 40%);
}

.article-content h1 { font-size: 1.75rem; margin: 1rem 0 0.5rem; }
.article-content h2 { font-size: 1.35rem; margin: 0.75rem 0 0.35rem; }
.article-content h3 { font-size: 1.15rem; margin: 0.5rem 0 0.25rem; }
.article-content p { margin: 0.5rem 0; line-height: 1.6; }
.article-content ul, .article-content ol { margin: 0.5rem 0; padding-left: 1.5rem; }
.article-content a { color: #2563eb; text-decoration: underline; }
.article-content img { max-width: 100%; height: auto; border-radius: 6px; }
.article-content blockquote { border-left: 4px solid #cbd5e1; margin: 0.5rem 0; padding-left: 1rem; color: #475569; font-style: italic; }
.article-content strong { font-weight: 700; }
.article-content em { font-style: italic; }
.article-content u { text-decoration: underline; }
.article-content s { text-decoration: line-through; }
.article-content code { background: #f1f5f9; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
.article-content pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; }
.article-content pre code { background: none; padding: 0; color: inherit; }
.article-content span[style*="font-size"] { display: inline; }
.article-content span[style*="font-family"] { display: inline; }
.article-content .ql-size-10px { font-size: 10px; }
.article-content .ql-size-12px { font-size: 12px; }
.article-content .ql-size-14px { font-size: 14px; }
.article-content .ql-size-16px { font-size: 16px; }
.article-content .ql-size-18px { font-size: 18px; }
.article-content .ql-size-20px { font-size: 20px; }
.article-content .ql-size-24px { font-size: 24px; }
.article-content .ql-size-32px { font-size: 32px; }
`;
