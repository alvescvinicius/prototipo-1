export interface FormField {
  id:           string;
  type:         'text' | 'email' | 'number' | 'textarea' | 'checkbox' | 'select';
  label:        string;
  placeholder?: string;
  required?:    boolean;
  options?:     string;   // para select: "Opção 1, Opção 2"
}
