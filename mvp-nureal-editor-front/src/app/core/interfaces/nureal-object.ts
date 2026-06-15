export type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'boolean' | 'date' | 'select' | 'phone';

export interface ObjectField {
  id:          string;
  name:        string;       // slug: "email"
  label:       string;       // display: "E-mail"
  type:        FieldType;
  required?:   boolean;
  placeholder?: string;
  options?:    string;       // para select: "Opção 1, Opção 2"
  default?:    string;
}

export interface NurealObject {
  id:         string;
  user_id:    string;
  name:       string;        // slug: "solicitacao"
  label:      string;        // display: "Solicitação"
  fields:     ObjectField[];
  created_at: string;
  updated_at: string;
}
