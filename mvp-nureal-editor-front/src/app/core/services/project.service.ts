import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService }     from './auth.service';
import { Project }         from '../interfaces/project';
import { Page }            from '../interfaces/page';

const FREE_LIMIT = 2;

@Injectable({ providedIn: 'root' })
export class ProjectService {

  constructor(
    private supa: SupabaseService,
    private auth: AuthService
  ) {}

  // ── List ─────────────────────────────────────────────────

  async listProjects(): Promise<Project[]> {
    const userId = this.auth.user()?.id;
    if (!userId) return [];
    const { data, error } = await this.supa.client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return data as Project[];
  }

  // ── Get ──────────────────────────────────────────────────

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await this.supa.client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) { console.error(error); return null; }
    return data as Project;
  }

  // ── Create ───────────────────────────────────────────────

  async createProject(name = 'Minha Aplicacao'): Promise<Project | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    // Limit free plan
    const profile = this.auth.profile();
    if (profile?.plan === 'free') {
      const existing = await this.listProjects();
      if (existing.length >= FREE_LIMIT) return null; // limite atingido
    }

    const homePage: Page = { id: crypto.randomUUID(), name: 'Pagina 1', sections: [] };
    const data = { pages: [homePage], currentPageId: homePage.id };

    const { data: project, error } = await this.supa.client
      .from('projects')
      .insert({ user_id: userId, name, data })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    return project as Project;
  }

  // ── Save ─────────────────────────────────────────────────

  async saveProject(
    id: string,
    name: string,
    pages: Page[],
    currentPageId: string
  ): Promise<void> {
    const { error } = await this.supa.client
      .from('projects')
      .update({ name, data: { pages, currentPageId } })
      .eq('id', id);
    if (error) console.error('[ProjectService] save error:', error);
  }

  // ── Delete ───────────────────────────────────────────────

  async deleteProject(id: string): Promise<void> {
    await this.supa.client.from('projects').delete().eq('id', id);
  }

  // ── Rename ───────────────────────────────────────────────

  async renameProject(id: string, name: string): Promise<void> {
    await this.supa.client.from('projects').update({ name }).eq('id', id);
  }

  // ── Get by slug ──────────────────────────────────────────

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const { data, error } = await this.supa.client
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    if (error) { console.error(error); return null; }
    return data as Project;
  }

  // ── Slug ─────────────────────────────────────────────────

  slugify(str: string): string {
    return str.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // ── Plan helpers ─────────────────────────────────────────

  get isFreeLimitReached(): boolean {
    return false; // avaliado de forma async em createProject()
  }
}
