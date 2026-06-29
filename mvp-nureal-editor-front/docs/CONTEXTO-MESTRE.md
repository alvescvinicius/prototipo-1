# Nureal — Contexto Mestre do Projeto

Plataforma SaaS para criar e publicar páginas de negócio a partir de templates
inteligentes. Não compete em liberdade total de design (Wix/Webflow); o foco é
transformar **templates em aplicações simples de negócio**, sem código.

## Hierarquia
Projeto → Páginas → Seções → Componentes
Projeto também contém: Objetos de Dados, APIs, Fluxos, Configurações, Publicação.

## Público-alvo
Pequenos negócios locais: autoescolas, imobiliárias, construtoras, advocacia,
clínicas, restaurantes, academias, oficinas, prestadores de serviço.

## Pilares
- Construtor de páginas baseado em templates estruturados (não editor livre).
- Personalização controlada: cores, fontes, textos, imagens, ícones, espaçamentos.
- Objetos de Dados persistidos (Supabase / PostgreSQL + RLS multi-tenant).
- Eventos (OnLoad, OnClick, OnSubmit, OnChange, OnSuccess, OnError, OnTimer).
- Ações (navegar, modal, e-mail, WhatsApp, salvar/consultar objeto, REST, webhook,
  mensagem, download, redirecionar).
- Fluxos (sequência de ações) e Regras (condicionais SE…).
- Integrações sem código (REST, Webhook, Supabase, Google Maps, WhatsApp, Email).
- Publicação (cliente.nureal.com.br ou domínio próprio).

## Stack
Angular standalone + Signals + TypeScript. Supabase (PostgreSQL, Auth, Storage,
RLS). Hospedagem Vercel/VPS. Arquitetura multi-tenant.

## Templates de referência
Autoescola, Imobiliária, Construtora, Clínica (todos usam o mesmo motor interno;
muda só a estrutura inicial).

## MVP
Escolher template → personalizar → adicionar componentes → configurar formulários
→ criar ações → salvar dados → integrar APIs → publicar. Sem código.
