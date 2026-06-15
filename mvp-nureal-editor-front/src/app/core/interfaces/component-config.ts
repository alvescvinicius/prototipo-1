export interface ComponentConfig {

  // ─── Conteúdo ──────────────────────────────────
  content?:     string;
  placeholder?: string;
  label?:       string;
  description?: string;
  src?:         string;
  href?:        string;
  items?:       string;
  options?:     string;

  // ─── Posicionamento no pai ──────────────────────
  alignSelf?: string;

  // ─── CSS customizado (código livre) ────────────
  customCss?: string;

  // ─── Tipografia ────────────────────────────────
  fontSize?:   string;
  fontWeight?: string;
  color?:      string;
  textAlign?:  string;

  // ─── Espaçamento ───────────────────────────────
  paddingTop?:    string;
  paddingBottom?: string;
  paddingLeft?:   string;
  paddingRight?:  string;
  marginTop?:     string;
  marginBottom?:  string;

  // ─── Visual ────────────────────────────────────
  backgroundColor?: string;
  borderRadius?:    string;
  borderWidth?:     string;
  borderColor?:     string;
  borderStyle?:     string;

  // ─── Dimensões ─────────────────────────────────
  width?:  string;
  height?: string;

}
