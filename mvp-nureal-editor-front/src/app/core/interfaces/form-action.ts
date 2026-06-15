export type ActionType = 'create_record' | 'send_email' | 'send_whatsapp' | 'webhook';

export interface FormAction {
  id:       string;
  type:     ActionType;
  label?:   string;

  // create_record
  objectName?: string;   // qual objeto criar (default: o objeto vinculado ao form)

  // send_email
  emailWebhookUrl?: string;  // URL que recebe { to, subject, body, data }
  emailTo?:         string;  // campo ou email fixo: "{email}" ou "admin@x.com"
  emailSubject?:    string;  // suporte a {campo}: "Nova solicitação de {nome}"
  emailBody?:       string;  // corpo do email com {campo}

  // send_whatsapp
  whatsappWebhookUrl?: string;  // Z-API / Evolution API / Twilio endpoint
  whatsappTo?:         string;  // campo com telefone: "{telefone}"
  whatsappMessage?:    string;  // mensagem com {campo}

  // webhook genérico
  webhookUrl?:     string;
  webhookMethod?:  'POST' | 'GET';
  webhookPayload?: string;   // JSON template com {campo}
}
