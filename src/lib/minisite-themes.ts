/**
 * Temas de cor para mini sites — presets aplicados ao criar/editar.
 * primary_color: títulos e links; accent_color: destaques e bordas; bg_color: fundo.
 */
export type MinisiteThemePreset = {
  id: string;
  name: string;
  primary_color: string;
  accent_color: string;
  bg_color: string;
};

export const MINISITE_THEMES: MinisiteThemePreset[] = [
  { id: "aluminio_anodizado", name: "Alumínio anodizado", primary_color: "#6b7280", accent_color: "#9ca3af", bg_color: "#1f2937" },
  { id: "aco_escovado", name: "Aço escovado", primary_color: "#4b5563", accent_color: "#6b7280", bg_color: "#e5e7eb" },
  { id: "azul", name: "Azul", primary_color: "#2563eb", accent_color: "#3b82f6", bg_color: "#eff6ff" },
  { id: "vermelho", name: "Vermelho", primary_color: "#dc2626", accent_color: "#ef4444", bg_color: "#fef2f2" },
  { id: "amarelo", name: "Amarelo", primary_color: "#ca8a04", accent_color: "#eab308", bg_color: "#fefce8" },
  { id: "roxo", name: "Roxo", primary_color: "#7c3aed", accent_color: "#8b5cf6", bg_color: "#f5f3ff" },
  { id: "lilas", name: "Lilás", primary_color: "#a855f7", accent_color: "#c084fc", bg_color: "#faf5ff" },
  { id: "verde", name: "Verde", primary_color: "#16a34a", accent_color: "#22c55e", bg_color: "#f0fdf4" },
  { id: "esmeralda", name: "Esmeralda", primary_color: "#059669", accent_color: "#10b981", bg_color: "#ecfdf5" },
  { id: "indigo", name: "Indigo", primary_color: "#4f46e5", accent_color: "#6366f1", bg_color: "#eef2ff" },
  { id: "cinza_escuro", name: "Cinza escuro", primary_color: "#f9fafb", accent_color: "#d1d5db", bg_color: "#111827" },
  { id: "coral", name: "Coral", primary_color: "#ea580c", accent_color: "#f97316", bg_color: "#fff7ed" },
];
