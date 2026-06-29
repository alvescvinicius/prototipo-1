import { ComponentType } from '../enums/component-type.enum';
import { Page } from '../interfaces/page';
import { Section } from '../interfaces/section';
import { PageComponent } from '../interfaces/page-component';
import { ComponentConfig } from '../interfaces/component-config';
import { ComponentAction } from '../interfaces/component-action';
import { FormField } from '../interfaces/form-field';

/**
 * Templates profissionais de apresentação de serviço (mini-sites prontos).
 * Cada página recebe um cabeçalho (marca + navegação + CTA). Os CTAs já vêm
 * com ação onClick "navegar", usando o motor de ações compartilhado.
 *
 * O template "autoescola" inclui um formulário de matrícula ligado ao objeto
 * Nureal "aluno" (create_record) — ver TEMPLATE_OBJECTS para o seed do objeto.
 */

const T = ComponentType;

function uid(): string { return crypto.randomUUID(); }

function seed(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'nureal';
}
function pic(s: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${seed(s)}/${w}/${h}`;
}

function comp(type: ComponentType, name: string, config: ComponentConfig): PageComponent {
  return { id: uid(), type, name, order: 0, children: [], config };
}
function node(type: ComponentType, name: string, config: ComponentConfig, children: PageComponent[]): PageComponent {
  children.forEach((c, i) => (c.order = i + 1));
  return { id: uid(), type, name, order: 0, children, config };
}
function section(name: string, config: ComponentConfig, components: PageComponent[]): Section {
  components.forEach((c, i) => (c.order = i + 1));
  return { id: uid(), type: T.SECTION, name, order: 0, config, pageComponents: components };
}
function page(name: string, slug: string, sections: Section[], id: string = uid()): Page {
  sections.forEach((s, i) => (s.order = i + 1));
  return { id, name, slug, sections };
}
function navTo(pageId: string): ComponentAction[] {
  return [{ id: uid(), trigger: 'onClick', type: 'navigate', params: { targetPage: pageId } }];
}

interface Theme {
  primary: string; primaryText: string;
  accent: string; accentSoft: string;
  heading: string; body: string; muted: string;
  heroBg: string; heroText: string; heroEyebrow: string;
  softBg: string; cardBg: string; cardBorder: string; cardShadow: string;
  ctaBg: string; ctaText: string;
  footerBg: string; footerText: string;
  headerBg: string; headerText: string; navColor: string; headerBorder: string;
}

// ── Cabeçalho ────────────────────────────────────────────────────────────────

function header(t: Theme, brand: string, links: { label: string; id: string }[], ctaLabel: string, ctaId: string): Section {
  const nav = links.map(l => comp(T.BUTTON, l.label, {
    content: l.label, backgroundColor: 'transparent', color: t.navColor,
    fontSize: '14px', fontWeight: '600',
    paddingTop: '8px', paddingBottom: '8px', paddingLeft: '10px', paddingRight: '10px',
    borderRadius: '8px', cursor: 'pointer', marginTop: '0', marginBottom: '0',
    actions: navTo(l.id),
  }));
  const inner = node(T.CONTAINER, 'Barra', {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: '12px', width: '100%', maxWidth: '1120px', alignSelf: 'center',
  }, [
    comp(T.TEXT, 'Marca', {
      content: brand, color: t.headerText, fontSize: '20px', fontWeight: '800',
      marginTop: '0', marginBottom: '0',
    }),
    node(T.CONTAINER, 'Navegação', {
      flexDirection: 'row', gap: '4px', alignItems: 'center', flexWrap: 'wrap',
    }, nav),
    comp(T.BUTTON, 'CTA topo', {
      content: ctaLabel, backgroundColor: t.primary, color: t.primaryText,
      fontSize: '14px', fontWeight: '700',
      paddingTop: '10px', paddingBottom: '10px', paddingLeft: '18px', paddingRight: '18px',
      borderRadius: '8px', cursor: 'pointer', marginTop: '0', marginBottom: '0',
      actions: navTo(ctaId),
    }),
  ]);
  return section('Cabeçalho', {
    backgroundColor: t.headerBg,
    paddingTop: '14px', paddingBottom: '14px', paddingLeft: '24px', paddingRight: '24px',
    customCss: `border-bottom:1px solid ${t.headerBorder}`,
  }, [inner]);
}

/** Prepende o cabeçalho a todas as páginas, com links para cada página. */
function withHeader(t: Theme, brand: string, pages: Page[], ctaLabel: string, ctaId: string): Page[] {
  const links = pages.map(p => ({ label: p.name, id: p.id }));
  return pages.map(p => {
    const sections = [header(t, brand, links, ctaLabel, ctaId), ...p.sections];
    sections.forEach((s, i) => (s.order = i + 1));
    return { ...p, sections };
  });
}

// ── Botões ───────────────────────────────────────────────────────────────────

function primaryBtn(t: Theme, label: string, actions?: ComponentAction[]): PageComponent {
  return comp(T.BUTTON, 'CTA', {
    content: label, backgroundColor: t.primary, color: t.primaryText,
    fontSize: '16px', fontWeight: '700',
    paddingTop: '15px', paddingBottom: '15px', paddingLeft: '30px', paddingRight: '30px',
    borderRadius: '10px', cursor: 'pointer', ...(actions ? { actions } : {}),
  });
}
function ghostBtn(t: Theme, label: string, actions?: ComponentAction[]): PageComponent {
  return comp(T.BUTTON, 'CTA secundário', {
    content: label, backgroundColor: 'transparent', color: t.heroText,
    fontSize: '16px', fontWeight: '600',
    paddingTop: '14px', paddingBottom: '14px', paddingLeft: '26px', paddingRight: '26px',
    borderRadius: '10px', borderWidth: '1px', borderStyle: 'solid', borderColor: t.heroText,
    cursor: 'pointer', ...(actions ? { actions } : {}),
  });
}
function buttonRow(children: PageComponent[]): PageComponent {
  return node(T.CONTAINER, 'Botões', {
    flexDirection: 'row', gap: '14px', justifyContent: 'center', flexWrap: 'wrap',
    width: '100%', maxWidth: '560px', alignSelf: 'center', marginTop: '6px',
  }, children);
}

// ── Seções ───────────────────────────────────────────────────────────────────

interface HeroContent { eyebrow: string; title: string; subtitle: string; primary: string; secondary: string; }

function hero(t: Theme, ids: { primary: string; secondary: string }, c: HeroContent): Section {
  return section('Hero', {
    backgroundColor: t.heroBg,
    paddingTop: '96px', paddingBottom: '96px', paddingLeft: '24px', paddingRight: '24px',
    alignItems: 'center', gap: '20px',
  }, [
    comp(T.TEXT, 'Eyebrow', { content: c.eyebrow, color: t.heroEyebrow, fontSize: '13px', fontWeight: '700', letterSpacing: '2px', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    comp(T.TITLE, 'Título', { content: c.title, color: t.heroText, fontSize: '52px', fontWeight: '800', textAlign: 'center', lineHeight: '1.08', maxWidth: '820px', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Subtítulo', { content: c.subtitle, color: t.heroText, fontSize: '19px', lineHeight: '1.6', textAlign: 'center', opacity: 0.88, maxWidth: '640px', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    buttonRow([ primaryBtn(t, c.primary, navTo(ids.primary)), ghostBtn(t, c.secondary, navTo(ids.secondary)) ]),
    comp(T.IMAGE, 'Imagem de capa', { src: pic(c.title, 1200, 560), width: '100%', maxWidth: '960px', height: '380px', alignSelf: 'center', borderRadius: '20px', marginTop: '22px', customCss: 'object-fit:cover;display:block;box-shadow:0 24px 60px rgba(0,0,0,.30)' }),
  ]);
}

function trustLogos(t: Theme, label: string, names: string[]): Section {
  const logos = names.map(n => comp(T.TEXT, n, { content: n, color: t.muted, fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px', opacity: 0.7, marginTop: '0', marginBottom: '0' }));
  return section('Prova social', {
    backgroundColor: t.softBg, paddingTop: '32px', paddingBottom: '32px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '16px',
  }, [
    comp(T.TEXT, 'Rótulo', { content: label, color: t.muted, fontSize: '12px', fontWeight: '700', letterSpacing: '1.5px', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    node(T.CONTAINER, 'Logos', { flexDirection: 'row', gap: '40px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', width: '100%', maxWidth: '900px', alignSelf: 'center' }, logos),
  ]);
}

interface Stat { num: string; label: string; }
function statsBand(t: Theme, stats: Stat[]): Section {
  const cells = stats.map(s => node(T.CONTAINER, s.label, { flexDirection: 'column', alignItems: 'center', gap: '4px', width: '100%' }, [
    comp(T.TITLE, 'Número', { content: s.num, color: t.accent, fontSize: '40px', fontWeight: '800', textAlign: 'center', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Rótulo', { content: s.label, color: t.muted, fontSize: '14px', textAlign: 'center', marginTop: '0', marginBottom: '0' }),
  ]));
  return section('Números', { backgroundColor: '#ffffff', paddingTop: '56px', paddingBottom: '56px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center' }, [
    node(T.GRID, 'Grade números', { columns: String(stats.length), gap: '24px', width: '100%', maxWidth: '960px', alignSelf: 'center' }, cells),
  ]);
}

interface ServiceItem { icon: string; title: string; desc: string; }
function serviceCard(t: Theme, s: ServiceItem): PageComponent {
  return node(T.CONTAINER, s.title, {
    flexDirection: 'column', alignItems: 'stretch', gap: '0', width: '100%',
    backgroundColor: t.cardBg, borderRadius: '18px', borderWidth: '1px', borderStyle: 'solid', borderColor: t.cardBorder, boxShadow: t.cardShadow,
    customCss: 'overflow:hidden',
  }, [
    comp(T.IMAGE, 'Imagem', { src: pic(s.title + s.icon, 600, 360), width: '100%', height: '158px', customCss: 'object-fit:cover;display:block' }),
    node(T.CONTAINER, 'Conteúdo', {
      flexDirection: 'column', alignItems: 'flex-start', gap: '10px', width: '100%',
      paddingTop: '22px', paddingBottom: '24px', paddingLeft: '24px', paddingRight: '24px',
    }, [
      comp(T.TEXT, 'Ícone', { content: s.icon, fontSize: '24px', backgroundColor: t.accentSoft, color: t.accent, width: '48px', height: '48px', textAlign: 'center', paddingTop: '10px', paddingBottom: '10px', borderRadius: '12px', marginTop: '0', marginBottom: '4px', lineHeight: '1' }),
      comp(T.TITLE, 'Título', { content: s.title, color: t.heading, fontSize: '19px', fontWeight: '700', marginTop: '0', marginBottom: '0' }),
      comp(T.TEXT, 'Descrição', { content: s.desc, color: t.muted, fontSize: '15px', lineHeight: '1.6', marginTop: '0', marginBottom: '0' }),
    ]),
  ]);
}
function servicesGrid(t: Theme, heading: string, sub: string, items: ServiceItem[], cols = 3): Section {
  return section('Serviços', { backgroundColor: t.softBg, paddingTop: '80px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '14px' }, [
    comp(T.TITLE, 'Título', { content: heading, color: t.heading, fontSize: '34px', fontWeight: '800', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Subtítulo', { content: sub, color: t.muted, fontSize: '17px', textAlign: 'center', maxWidth: '620px', alignSelf: 'center', marginTop: '0', marginBottom: '20px' }),
    node(T.GRID, 'Grade serviços', { columns: String(cols), gap: '22px', width: '100%', maxWidth: '1060px', alignSelf: 'center' }, items.map(i => serviceCard(t, i))),
  ]);
}

interface Step { n: string; title: string; desc: string; }
function processSteps(t: Theme, heading: string, steps: Step[]): Section {
  const cells = steps.map(s => node(T.CONTAINER, s.title, { flexDirection: 'column', alignItems: 'flex-start', gap: '8px', width: '100%' }, [
    comp(T.TITLE, 'Número', { content: s.n, color: t.accent, fontSize: '34px', fontWeight: '800', marginTop: '0', marginBottom: '0' }),
    comp(T.TITLE, 'Passo', { content: s.title, color: t.heading, fontSize: '18px', fontWeight: '700', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Descrição', { content: s.desc, color: t.muted, fontSize: '15px', lineHeight: '1.6', marginTop: '0', marginBottom: '0' }),
  ]));
  return section('Como funciona', { backgroundColor: '#ffffff', paddingTop: '80px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '36px' }, [
    comp(T.TITLE, 'Título', { content: heading, color: t.heading, fontSize: '34px', fontWeight: '800', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    node(T.GRID, 'Grade passos', { columns: String(steps.length), gap: '28px', width: '100%', maxWidth: '1040px', alignSelf: 'center' }, cells),
  ]);
}

interface Quote { stars: string; quote: string; author: string; role: string; }
function testimonial(t: Theme, q: Quote): Section {
  return section('Depoimento', { backgroundColor: t.heroBg, paddingTop: '72px', paddingBottom: '72px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '16px' }, [
    comp(T.TEXT, 'Estrelas', { content: q.stars, color: t.accent, fontSize: '22px', textAlign: 'center', letterSpacing: '3px', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Citação', { content: q.quote, color: t.heroText, fontSize: '24px', lineHeight: '1.5', textAlign: 'center', maxWidth: '760px', alignSelf: 'center', customCss: 'font-style:italic', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Autor', { content: q.author, color: t.heroText, fontSize: '16px', fontWeight: '700', textAlign: 'center', alignSelf: 'center', marginTop: '8px', marginBottom: '0' }),
    comp(T.TEXT, 'Cargo', { content: q.role, color: t.heroEyebrow, fontSize: '14px', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
  ]);
}

function benefits(t: Theme, heading: string, items: string[]): Section {
  const cells = items.map(it => comp(T.TITLE, it, {
    content: '✓  ' + it, color: t.heading, fontSize: '16px', fontWeight: '600',
    backgroundColor: t.cardBg, borderRadius: '12px', borderWidth: '1px', borderStyle: 'solid', borderColor: t.cardBorder,
    paddingTop: '16px', paddingBottom: '16px', paddingLeft: '18px', paddingRight: '18px', width: '100%', marginTop: '0', marginBottom: '0',
  }));
  return section('Benefícios', { backgroundColor: t.softBg, paddingTop: '72px', paddingBottom: '72px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '28px' }, [
    comp(T.TITLE, 'Título', { content: heading, color: t.heading, fontSize: '32px', fontWeight: '800', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    node(T.GRID, 'Grade benefícios', { columns: '2', gap: '16px', width: '100%', maxWidth: '880px', alignSelf: 'center' }, cells),
  ]);
}

function ctaBand(t: Theme, targetId: string, title: string, sub: string, label: string): Section {
  return section('CTA', { backgroundColor: t.ctaBg, paddingTop: '72px', paddingBottom: '72px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '16px' }, [
    comp(T.TITLE, 'Título', { content: title, color: t.ctaText, fontSize: '36px', fontWeight: '800', textAlign: 'center', maxWidth: '720px', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Subtítulo', { content: sub, color: t.ctaText, fontSize: '17px', textAlign: 'center', opacity: 0.9, maxWidth: '560px', alignSelf: 'center', marginTop: '0', marginBottom: '8px' }),
    comp(T.BUTTON, 'CTA', { content: label, backgroundColor: '#ffffff', color: t.ctaBg, fontSize: '16px', fontWeight: '700', paddingTop: '15px', paddingBottom: '15px', paddingLeft: '32px', paddingRight: '32px', borderRadius: '10px', cursor: 'pointer', alignSelf: 'center', actions: navTo(targetId) }),
  ]);
}

function contactForm(t: Theme, headline: string, sub: string): Section {
  const fields: FormField[] = [
    { id: 'nome',     type: 'text',     label: 'Nome',     placeholder: 'Seu nome',             required: true },
    { id: 'telefone', type: 'text',     label: 'Telefone', placeholder: '(00) 00000-0000',      required: true },
    { id: 'email',    type: 'email',    label: 'E-mail',   placeholder: 'seu@email.com',        required: false },
    { id: 'mensagem', type: 'textarea', label: 'Mensagem', placeholder: 'Conte o que precisa…', required: false },
  ];
  return formSection(t, 'Contato', headline, sub, { formId: uid(), submitLabel: 'Enviar mensagem', formFields: fields });
}

/** Seção genérica de formulário (contato ou matrícula). */
function formSection(t: Theme, name: string, headline: string, sub: string, formCfg: ComponentConfig): Section {
  return section(name, { backgroundColor: '#ffffff', paddingTop: '80px', paddingBottom: '88px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '12px' }, [
    comp(T.TITLE, 'Título', { content: headline, color: t.heading, fontSize: '34px', fontWeight: '800', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Subtítulo', { content: sub, color: t.muted, fontSize: '16px', textAlign: 'center', maxWidth: '540px', alignSelf: 'center', marginTop: '0', marginBottom: '14px' }),
    comp(T.FORM, 'Formulário', {
      width: '100%', maxWidth: '480px', alignSelf: 'center',
      backgroundColor: t.softBg, borderRadius: '16px', borderWidth: '1px', borderStyle: 'solid', borderColor: t.cardBorder,
      paddingTop: '30px', paddingBottom: '30px', paddingLeft: '26px', paddingRight: '26px',
      ...formCfg,
    }),
  ]);
}

function footer(t: Theme, name: string): Section {
  return section('Rodapé', { backgroundColor: t.footerBg, paddingTop: '36px', paddingBottom: '36px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '6px' }, [
    comp(T.TITLE, 'Marca', { content: name, color: t.footerText, fontSize: '18px', fontWeight: '800', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Copyright', { content: `© ${new Date().getFullYear()} ${name} · Feito com Nureal`, color: t.footerText, fontSize: '13px', textAlign: 'center', opacity: 0.7, alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
  ]);
}

// ── Metadados ────────────────────────────────────────────────────────────────


// ── Recursos extras: carrossel, galeria, planos, FAQ ─────────────────────────

/** Faixa horizontal rolável (carrossel/galeria) — renderiza igual no preview e no público. */
function scrollRow(name: string, children: PageComponent[], gap = '18px'): PageComponent {
  return node(T.CONTAINER, name, {
    flexDirection: 'row', gap, width: '100%', maxWidth: '1120px', alignSelf: 'center',
    customCss: 'overflow-x:auto;flex-wrap:nowrap;scroll-snap-type:x mandatory;padding-bottom:10px',
  }, children);
}

interface Slide { bg: string; eyebrow: string; title: string; desc: string; }
function bannerCarousel(t: Theme, ctaId: string, ctaLabel: string, slides: Slide[]): Section {
  const cards = slides.map(s => node(T.CONTAINER, s.title, {
    width: '90%', minWidth: '300px', height: '290px',
    backgroundColor: s.bg, borderRadius: '20px',
    flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: '10px',
    paddingTop: '32px', paddingBottom: '32px', paddingLeft: '38px', paddingRight: '38px',
    customCss: `scroll-snap-align:center;flex-shrink:0;background-image:linear-gradient(rgba(0,0,0,.42),rgba(0,0,0,.58)),url(${pic(s.title, 1000, 640)});background-size:cover;background-position:center`,
  }, [
    comp(T.TEXT, 'Eyebrow', { content: s.eyebrow, color: 'rgba(255,255,255,.85)', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', marginTop: '0', marginBottom: '0' }),
    comp(T.TITLE, 'Título', { content: s.title, color: '#ffffff', fontSize: '32px', fontWeight: '800', lineHeight: '1.15', maxWidth: '540px', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Descrição', { content: s.desc, color: 'rgba(255,255,255,.92)', fontSize: '16px', lineHeight: '1.5', maxWidth: '500px', marginTop: '0', marginBottom: '0' }),
    comp(T.BUTTON, 'CTA', { content: ctaLabel, backgroundColor: '#ffffff', color: '#111827', fontSize: '14px', fontWeight: '700', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '26px', paddingRight: '26px', borderRadius: '10px', cursor: 'pointer', marginTop: '6px', actions: navTo(ctaId) }),
  ]));
  return section('Banner', { backgroundColor: t.heroBg, paddingTop: '40px', paddingBottom: '44px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '14px' }, [
    comp(T.TEXT, 'Dica', { content: '← deslize para ver mais →', color: t.heroEyebrow, fontSize: '12px', letterSpacing: '1px', textAlign: 'center', alignSelf: 'center', opacity: 0.8, marginTop: '0', marginBottom: '0' }),
    scrollRow('Slides', cards, '20px'),
  ]);
}

interface GItem { img: string; caption: string; }
function gallery(t: Theme, heading: string, sub: string, items: GItem[]): Section {
  const cards = items.map(g => node(T.CONTAINER, g.caption, {
    width: '300px', minWidth: '300px', flexDirection: 'column', gap: '0',
    borderRadius: '16px', backgroundColor: t.cardBg, borderWidth: '1px', borderStyle: 'solid', borderColor: t.cardBorder, boxShadow: t.cardShadow,
    customCss: 'scroll-snap-align:start;flex-shrink:0;overflow:hidden',
  }, [
    comp(T.IMAGE, 'Foto', { src: g.img && g.img.indexOf("placehold") === -1 ? g.img : pic(g.caption, 600, 400), width: '100%', height: '190px', customCss: 'object-fit:cover;display:block' }),
    comp(T.TEXT, 'Legenda', { content: g.caption, color: t.heading, fontSize: '15px', fontWeight: '600', paddingTop: '12px', paddingBottom: '14px', paddingLeft: '16px', paddingRight: '16px', marginTop: '0', marginBottom: '0' }),
  ]));
  return section('Galeria', { backgroundColor: '#ffffff', paddingTop: '76px', paddingBottom: '76px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '10px' }, [
    comp(T.TITLE, 'Título', { content: heading, color: t.heading, fontSize: '34px', fontWeight: '800', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Subtítulo', { content: sub, color: t.muted, fontSize: '16px', textAlign: 'center', maxWidth: '620px', alignSelf: 'center', marginTop: '0', marginBottom: '18px' }),
    scrollRow('Fotos', cards, '18px'),
  ]);
}

interface Plan { name: string; price: string; per: string; features: string[]; highlight?: boolean; cta: string; }
function pricing(t: Theme, ctaId: string, heading: string, sub: string, plans: Plan[]): Section {
  const cards = plans.map(p => {
    const feats = p.features.map(ft => comp(T.TEXT, ft, { content: '✓  ' + ft, color: p.highlight ? 'rgba(255,255,255,.85)' : t.muted, fontSize: '14px', lineHeight: '1.5', marginTop: '0', marginBottom: '0' }));
    return node(T.CONTAINER, p.name, {
      flexDirection: 'column', alignItems: 'flex-start', gap: '8px', width: '100%',
      backgroundColor: p.highlight ? t.heroBg : t.cardBg, borderRadius: '18px',
      borderWidth: '1px', borderStyle: 'solid', borderColor: p.highlight ? t.heroBg : t.cardBorder, boxShadow: t.cardShadow,
      paddingTop: '30px', paddingBottom: '30px', paddingLeft: '26px', paddingRight: '26px',
    }, [
      comp(T.TITLE, 'Plano', { content: p.name, color: p.highlight ? t.heroText : t.heading, fontSize: '18px', fontWeight: '700', marginTop: '0', marginBottom: '0' }),
      comp(T.TITLE, 'Preço', { content: p.price, color: p.highlight ? '#ffffff' : t.heading, fontSize: '38px', fontWeight: '800', marginTop: '0', marginBottom: '0' }),
      comp(T.TEXT, 'Período', { content: p.per, color: p.highlight ? 'rgba(255,255,255,.7)' : t.muted, fontSize: '13px', marginTop: '0', marginBottom: '10px' }),
      ...feats,
      comp(T.BUTTON, 'CTA', { content: p.cta, backgroundColor: p.highlight ? '#ffffff' : t.primary, color: p.highlight ? t.heroBg : t.primaryText, fontSize: '15px', fontWeight: '700', paddingTop: '13px', paddingBottom: '13px', paddingLeft: '24px', paddingRight: '24px', borderRadius: '10px', cursor: 'pointer', width: '100%', marginTop: '14px', actions: navTo(ctaId) }),
    ]);
  });
  return section('Planos', { backgroundColor: t.softBg, paddingTop: '80px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '12px' }, [
    comp(T.TITLE, 'Título', { content: heading, color: t.heading, fontSize: '34px', fontWeight: '800', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Subtítulo', { content: sub, color: t.muted, fontSize: '16px', textAlign: 'center', maxWidth: '620px', alignSelf: 'center', marginTop: '0', marginBottom: '20px' }),
    node(T.GRID, 'Grade planos', { columns: String(plans.length), gap: '22px', width: '100%', maxWidth: '1000px', alignSelf: 'center' }, cards),
  ]);
}

interface QA { q: string; a: string; }
function faq(t: Theme, heading: string, items: QA[]): Section {
  const cards = items.map(it => node(T.CONTAINER, it.q, {
    flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '760px', alignSelf: 'center',
    backgroundColor: t.cardBg, borderRadius: '12px', borderWidth: '1px', borderStyle: 'solid', borderColor: t.cardBorder,
    paddingTop: '18px', paddingBottom: '18px', paddingLeft: '22px', paddingRight: '22px',
  }, [
    comp(T.TITLE, 'Pergunta', { content: it.q, color: t.heading, fontSize: '16px', fontWeight: '700', marginTop: '0', marginBottom: '0' }),
    comp(T.TEXT, 'Resposta', { content: it.a, color: t.muted, fontSize: '15px', lineHeight: '1.6', marginTop: '0', marginBottom: '0' }),
  ]));
  return section('FAQ', { backgroundColor: '#ffffff', paddingTop: '72px', paddingBottom: '72px', paddingLeft: '24px', paddingRight: '24px', alignItems: 'center', gap: '16px' }, [
    comp(T.TITLE, 'Título', { content: heading, color: t.heading, fontSize: '32px', fontWeight: '800', textAlign: 'center', alignSelf: 'center', marginTop: '0', marginBottom: '0' }),
    node(T.CONTAINER, 'Lista FAQ', { flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '760px', alignSelf: 'center' }, cards),
  ]);
}

export interface TemplateMeta { id: string; label: string; description: string; emoji: string; accent: string; }

export const TEMPLATES: TemplateMeta[] = [
  { id: 'blank',       label: 'Em branco',           description: 'Comece do zero, uma página vazia.',                       emoji: '📄', accent: '#9ca3af' },
  { id: 'agencia',     label: 'Agência / Estúdio',   description: 'Serviços criativos e digitais. Visual ousado, escuro.',   emoji: '🎨', accent: '#7c5cff' },
  { id: 'consultoria', label: 'Consultoria',         description: 'Profissional liberal e consultoria. Elegante e confiável.', emoji: '💼', accent: '#b8862f' },
  { id: 'lar',         label: 'Serviços para o lar', description: 'Reforma, elétrica, limpeza. Focado em conversão.',         emoji: '🏠', accent: '#0d9488' },
  { id: 'autoescola',  label: 'Auto Escola',         description: 'Site + matrícula de alunos com painel de administração.',  emoji: '🚗', accent: '#1d4ed8' },
  { id: 'agencia-b',     label: 'Agência — Vitrine',     description: 'Carrossel de destaques, galeria de portfólio e planos.', emoji: '🖼️', accent: '#7c5cff' },
  { id: 'consultoria-b', label: 'Consultoria — Planos',  description: 'Banner rotativo, tabela de planos e FAQ.',                emoji: '📊', accent: '#b8862f' },
  { id: 'lar-b',         label: 'Serviços — Galeria',    description: 'Galeria antes/depois, planos e perguntas frequentes.',   emoji: '🛠️', accent: '#0d9488' },
  { id: 'autoescola-b',  label: 'Auto Escola — Vitrine', description: 'Carrossel de cursos, galeria da frota e matrícula.',      emoji: '🚦', accent: '#1d4ed8' },
  { id: 'clinica',     label: 'Clínica',       description: 'Site de clínica com agendamento de consultas e painel.', emoji: '🩺', accent: '#0284c7' },
  { id: 'imobiliaria', label: 'Imobiliária',   description: 'Site imobiliário com captação de interesse e painel.',    emoji: '🏡', accent: '#b45309' },
];

// ── Seed de objetos (criados na conta ao usar o template) ─────────────────────

export interface SeedField { name: string; label: string; type: string; required?: boolean; options?: string; placeholder?: string; }
export interface SeedObject { name: string; label: string; fields: SeedField[]; }

export const TEMPLATE_OBJECTS: Record<string, SeedObject[]> = {
  clinica: [
    {
      name: 'agendamento', label: 'Agendamento',
      fields: [
        { name: 'nome',          label: 'Nome completo',  type: 'text',     required: true },
        { name: 'telefone',      label: 'Telefone',       type: 'phone',    required: true },
        { name: 'email',         label: 'E-mail',         type: 'email' },
        { name: 'especialidade', label: 'Especialidade',  type: 'select',   options: 'Clínico geral, Pediatria, Cardiologia, Dermatologia, Nutrição, Psicologia' },
        { name: 'data',          label: 'Data preferida', type: 'date' },
        { name: 'periodo',       label: 'Período',        type: 'select',   options: 'Manhã, Tarde' },
        { name: 'mensagem',      label: 'Observações',    type: 'textarea' },
        { name: 'status',        label: 'Status',         type: 'select',   options: 'Novo, Confirmado, Atendido, Cancelado' },
      ],
    },
  ],
  imobiliaria: [
    {
      name: 'lead', label: 'Lead / Interesse',
      fields: [
        { name: 'nome',      label: 'Nome completo', type: 'text',     required: true },
        { name: 'telefone',  label: 'Telefone',      type: 'phone',    required: true },
        { name: 'email',     label: 'E-mail',        type: 'email' },
        { name: 'interesse', label: 'Interesse',     type: 'select',   options: 'Comprar, Alugar, Anunciar imóvel' },
        { name: 'imovel',    label: 'Imóvel/região', type: 'text' },
        { name: 'mensagem',  label: 'Mensagem',      type: 'textarea' },
        { name: 'status',    label: 'Status',        type: 'select',   options: 'Novo, Em contato, Visita agendada, Fechado, Perdido' },
      ],
    },
  ],
  autoescola: [
    {
      name: 'aluno', label: 'Aluno',
      fields: [
        { name: 'nome',       label: 'Nome completo',       type: 'text',     required: true,  placeholder: 'Nome do aluno' },
        { name: 'cpf',        label: 'CPF',                 type: 'text',     required: true,  placeholder: '000.000.000-00' },
        { name: 'nascimento', label: 'Data de nascimento',  type: 'date' },
        { name: 'email',      label: 'E-mail',              type: 'email',    placeholder: 'email@exemplo.com' },
        { name: 'telefone',   label: 'Telefone',            type: 'phone',    required: true,  placeholder: '(00) 00000-0000' },
        { name: 'categoria',  label: 'Categoria',           type: 'select',   options: 'A, B, AB, C, D, E' },
        { name: 'status',     label: 'Status',              type: 'select',   options: 'Novo, Em andamento, Aprovado, Reprovado' },
      ],
    },
  ],
};

TEMPLATE_OBJECTS['autoescola-b'] = TEMPLATE_OBJECTS['autoescola'];

// Campos do formulário público de matrícula (ids = slugs do objeto aluno).
const ALUNO_FORM_FIELDS: FormField[] = [
  { id: 'nome',       type: 'text',   label: 'Nome completo',      placeholder: 'Seu nome',          required: true },
  { id: 'cpf',        type: 'text',   label: 'CPF',                placeholder: '000.000.000-00',    required: true },
  { id: 'nascimento', type: 'text',   label: 'Data de nascimento', placeholder: 'dd/mm/aaaa',        required: false },
  { id: 'email',      type: 'email',  label: 'E-mail',             placeholder: 'seu@email.com',     required: false },
  { id: 'telefone',   type: 'text',   label: 'Telefone / WhatsApp',placeholder: '(00) 00000-0000',   required: true },
  { id: 'categoria',  type: 'select', label: 'Categoria desejada', options: 'A, B, AB, C, D, E', placeholder: 'Selecione...', required: true },
];

function enrollForm(t: Theme, headline: string, sub: string): Section {
  return formSection(t, 'Matrícula', headline, sub, {
    formId: uid(), submitLabel: 'Enviar matrícula',
    boundObject: 'aluno',
    formActions: [{ id: uid(), type: 'create_record', objectName: 'aluno' }],
    formFields: ALUNO_FORM_FIELDS.map(f => ({ ...f })),
  });
}

function objectForm(t: Theme, sectionName: string, headline: string, sub: string, objectName: string, submitLabel: string, fields: FormField[]): Section {
  return formSection(t, sectionName, headline, sub, {
    formId: uid(), submitLabel, boundObject: objectName,
    formActions: [{ id: uid(), type: 'create_record', objectName }],
    formFields: fields.map(f => ({ ...f })),
  });
}

const AGENDAMENTO_FIELDS: FormField[] = [
  { id: 'nome',          type: 'text',     label: 'Nome completo',  placeholder: 'Seu nome',        required: true },
  { id: 'telefone',      type: 'text',     label: 'Telefone',       placeholder: '(00) 00000-0000', required: true },
  { id: 'email',         type: 'email',    label: 'E-mail',         placeholder: 'seu@email.com',   required: false },
  { id: 'especialidade', type: 'select',   label: 'Especialidade',  options: 'Clínico geral, Pediatria, Cardiologia, Dermatologia, Nutrição, Psicologia', placeholder: 'Selecione...', required: true },
  { id: 'data',          type: 'text',     label: 'Data preferida', placeholder: 'dd/mm/aaaa',      required: false },
  { id: 'periodo',       type: 'select',   label: 'Período',        options: 'Manhã, Tarde', placeholder: 'Selecione...', required: false },
  { id: 'mensagem',      type: 'textarea', label: 'Observações',    placeholder: 'Algo que devemos saber?', required: false },
];

const LEAD_FIELDS: FormField[] = [
  { id: 'nome',      type: 'text',     label: 'Nome completo', placeholder: 'Seu nome',        required: true },
  { id: 'telefone',  type: 'text',     label: 'Telefone / WhatsApp', placeholder: '(00) 00000-0000', required: true },
  { id: 'email',     type: 'email',    label: 'E-mail',        placeholder: 'seu@email.com',   required: false },
  { id: 'interesse', type: 'select',   label: 'Interesse',     options: 'Comprar, Alugar, Anunciar imóvel', placeholder: 'Selecione...', required: true },
  { id: 'imovel',    type: 'text',     label: 'Imóvel / região de interesse', placeholder: 'Ex.: Apto 2Q no Centro', required: false },
  { id: 'mensagem',  type: 'textarea', label: 'Mensagem',      placeholder: 'Conte o que procura…', required: false },
];

// ── Temas ────────────────────────────────────────────────────────────────────

const AGENCIA: Theme = {
  primary: '#7c5cff', primaryText: '#ffffff', accent: '#7c5cff', accentSoft: 'rgba(124,92,255,0.14)',
  heading: '#f5f5f7', body: '#0b0b0f', muted: '#a1a1aa',
  heroBg: '#0b0b0f', heroText: '#f5f5f7', heroEyebrow: '#9b8cff',
  softBg: '#101018', cardBg: '#15151e', cardBorder: '#23232e', cardShadow: '0 8px 30px rgba(0,0,0,.35)',
  ctaBg: '#7c5cff', ctaText: '#ffffff', footerBg: '#0b0b0f', footerText: '#f5f5f7',
  headerBg: '#0b0b0f', headerText: '#f5f5f7', navColor: '#c9c9d4', headerBorder: '#1d1d27',
};
const CONSULTORIA: Theme = {
  primary: '#15314f', primaryText: '#ffffff', accent: '#b8862f', accentSoft: 'rgba(184,134,47,0.14)',
  heading: '#15263b', body: '#ffffff', muted: '#64748b',
  heroBg: '#0f2540', heroText: '#ffffff', heroEyebrow: '#d8b56b',
  softBg: '#f5f7fa', cardBg: '#ffffff', cardBorder: '#e5e9f0', cardShadow: '0 6px 20px rgba(15,37,64,.06)',
  ctaBg: '#15314f', ctaText: '#ffffff', footerBg: '#0f2540', footerText: '#ffffff',
  headerBg: '#ffffff', headerText: '#15263b', navColor: '#42566e', headerBorder: '#e5e9f0',
};
const LAR: Theme = {
  primary: '#f97316', primaryText: '#ffffff', accent: '#0d9488', accentSoft: 'rgba(13,148,136,0.14)',
  heading: '#13343b', body: '#ffffff', muted: '#5b7079',
  heroBg: '#0d9488', heroText: '#ffffff', heroEyebrow: '#bdf2ec',
  softBg: '#f0fdfa', cardBg: '#ffffff', cardBorder: '#d6efeb', cardShadow: '0 6px 20px rgba(13,148,136,.08)',
  ctaBg: '#0d9488', ctaText: '#ffffff', footerBg: '#13343b', footerText: '#ffffff',
  headerBg: '#ffffff', headerText: '#13343b', navColor: '#3f5a62', headerBorder: '#d6efeb',
};
const AUTOESCOLA: Theme = {
  primary: '#1d4ed8', primaryText: '#ffffff', accent: '#f59e0b', accentSoft: 'rgba(245,158,11,0.16)',
  heading: '#0b2942', body: '#ffffff', muted: '#56708a',
  heroBg: '#0b2942', heroText: '#ffffff', heroEyebrow: '#facc6b',
  softBg: '#f4f7fb', cardBg: '#ffffff', cardBorder: '#e2e8f0', cardShadow: '0 6px 20px rgba(11,41,66,.07)',
  ctaBg: '#1d4ed8', ctaText: '#ffffff', footerBg: '#0b2942', footerText: '#ffffff',
  headerBg: '#ffffff', headerText: '#0b2942', navColor: '#3a5675', headerBorder: '#e2e8f0',
};
const CLINICA: Theme = {
  primary: '#0284c7', primaryText: '#ffffff', accent: '#10b981', accentSoft: 'rgba(16,185,129,0.14)',
  heading: '#0b2740', body: '#ffffff', muted: '#5b7387',
  heroBg: '#06283d', heroText: '#ffffff', heroEyebrow: '#7dd3fc',
  softBg: '#f0f9ff', cardBg: '#ffffff', cardBorder: '#dbeafe', cardShadow: '0 6px 20px rgba(2,132,199,.08)',
  ctaBg: '#0284c7', ctaText: '#ffffff', footerBg: '#06283d', footerText: '#ffffff',
  headerBg: '#ffffff', headerText: '#0b2740', navColor: '#3a607a', headerBorder: '#dbeafe',
};
const IMOBILIARIA: Theme = {
  primary: '#b45309', primaryText: '#ffffff', accent: '#ea580c', accentSoft: 'rgba(234,88,12,0.13)',
  heading: '#1c1917', body: '#ffffff', muted: '#78716c',
  heroBg: '#1c1917', heroText: '#ffffff', heroEyebrow: '#fdba74',
  softBg: '#faf7f2', cardBg: '#ffffff', cardBorder: '#ece5db', cardShadow: '0 6px 20px rgba(28,25,23,.07)',
  ctaBg: '#b45309', ctaText: '#ffffff', footerBg: '#1c1917', footerText: '#ffffff',
  headerBg: '#ffffff', headerText: '#1c1917', navColor: '#57534e', headerBorder: '#ece5db',
};

// ── Construtor ────────────────────────────────────────────────────────────────

export function buildTemplatePages(templateId: string): Page[] {

  if (templateId === 'agencia') {
    const t = AGENCIA, name = 'Studio Vértice';
    const inicioId = uid(), servicosId = uid(), contatoId = uid();
    const ids = { primary: contatoId, secondary: servicosId };
    const pages = [
      page('Início', 'inicio', [
        hero(t, ids, { eyebrow: 'ESTÚDIO CRIATIVO & DIGITAL', title: 'Marcas que vendem. Sites que convertem.', subtitle: 'Estratégia, design e tecnologia em um só lugar — projetos no ar em até 30 dias.', primary: 'Começar projeto', secondary: 'Ver serviços' }),
        trustLogos(t, 'EMPRESAS QUE CONFIAM NO NOSSO TRABALHO', ['Lumen', 'Nordic', 'Vortex', 'Praxis', 'Onda']),
        statsBand(t, [{ num: '+120', label: 'Projetos entregues' }, { num: '8 anos', label: 'De mercado' }, { num: '98%', label: 'Clientes satisfeitos' }, { num: '+40', label: 'Marcas atendidas' }]),
        servicesGrid(t, 'O que fazemos', 'Times especialistas para cada etapa da sua presença digital.', [
          { icon: '✨', title: 'Branding & Identidade', desc: 'Logo, identidade visual e posicionamento que destacam sua marca.' },
          { icon: '💻', title: 'Sites & Aplicações', desc: 'Sites rápidos e responsivos, focados em conversão.' },
          { icon: '📈', title: 'Marketing de Performance', desc: 'Tráfego pago e estratégia para gerar leads qualificados.' },
        ]),
        processSteps(t, 'Como trabalhamos', [{ n: '01', title: 'Descoberta', desc: 'Entendemos seu negócio, metas e público.' }, { n: '02', title: 'Design', desc: 'Protótipos e identidade alinhados à sua marca.' }, { n: '03', title: 'Entrega', desc: 'Desenvolvimento, testes e publicação.' }]),
        testimonial(t, { stars: '★★★★★', quote: 'Em poucas semanas tínhamos um site novo e os leads triplicaram. Equipe impecável.', author: 'Mariana Alves', role: 'CEO, Nordic Café' }),
        ctaBand(t, contatoId, 'Pronto para tirar a ideia do papel?', 'Conte seu desafio e montamos a proposta ideal.', 'Falar com a gente'),
        footer(t, name),
      ], inicioId),
      page('Serviços', 'servicos', [
        hero(t, ids, { eyebrow: 'NOSSOS SERVIÇOS', title: 'Tudo o que sua marca precisa para crescer.', subtitle: 'Da estratégia à execução, cuidamos de cada detalhe.', primary: 'Pedir orçamento', secondary: 'Como funciona' }),
        servicesGrid(t, 'Especialidades', 'Escolha um serviço ou combine vários em um pacote.', [
          { icon: '✨', title: 'Branding', desc: 'Identidade visual completa e manual de marca.' },
          { icon: '💻', title: 'Sites & Apps', desc: 'Landing pages, sites institucionais e sistemas.' },
          { icon: '📈', title: 'Performance', desc: 'Google Ads, Meta Ads e otimização de campanhas.' },
          { icon: '🎯', title: 'SEO', desc: 'Posicionamento orgânico e conteúdo estratégico.' },
          { icon: '🎬', title: 'Conteúdo', desc: 'Vídeos, social media e fotografia profissional.' },
          { icon: '🧩', title: 'UX/UI Design', desc: 'Experiências digitais centradas no usuário.' },
        ], 3),
        benefits(t, 'Por que o Studio Vértice', ['Time sênior dedicado ao seu projeto', 'Entregas em prazos curtos e previsíveis', 'Relatórios claros de resultados', 'Suporte contínuo após a entrega']),
        ctaBand(t, contatoId, 'Vamos construir algo incrível?', 'Resposta em até 1 dia útil.', 'Solicitar proposta'),
        footer(t, name),
      ], servicosId),
      page('Contato', 'contato', [
        contactForm(t, 'Conte sobre seu projeto', 'Preencha e retornamos com uma proposta personalizada.'),
        footer(t, name),
      ], contatoId),
    ];
    return withHeader(t, name, pages, 'Começar projeto', contatoId);
  }

  if (templateId === 'consultoria') {
    const t = CONSULTORIA, name = 'Marco & Associados';
    const inicioId = uid(), servicosId = uid(), contatoId = uid();
    const ids = { primary: contatoId, secondary: servicosId };
    const pages = [
      page('Início', 'inicio', [
        hero(t, ids, { eyebrow: 'CONSULTORIA EMPRESARIAL', title: 'Decisões mais seguras para o seu negócio.', subtitle: 'Consultoria contábil, tributária e de gestão para empresas que querem crescer com tranquilidade.', primary: 'Agendar conversa', secondary: 'Nossos serviços' }),
        trustLogos(t, 'CONFIANÇA DE EMPRESAS DE DIVERSOS SETORES', ['Atlas', 'Belo Hub', 'Cedro', 'Dínamo', 'Élevo']),
        statsBand(t, [{ num: '18 anos', label: 'De experiência' }, { num: '+250', label: 'Empresas atendidas' }, { num: '4.9★', label: 'Avaliação média' }, { num: '96%', label: 'Taxa de retenção' }]),
        servicesGrid(t, 'Áreas de atuação', 'Soluções sob medida para cada momento da sua empresa.', [
          { icon: '📑', title: 'Contábil & Tributário', desc: 'Escrituração, impostos e planejamento tributário.' },
          { icon: '📊', title: 'Gestão & Planejamento', desc: 'Indicadores, orçamento e tomada de decisão.' },
          { icon: '⚖️', title: 'Consultoria Jurídica', desc: 'Apoio em contratos, societário e compliance.' },
        ]),
        processSteps(t, 'Como começamos', [{ n: '01', title: 'Diagnóstico', desc: 'Analisamos a situação atual da sua empresa.' }, { n: '02', title: 'Plano', desc: 'Definimos prioridades e um plano de ação claro.' }, { n: '03', title: 'Acompanhamento', desc: 'Execução e relatórios periódicos de resultado.' }]),
        testimonial(t, { stars: '★★★★★', quote: 'Organizaram nossa contabilidade e reduziram impostos de forma totalmente legal. Recomendo.', author: 'Ricardo Menezes', role: 'Diretor, Cedro Logística' }),
        ctaBand(t, contatoId, 'Fale com um consultor hoje', 'Primeira conversa sem compromisso.', 'Agendar agora'),
        footer(t, name),
      ], inicioId),
      page('Serviços', 'servicos', [
        hero(t, ids, { eyebrow: 'SERVIÇOS', title: 'Consultoria completa, do contábil ao estratégico.', subtitle: 'Um parceiro para cuidar dos números e apoiar suas decisões.', primary: 'Solicitar proposta', secondary: 'Como funciona' }),
        servicesGrid(t, 'O que oferecemos', 'Serviços individuais ou integrados.', [
          { icon: '📑', title: 'Contabilidade', desc: 'Rotina contábil completa e obrigações em dia.' },
          { icon: '🧾', title: 'Tributário', desc: 'Planejamento e revisão de carga tributária.' },
          { icon: '📊', title: 'Gestão Financeira', desc: 'Fluxo de caixa, DRE e indicadores.' },
          { icon: '⚖️', title: 'Jurídico', desc: 'Contratos, societário e adequação legal.' },
          { icon: '👥', title: 'Departamento Pessoal', desc: 'Folha, admissões e rotinas trabalhistas.' },
          { icon: '🤝', title: 'Mentoria', desc: 'Acompanhamento estratégico para gestores.' },
        ], 3),
        benefits(t, 'Por que nos escolher', ['Equipe multidisciplinar e experiente', 'Atendimento próximo e consultivo', 'Tecnologia e relatórios em tempo real', 'Confidencialidade e segurança total']),
        ctaBand(t, contatoId, 'Sua empresa em boas mãos', 'Converse com nossos especialistas.', 'Quero conversar'),
        footer(t, name),
      ], servicosId),
      page('Contato', 'contato', [
        contactForm(t, 'Agende sua conversa', 'Deixe seus dados e um consultor entrará em contato.'),
        footer(t, name),
      ], contatoId),
    ];
    return withHeader(t, name, pages, 'Falar agora', contatoId);
  }

  if (templateId === 'lar') {
    const t = LAR, name = 'CasaPronta Serviços';
    const inicioId = uid(), servicosId = uid(), contatoId = uid();
    const ids = { primary: contatoId, secondary: servicosId };
    const pages = [
      page('Início', 'inicio', [
        hero(t, ids, { eyebrow: 'SERVIÇOS PARA SUA CASA', title: 'Profissionais de confiança, sem dor de cabeça.', subtitle: 'Reformas, elétrica, hidráulica e limpeza com orçamento rápido e garantia.', primary: 'Pedir orçamento', secondary: 'Ver serviços' }),
        trustLogos(t, 'MILHARES DE FAMÍLIAS JÁ ATENDIDAS', ['★ 4.9 Google', 'Garantia', 'Sem taxa', 'Rápido', 'Confiável']),
        statsBand(t, [{ num: '+5.000', label: 'Serviços realizados' }, { num: '4.9★', label: 'Nota dos clientes' }, { num: '12 anos', label: 'De experiência' }, { num: '24h', label: 'Resposta ao orçamento' }]),
        servicesGrid(t, 'Nossos serviços', 'Tudo o que sua casa precisa, com profissionais verificados.', [
          { icon: '🔧', title: 'Reformas & Reparos', desc: 'Pequenos reparos a reformas completas.' },
          { icon: '⚡', title: 'Elétrica', desc: 'Instalações, tomadas, chuveiros e quadros.' },
          { icon: '🚿', title: 'Hidráulica', desc: 'Vazamentos, torneiras e desentupimentos.' },
        ]),
        processSteps(t, 'Simples assim', [{ n: '01', title: 'Você pede', desc: 'Conte o que precisa pelo formulário.' }, { n: '02', title: 'Orçamento', desc: 'Enviamos uma estimativa em até 24h.' }, { n: '03', title: 'A gente resolve', desc: 'Profissional agendado e serviço com garantia.' }]),
        testimonial(t, { stars: '★★★★★', quote: 'Chamei para um vazamento e resolveram no mesmo dia. Atendimento ótimo e preço justo.', author: 'Patrícia Gomes', role: 'Cliente em São Paulo' }),
        ctaBand(t, contatoId, 'Precisa de um profissional agora?', 'Orçamento sem compromisso, resposta rápida.', 'Pedir orçamento'),
        footer(t, name),
      ], inicioId),
      page('Serviços', 'servicos', [
        hero(t, ids, { eyebrow: 'SERVIÇOS', title: 'Um time para cada necessidade da sua casa.', subtitle: 'Profissionais verificados, serviço com garantia e preço transparente.', primary: 'Solicitar orçamento', secondary: 'Como funciona' }),
        servicesGrid(t, 'O que fazemos', 'Escolha o serviço e peça seu orçamento.', [
          { icon: '🔧', title: 'Reformas', desc: 'Pisos, alvenaria, gesso e acabamentos.' },
          { icon: '⚡', title: 'Elétrica', desc: 'Instalações e manutenção elétrica.' },
          { icon: '🚿', title: 'Hidráulica', desc: 'Encanamento, vazamentos e reparos.' },
          { icon: '🎨', title: 'Pintura', desc: 'Interna, externa e texturas.' },
          { icon: '🧹', title: 'Limpeza', desc: 'Pós-obra, pesada e diarista.' },
          { icon: '❄️', title: 'Ar-condicionado', desc: 'Instalação, limpeza e manutenção.' },
        ], 3),
        benefits(t, 'Por que a CasaPronta', ['Profissionais verificados e avaliados', 'Garantia em todos os serviços', 'Orçamento rápido e sem compromisso', 'Atendimento humano de verdade']),
        ctaBand(t, contatoId, 'Resolva hoje mesmo', 'Peça seu orçamento em 1 minuto.', 'Pedir orçamento'),
        footer(t, name),
      ], servicosId),
      page('Contato', 'contato', [
        contactForm(t, 'Peça seu orçamento', 'Descreva o serviço e retornamos rapidinho.'),
        footer(t, name),
      ], contatoId),
    ];
    return withHeader(t, name, pages, 'Pedir orçamento', contatoId);
  }

  if (templateId === 'autoescola') {
    const t = AUTOESCOLA, name = 'Auto Escola Direção';
    const inicioId = uid(), cursosId = uid(), matriculaId = uid();
    const ids = { primary: matriculaId, secondary: cursosId };
    const pages = [
      page('Início', 'inicio', [
        hero(t, ids, { eyebrow: 'SUA CNH COMEÇA AQUI', title: 'Tire sua habilitação com quem entende.', subtitle: 'Aulas teóricas e práticas, instrutores experientes e a maior taxa de aprovação da região.', primary: 'Fazer matrícula', secondary: 'Ver cursos' }),
        trustLogos(t, 'RECONHECIMENTO E CONFIANÇA', ['DETRAN OK', '★ 4.9', '+10 anos', 'Frota nova', 'Aprovação alta']),
        statsBand(t, [{ num: '+8.000', label: 'Alunos formados' }, { num: '92%', label: 'Aprovação 1ª via' }, { num: '14 anos', label: 'De estrada' }, { num: '4.9★', label: 'Avaliação' }]),
        servicesGrid(t, 'Nossos cursos', 'Categorias para todos os perfis de condutor.', [
          { icon: '🏍️', title: 'Categoria A', desc: 'Motos e ciclomotores. Aulas práticas em pista.' },
          { icon: '🚗', title: 'Categoria B', desc: 'Carros de passeio. Teórico + 20 aulas práticas.' },
          { icon: '🚚', title: 'Categorias C, D, E', desc: 'Caminhão, ônibus e carreta. Profissionalize-se.' },
        ]),
        processSteps(t, 'Como funciona a matrícula', [{ n: '01', title: 'Cadastro', desc: 'Preencha a ficha de matrícula online.' }, { n: '02', title: 'Documentação', desc: 'Agendamos exames e o curso teórico.' }, { n: '03', title: 'Aulas e prova', desc: 'Práticas marcadas e suporte até a aprovação.' }]),
        testimonial(t, { stars: '★★★★★', quote: 'Passei de primeira! Os instrutores são pacientes e o agendamento é super flexível.', author: 'JoãoPereira', role: 'Aprovado categoria B' }),
        ctaBand(t, matriculaId, 'Comece sua matrícula hoje', 'Vagas abertas com condições especiais.', 'Quero me matricular'),
        footer(t, name),
      ], inicioId),
      page('Cursos', 'cursos', [
        hero(t, ids, { eyebrow: 'CURSOS E CATEGORIAS', title: 'Escolha a categoria certa para você.', subtitle: 'Primeira habilitação, adição ou mudança de categoria — temos o curso ideal.', primary: 'Matricular agora', secondary: 'Início' }),
        servicesGrid(t, 'Categorias', 'Cada categoria com turma teórica e aulas práticas.', [
          { icon: '🏍️', title: 'Categoria A', desc: 'Motocicletas e ciclomotores.' },
          { icon: '🚗', title: 'Categoria B', desc: 'Automóveis até 3.500 kg.' },
          { icon: '🚙', title: 'Categoria AB', desc: 'Moto e carro na mesma habilitação.' },
          { icon: '🚚', title: 'Categoria C', desc: 'Veículos de carga.' },
          { icon: '🚌', title: 'Categoria D', desc: 'Transporte de passageiros.' },
          { icon: '🚛', title: 'Categoria E', desc: 'Combinação de veículos / carreta.' },
        ], 3),
        benefits(t, 'Por que estudar com a gente', ['Instrutores credenciados e experientes', 'Frota nova e bem cuidada', 'Aulas com horários flexíveis', 'Acompanhamento até a aprovação']),
        ctaBand(t, matriculaId, 'Pronto para dirigir?', 'Garanta sua vaga na próxima turma.', 'Fazer matrícula'),
        footer(t, name),
      ], cursosId),
      page('Matrícula', 'matricula', [
        enrollForm(t, 'Ficha de matrícula', 'Preencha seus dados. Nossa equipe confirma sua vaga e os próximos passos.'),
        footer(t, name),
      ], matriculaId),
    ];
    return withHeader(t, name, pages, 'Matricule-se', matriculaId);
  }


  if (templateId === 'agencia-b') {
    const t = AGENCIA, name = 'Studio Vértice';
    const inicioId = uid(), planosId = uid(), contatoId = uid();
    const pages = [
      page('Início', 'inicio', [
        bannerCarousel(t, contatoId, 'Começar projeto', [
          { bg: '#7c5cff', eyebrow: 'PORTFÓLIO', title: 'Projetos que viram referência', desc: 'Branding e produtos digitais premiados.' },
          { bg: '#1e1b4b', eyebrow: 'PERFORMANCE', title: 'Campanhas que geram leads', desc: 'Tráfego pago com foco em resultado real.' },
          { bg: '#0ea5e9', eyebrow: 'PRODUTO', title: 'Sites e apps sob medida', desc: 'Da ideia ao lançamento em semanas.' },
        ]),
        statsBand(t, [{ num: '+120', label: 'Projetos' }, { num: '8 anos', label: 'De mercado' }, { num: '98%', label: 'Satisfação' }, { num: '+40', label: 'Clientes' }]),
        gallery(t, 'Portfólio', 'Alguns dos nossos trabalhos recentes.', [
          { img: 'https://placehold.co/600x400/7c5cff/ffffff?text=Branding', caption: 'Rebrand — Nordic Café' },
          { img: 'https://placehold.co/600x400/1e1b4b/ffffff?text=Web', caption: 'E-commerce — Vortex' },
          { img: 'https://placehold.co/600x400/0ea5e9/ffffff?text=App', caption: 'App — Praxis' },
          { img: 'https://placehold.co/600x400/111118/ffffff?text=Campanha', caption: 'Performance — Onda' },
          { img: 'https://placehold.co/600x400/4c1d95/ffffff?text=Social', caption: 'Conteúdo — Lumen' },
        ]),
        faq(t, 'Perguntas frequentes', [
          { q: 'Quanto tempo leva um projeto?', a: 'Sites entram no ar em até 30 dias; projetos maiores variam conforme o escopo.' },
          { q: 'Vocês dão suporte depois?', a: 'Sim, oferecemos planos de suporte e evolução contínua.' },
          { q: 'Como é a cobrança?', a: 'Proposta fechada por projeto ou pacote mensal, sem surpresas.' },
        ]),
        ctaBand(t, contatoId, 'Bora começar?', 'Conte seu desafio e montamos a proposta.', 'Falar com a gente'),
        footer(t, name),
      ], inicioId),
      page('Planos', 'planos', [
        pricing(t, contatoId, 'Planos & Pacotes', 'Escolha o que cabe no seu momento.', [
          { name: 'Essencial', price: 'R$ 2.5k', per: 'por projeto', features: ['Landing page', 'Design responsivo', 'Entrega em 15 dias'], cta: 'Quero esse' },
          { name: 'Profissional', price: 'R$ 6k', per: 'por projeto', features: ['Site completo', 'Identidade visual', 'SEO básico', 'Suporte 30 dias'], highlight: true, cta: 'Mais popular' },
          { name: 'Performance', price: 'R$ 3k', per: 'por mês', features: ['Gestão de tráfego', 'Relatórios mensais', 'Otimização contínua'], cta: 'Quero esse' },
        ]),
        faq(t, 'Dúvidas sobre os planos', [
          { q: 'Posso trocar de plano depois?', a: 'Sim, é só falar com a gente que ajustamos.' },
          { q: 'Tem fidelidade?', a: 'Não. Os pacotes mensais podem ser cancelados a qualquer momento.' },
        ]),
        footer(t, name),
      ], planosId),
      page('Contato', 'contato', [ contactForm(t, 'Conte sobre seu projeto', 'Retornamos com uma proposta personalizada.'), footer(t, name) ], contatoId),
    ];
    return withHeader(t, name, pages, 'Começar projeto', contatoId);
  }

  if (templateId === 'consultoria-b') {
    const t = CONSULTORIA, name = 'Marco & Associados';
    const inicioId = uid(), planosId = uid(), contatoId = uid();
    const pages = [
      page('Início', 'inicio', [
        bannerCarousel(t, contatoId, 'Agendar conversa', [
          { bg: '#15314f', eyebrow: 'CONTÁBIL', title: 'Sua contabilidade em ordem', desc: 'Obrigações em dia e impostos otimizados.' },
          { bg: '#1f4068', eyebrow: 'GESTÃO', title: 'Decisões com base em dados', desc: 'Indicadores e relatórios em tempo real.' },
          { bg: '#0f2540', eyebrow: 'JURÍDICO', title: 'Segurança em cada contrato', desc: 'Apoio societário e compliance.' },
        ]),
        statsBand(t, [{ num: '18 anos', label: 'Experiência' }, { num: '+250', label: 'Empresas' }, { num: '4.9★', label: 'Avaliação' }, { num: '96%', label: 'Retenção' }]),
        servicesGrid(t, 'Áreas de atuação', 'Soluções sob medida para sua empresa.', [
          { icon: '📑', title: 'Contábil & Tributário', desc: 'Escrituração, impostos e planejamento.' },
          { icon: '📊', title: 'Gestão & Planejamento', desc: 'Indicadores e tomada de decisão.' },
          { icon: '⚖️', title: 'Jurídico', desc: 'Contratos, societário e compliance.' },
        ]),
        pricing(t, contatoId, 'Planos de assessoria', 'Mensalidades transparentes, sem surpresas.', [
          { name: 'MEI / Autônomo', price: 'R$ 199', per: 'por mês', features: ['Contabilidade essencial', 'Impostos calculados', 'Suporte por e-mail'], cta: 'Começar' },
          { name: 'Pequena Empresa', price: 'R$ 549', per: 'por mês', features: ['Contábil + fiscal', 'Folha de pagamento', 'Relatórios mensais', 'Consultor dedicado'], highlight: true, cta: 'Mais popular' },
          { name: 'Empresarial', price: 'Sob consulta', per: 'personalizado', features: ['Tudo do anterior', 'Planejamento tributário', 'BI e gestão'], cta: 'Falar com time' },
        ]),
        faq(t, 'Perguntas frequentes', [
          { q: 'Vocês atendem todo o Brasil?', a: 'Sim, atendemos de forma 100% digital em todo o país.' },
          { q: 'Como faço a troca de contador?', a: 'Cuidamos de toda a migração para você, sem dor de cabeça.' },
          { q: 'Posso cancelar quando quiser?', a: 'Sim, sem fidelidade ou multa.' },
        ]),
        ctaBand(t, contatoId, 'Fale com um consultor', 'Primeira conversa sem compromisso.', 'Agendar agora'),
        footer(t, name),
      ], inicioId),
      page('Planos', 'planos', [
        pricing(t, contatoId, 'Escolha seu plano', 'Tudo o que sua empresa precisa, com preço justo.', [
          { name: 'MEI / Autônomo', price: 'R$ 199', per: 'por mês', features: ['Contabilidade essencial', 'Impostos calculados', 'Suporte por e-mail'], cta: 'Começar' },
          { name: 'Pequena Empresa', price: 'R$ 549', per: 'por mês', features: ['Contábil + fiscal', 'Folha de pagamento', 'Relatórios mensais', 'Consultor dedicado'], highlight: true, cta: 'Mais popular' },
          { name: 'Empresarial', price: 'Sob consulta', per: 'personalizado', features: ['Planejamento tributário', 'BI e gestão', 'Atendimento prioritário'], cta: 'Falar com time' },
        ]),
        faq(t, 'Ainda com dúvidas?', [
          { q: 'O que está incluso na mensalidade?', a: 'Todas as obrigações do plano escolhido, sem taxas escondidas.' },
          { q: 'Tem custo de implantação?', a: 'A migração é gratuita para novos clientes.' },
        ]),
        footer(t, name),
      ], planosId),
      page('Contato', 'contato', [ contactForm(t, 'Agende sua conversa', 'Um consultor entrará em contato.'), footer(t, name) ], contatoId),
    ];
    return withHeader(t, name, pages, 'Falar agora', contatoId);
  }

  if (templateId === 'lar-b') {
    const t = LAR, name = 'CasaPronta Serviços';
    const inicioId = uid(), planosId = uid(), contatoId = uid();
    const pages = [
      page('Início', 'inicio', [
        bannerCarousel(t, contatoId, 'Pedir orçamento', [
          { bg: '#0d9488', eyebrow: 'REFORMAS', title: 'Sua casa renovada sem stress', desc: 'Profissionais verificados e prazo combinado.' },
          { bg: '#0f766e', eyebrow: 'GARANTIA', title: 'Serviço com garantia real', desc: 'Refazemos se algo não ficar perfeito.' },
          { bg: '#f97316', eyebrow: 'RÁPIDO', title: 'Orçamento em até 24h', desc: 'Você pede, a gente resolve.' },
        ]),
        statsBand(t, [{ num: '+5.000', label: 'Serviços' }, { num: '4.9★', label: 'Nota' }, { num: '12 anos', label: 'Experiência' }, { num: '24h', label: 'Resposta' }]),
        gallery(t, 'Antes & depois', 'Resultados reais dos nossos serviços.', [
          { img: 'https://placehold.co/600x400/0d9488/ffffff?text=Cozinha', caption: 'Reforma de cozinha' },
          { img: 'https://placehold.co/600x400/0f766e/ffffff?text=Banheiro', caption: 'Banheiro renovado' },
          { img: 'https://placehold.co/600x400/f97316/ffffff?text=Pintura', caption: 'Pintura completa' },
          { img: 'https://placehold.co/600x400/115e59/ffffff?text=Eletrica', caption: 'Quadro elétrico' },
          { img: 'https://placehold.co/600x400/14b8a6/ffffff?text=Sala', caption: 'Sala modernizada' },
        ]),
        pricing(t, contatoId, 'Pacotes de serviço', 'Preços de partida — orçamento final sem compromisso.', [
          { name: 'Reparos', price: 'R$ 120', per: 'visita', features: ['Pequenos reparos', 'Mão de obra', 'Avaliação no local'], cta: 'Pedir' },
          { name: 'Reforma', price: 'R$ 1.5k', per: 'a partir de', features: ['Projeto + execução', 'Material opcional', 'Garantia de 90 dias'], highlight: true, cta: 'Mais pedido' },
          { name: 'Mensal', price: 'R$ 350', per: 'por mês', features: ['Manutenção preventiva', 'Atendimento prioritário', 'Pequenos reparos inclusos'], cta: 'Assinar' },
        ]),
        faq(t, 'Perguntas frequentes', [
          { q: 'O orçamento é cobrado?', a: 'Não, o orçamento é gratuito e sem compromisso.' },
          { q: 'Os profissionais são confiáveis?', a: 'Todos são verificados, avaliados e identificados.' },
          { q: 'Tem garantia?', a: 'Sim, todos os serviços têm garantia.' },
        ]),
        ctaBand(t, contatoId, 'Precisa de um profissional?', 'Resposta rápida, sem compromisso.', 'Pedir orçamento'),
        footer(t, name),
      ], inicioId),
      page('Serviços', 'servicos', [
        servicesGrid(t, 'O que fazemos', 'Escolha o serviço e peça seu orçamento.', [
          { icon: '🔧', title: 'Reformas', desc: 'Pisos, alvenaria, gesso e acabamentos.' },
          { icon: '⚡', title: 'Elétrica', desc: 'Instalações e manutenção.' },
          { icon: '🚿', title: 'Hidráulica', desc: 'Vazamentos e reparos.' },
          { icon: '🎨', title: 'Pintura', desc: 'Interna, externa e texturas.' },
          { icon: '🧹', title: 'Limpeza', desc: 'Pós-obra e pesada.' },
          { icon: '❄️', title: 'Ar-condicionado', desc: 'Instalação e manutenção.' },
        ], 3),
        faq(t, 'Dúvidas comuns', [
          { q: 'Vocês fornecem material?', a: 'Sim, opcionalmente. Você escolhe se prefere fornecer.' },
          { q: 'Atendem fins de semana?', a: 'Sim, com agendamento prévio.' },
        ]),
        footer(t, name),
      ], planosId),
      page('Contato', 'contato', [ contactForm(t, 'Peça seu orçamento', 'Descreva o serviço e retornamos rapidinho.'), footer(t, name) ], contatoId),
    ];
    return withHeader(t, name, pages, 'Pedir orçamento', contatoId);
  }

  if (templateId === 'autoescola-b') {
    const t = AUTOESCOLA, name = 'Auto Escola Direção';
    const inicioId = uid(), cursosId = uid(), matriculaId = uid();
    const pages = [
      page('Início', 'inicio', [
        bannerCarousel(t, matriculaId, 'Fazer matrícula', [
          { bg: '#0b2942', eyebrow: 'PRIMEIRA HABILITAÇÃO', title: 'Sua CNH começa aqui', desc: 'Turmas teóricas e aulas práticas com instrutores experientes.' },
          { bg: '#1d4ed8', eyebrow: 'CATEGORIA A E B', title: 'Moto e carro com aprovação alta', desc: 'A maior taxa de aprovação da região.' },
          { bg: '#f59e0b', eyebrow: 'PROFISSIONAL', title: 'Categorias C, D e E', desc: 'Profissionalize-se e dirija para trabalhar.' },
        ]),
        statsBand(t, [{ num: '+8.000', label: 'Formados' }, { num: '92%', label: 'Aprovação' }, { num: '14 anos', label: 'De estrada' }, { num: '4.9★', label: 'Avaliação' }]),
        gallery(t, 'Nossa estrutura', 'Frota nova e salas equipadas para você aprender melhor.', [
          { img: 'https://placehold.co/600x400/1d4ed8/ffffff?text=Frota', caption: 'Carros novos para prática' },
          { img: 'https://placehold.co/600x400/0b2942/ffffff?text=Motos', caption: 'Pista de moto exclusiva' },
          { img: 'https://placehold.co/600x400/f59e0b/ffffff?text=Sala', caption: 'Salas de aula teórica' },
          { img: 'https://placehold.co/600x400/1e3a8a/ffffff?text=Simulador', caption: 'Simulador de direção' },
        ]),
        servicesGrid(t, 'Nossos cursos', 'Categorias para todos os perfis de condutor.', [
          { icon: '🏍️', title: 'Categoria A', desc: 'Motos e ciclomotores.' },
          { icon: '🚗', title: 'Categoria B', desc: 'Carros de passeio.' },
          { icon: '🚚', title: 'C, D e E', desc: 'Caminhão, ônibus e carreta.' },
        ]),
        faq(t, 'Perguntas frequentes', [
          { q: 'Quais documentos preciso?', a: 'RG, CPF e comprovante de residência. O resto a gente orienta.' },
          { q: 'Posso parcelar?', a: 'Sim, oferecemos parcelamento facilitado.' },
          { q: 'Quanto tempo leva o processo?', a: 'Em média de 2 a 3 meses, conforme agenda de exames.' },
        ]),
        ctaBand(t, matriculaId, 'Comece sua matrícula hoje', 'Vagas abertas com condições especiais.', 'Quero me matricular'),
        footer(t, name),
      ], inicioId),
      page('Cursos', 'cursos', [
        servicesGrid(t, 'Categorias', 'Cada categoria com turma teórica e aulas práticas.', [
          { icon: '🏍️', title: 'Categoria A', desc: 'Motocicletas e ciclomotores.' },
          { icon: '🚗', title: 'Categoria B', desc: 'Automóveis até 3.500 kg.' },
          { icon: '🚙', title: 'Categoria AB', desc: 'Moto e carro juntos.' },
          { icon: '🚚', title: 'Categoria C', desc: 'Veículos de carga.' },
          { icon: '🚌', title: 'Categoria D', desc: 'Transporte de passageiros.' },
          { icon: '🚛', title: 'Categoria E', desc: 'Carreta / combinação.' },
        ], 3),
        faq(t, 'Dúvidas sobre os cursos', [
          { q: 'As aulas práticas têm horário flexível?', a: 'Sim, você agenda conforme sua disponibilidade.' },
          { q: 'E se eu reprovar?', a: 'Damos suporte e reagendamos até a aprovação.' },
        ]),
        footer(t, name),
      ], cursosId),
      page('Matrícula', 'matricula', [
        enrollForm(t, 'Ficha de matrícula', 'Preencha seus dados. Nossa equipe confirma sua vaga e os próximos passos.'),
        footer(t, name),
      ], matriculaId),
    ];
    return withHeader(t, name, pages, 'Matricule-se', matriculaId);
  }


  if (templateId === 'clinica') {
    const t = CLINICA, name = 'Clínica Vida';
    const inicioId = uid(), especialidadesId = uid(), agendarId = uid();
    const ids = { primary: agendarId, secondary: especialidadesId };
    const pages = [
      page('Início', 'inicio', [
        hero(t, ids, { eyebrow: 'SAÚDE E BEM-ESTAR', title: 'Cuidado completo para você e sua família.', subtitle: 'Equipe especializada, estrutura moderna e atendimento humano. Agende sua consulta em minutos.', primary: 'Agendar consulta', secondary: 'Ver especialidades' }),
        trustLogos(t, 'CREDENCIAIS E CONFIANÇA', ['CRM ativo', '★ 4.9', '+15 anos', 'Convênios', 'Exames no local']),
        statsBand(t, [{ num: '+30.000', label: 'Atendimentos' }, { num: '15 anos', label: 'De história' }, { num: '4.9★', label: 'Satisfação' }, { num: '12', label: 'Especialidades' }]),
        servicesGrid(t, 'Especialidades', 'Atendimento integrado em um só lugar.', [
          { icon: '🩺', title: 'Clínico Geral', desc: 'Avaliação completa e acompanhamento contínuo.' },
          { icon: '👶', title: 'Pediatria', desc: 'Cuidado dedicado para crianças e bebês.' },
          { icon: '❤️', title: 'Cardiologia', desc: 'Check-up cardíaco e exames especializados.' },
        ]),
        processSteps(t, 'Como agendar', [{ n: '01', title: 'Escolha', desc: 'Selecione a especialidade desejada.' }, { n: '02', title: 'Solicite', desc: 'Preencha o formulário com seus dados.' }, { n: '03', title: 'Confirmação', desc: 'Nossa equipe confirma data e horário.' }]),
        testimonial(t, { stars: '★★★★★', quote: 'Atendimento atencioso do começo ao fim. Marquei pelo site e fui atendido no mesmo dia.', author: 'Helena Costa', role: 'Paciente' }),
        faq(t, 'Perguntas frequentes', [
          { q: 'Vocês atendem convênios?', a: 'Sim, trabalhamos com os principais convênios. Confirme no agendamento.' },
          { q: 'Fazem exames no local?', a: 'Sim, contamos com coleta e exames laboratoriais na própria clínica.' },
          { q: 'Como remarco minha consulta?', a: 'É só entrar em contato que reagendamos sem custo.' },
        ]),
        ctaBand(t, agendarId, 'Cuide da sua saúde hoje', 'Agende sua consulta de forma rápida e segura.', 'Agendar agora'),
        footer(t, name),
      ], inicioId),
      page('Especialidades', 'especialidades', [
        hero(t, ids, { eyebrow: 'ESPECIALIDADES', title: 'Atendimento completo em diversas áreas.', subtitle: 'Profissionais experientes prontos para cuidar de você.', primary: 'Agendar consulta', secondary: 'Início' }),
        servicesGrid(t, 'O que oferecemos', 'Da prevenção ao acompanhamento especializado.', [
          { icon: '🩺', title: 'Clínico Geral', desc: 'Consultas e check-ups completos.' },
          { icon: '👶', title: 'Pediatria', desc: 'Saúde da criança em todas as fases.' },
          { icon: '❤️', title: 'Cardiologia', desc: 'Eletrocardiograma e avaliação cardíaca.' },
          { icon: '🧴', title: 'Dermatologia', desc: 'Pele, cabelo e procedimentos.' },
          { icon: '🥗', title: 'Nutrição', desc: 'Planos alimentares personalizados.' },
          { icon: '🧠', title: 'Psicologia', desc: 'Terapia e acompanhamento emocional.' },
        ], 3),
        benefits(t, 'Por que a Clínica Vida', ['Profissionais credenciados', 'Estrutura moderna e confortável', 'Exames laboratoriais no local', 'Agendamento rápido pelo site']),
        ctaBand(t, agendarId, 'Pronto para se cuidar?', 'Escolha a especialidade e agende em minutos.', 'Agendar consulta'),
        footer(t, name),
      ], especialidadesId),
      page('Agendamento', 'agendamento', [
        objectForm(t, 'Agendamento', 'Agende sua consulta', 'Preencha seus dados e a equipe confirma data e horário.', 'agendamento', 'Solicitar agendamento', AGENDAMENTO_FIELDS),
        footer(t, name),
      ], agendarId),
    ];
    return withHeader(t, name, pages, 'Agendar consulta', agendarId);
  }

  if (templateId === 'imobiliaria') {
    const t = IMOBILIARIA, name = 'Imobiliária Central';
    const inicioId = uid(), imoveisId = uid(), contatoId = uid();
    const ids = { primary: contatoId, secondary: imoveisId };
    const pages = [
      page('Início', 'inicio', [
        hero(t, ids, { eyebrow: 'COMPRA · VENDA · ALUGUEL', title: 'O imóvel certo para o seu próximo capítulo.', subtitle: 'Atendimento personalizado e os melhores imóveis da região. Encontre o seu hoje mesmo.', primary: 'Falar com corretor', secondary: 'Ver imóveis' }),
        trustLogos(t, 'CREDIBILIDADE NO MERCADO', ['CRECI ativo', '★ 4.9', '+20 anos', '+1.200 imóveis', 'Atendimento local']),
        statsBand(t, [{ num: '+1.200', label: 'Imóveis no portfólio' }, { num: '20 anos', label: 'De mercado' }, { num: '+3.500', label: 'Famílias atendidas' }, { num: '4.9★', label: 'Avaliação' }]),
        servicesGrid(t, 'Imóveis em destaque', 'Uma seleção dos melhores imóveis disponíveis agora.', [
          { icon: '🏢', title: 'Apartamento 2Q — Centro', desc: '72m², 1 vaga, lazer completo · R$ 350.000' },
          { icon: '🏡', title: 'Casa 3Q — Jardim Sul', desc: '180m², quintal e garagem · R$ 690.000' },
          { icon: '🏬', title: 'Sala comercial — Av. Brasil', desc: '45m², ótima localização · R$ 2.200/mês' },
        ]),
        processSteps(t, 'Como funciona', [{ n: '01', title: 'Conte o que procura', desc: 'Tipo, região e faixa de preço.' }, { n: '02', title: 'Seleção sob medida', desc: 'Indicamos os imóveis ideais para você.' }, { n: '03', title: 'Visita e negociação', desc: 'Agendamos visitas e cuidamos da documentação.' }]),
        testimonial(t, { stars: '★★★★★', quote: 'Encontraram exatamente o apartamento que eu queria e cuidaram de toda a papelada. Excelente!', author: 'Bruno Tavares', role: 'Comprou no Centro' }),
        faq(t, 'Perguntas frequentes', [
          { q: 'Vocês ajudam com financiamento?', a: 'Sim, orientamos em todo o processo de financiamento e documentação.' },
          { q: 'Quero anunciar meu imóvel. Como faço?', a: 'Selecione "Anunciar imóvel" no formulário e nossa equipe avalia gratuitamente.' },
          { q: 'Cobram taxa de visita?', a: 'Não, as visitas são gratuitas e sem compromisso.' },
        ]),
        ctaBand(t, contatoId, 'Vamos encontrar seu imóvel?', 'Fale com um corretor e receba opções sob medida.', 'Falar com corretor'),
        footer(t, name),
      ], inicioId),
      page('Imóveis', 'imoveis', [
        hero(t, ids, { eyebrow: 'PORTFÓLIO', title: 'Imóveis para comprar e alugar.', subtitle: 'Apartamentos, casas e salas comerciais nas melhores regiões.', primary: 'Tenho interesse', secondary: 'Início' }),
        servicesGrid(t, 'Disponíveis agora', 'Confira alguns destaques do nosso portfólio.', [
          { icon: '🏢', title: 'Apartamento 2Q — Centro', desc: '72m², 1 vaga · R$ 350.000' },
          { icon: '🏡', title: 'Casa 3Q — Jardim Sul', desc: '180m², garagem · R$ 690.000' },
          { icon: '🏘️', title: 'Cobertura — Beira Mar', desc: '140m², vista mar · R$ 1.250.000' },
          { icon: '🏬', title: 'Sala comercial — Av. Brasil', desc: '45m² · R$ 2.200/mês' },
          { icon: '🏠', title: 'Casa 2Q — Vila Nova', desc: '90m², quintal · R$ 1.800/mês' },
          { icon: '🌆', title: 'Studio — Centro', desc: '32m², mobiliado · R$ 1.500/mês' },
        ], 3),
        benefits(t, 'Por que a Imobiliária Central', ['Corretores credenciados (CRECI)', 'Apoio em financiamento e documentação', 'Visitas gratuitas e sem compromisso', 'Avaliação gratuita do seu imóvel']),
        ctaBand(t, contatoId, 'Achou algo interessante?', 'Deixe seus dados e um corretor entra em contato.', 'Tenho interesse'),
        footer(t, name),
      ], imoveisId),
      page('Contato', 'contato', [
        objectForm(t, 'Contato', 'Fale com um corretor', 'Conte o que procura (ou o que quer anunciar) e retornamos rapidinho.', 'lead', 'Enviar', LEAD_FIELDS),
        footer(t, name),
      ], contatoId),
    ];
    return withHeader(t, name, pages, 'Falar com corretor', contatoId);
  }

  // blank
  return [{ id: uid(), name: 'Página 1', slug: 'pagina-1', sections: [] }];
}
