import { FormField }  from './form-field';
import { FormAction } from './form-action';

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
  // ─── Layout flex (section / container) ─────────────────────
  flexDirection?:  string;  // 'row' | 'column'
  alignItems?:     string;  // 'flex-start' | 'center' | 'flex-end' | 'stretch'
  justifyContent?: string;  // 'flex-start' | 'center' | 'flex-end' | 'space-between'
  gap?:            string;  // '16px'
  flexWrap?:       string;  // 'wrap' | 'nowrap'
  // ─── Posicionamento livre ───────────────────────────────────
  absolutePos?:   boolean;  // true = position: absolute dentro do pai
  posX?:          number;   // left em px
  posY?:          number;   // top em px
  zIndex?:        number;   // z-index quando em modo absoluto
  allowOverflow?: boolean;  // pode sair dos limites do pai (overflow: visible no pai)
}
