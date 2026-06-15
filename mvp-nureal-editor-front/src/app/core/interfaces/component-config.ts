import { FormField }       from './form-field';
import { FormAction }      from './form-action';
import { ComponentAction } from './component-action';

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
  fontSize?:      string;
  fontWeight?:    string;
  color?:         string;
  textAlign?:     string;
  letterSpacing?: string;
  lineHeight?:    string;

  // ─── Espaçamento ───────────────────────────────
  paddingTop?:    string;
  paddingBottom?: string;
  paddingLeft?:   string;
  paddingRight?:  string;
  marginTop?:     string;
  marginBottom?:  string;
  marginLeft?:    string;
  marginRight?:   string;

  // ─── Visual ────────────────────────────────────
  backgroundColor?: string;
  borderRadius?:    string;
  borderWidth?:     string;
  borderColor?:     string;
  borderStyle?:     string;
  opacity?:         number;
  boxShadow?:       string;

  // ─── Form avançado ─────────────────────────────
  boundObject?:  string;        // nome do objeto vinculado (ex: "solicitacao")
  formActions?:  FormAction[];  // ações executadas no submit

  // ─── Form simples (legado) ─────────────────────
  formFields?:   FormField[];   // campos do formulário
  submitLabel?:  string;        // texto do botão (default: 'Enviar')
  submitAction?: string;        // 'supabase' | 'email' (futuro)
  formId?:       string;        // uuid fixo para identificar o form nas submissões

  // ─── Dimensões ─────────────────────────────────
  width?:    string;
  height?:   string;
  maxWidth?: string;
  minWidth?: string;
  columns?:  string;  // GRID: número de colunas (ex: '3')

  // ─── Layout flex (section / container) ─────────
  flexDirection?:  string;
  alignItems?:     string;
  justifyContent?: string;
  gap?:            string;
  flexWrap?:       string;

  // ─── Posicionamento livre ───────────────────────
  absolutePos?:   boolean;
  posX?:          number;
  posY?:          number;
  zIndex?:        number;
  allowOverflow?: boolean;

  // ─── Ações (event-driven, todos os componentes) ─
  actions?: ComponentAction[];
}
