import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService }     from './auth.service';
import { ExportService }   from './export.service';
import { Page }            from '../interfaces/page';

export interface PublishResult {
  projectUrl: string;          // /p/{slug}
  pageUrls: { name: string; url: string }[];
}

@Injectable({ providedIn: 'root' })
export class PublishService {

  constructor(
    private supa:      SupabaseService,
    private auth:      AuthService,
    private exportSvc: ExportService
  ) {}

  async publishProject(
    projectId:   string,
    projectName: string,
    pages:       Page[]
  ): Promise<PublishResult | null> {

    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const slug = this._slugify(projectName);

    // Atualizar cada página com seu slug
    const pagesWithSlug: Page[] = pages.map(p => ({
      ...p,
      slug: p.slug ?? this._slugify(p.name)
    }));

    // Buscar currentPageId atual antes de sobrescrever
    const { data: existing } = await this.supa.client
      .from('projects').select('data').eq('id', projectId).single();
    const currentPageId = existing?.data?.currentPageId ?? pagesWithSlug[0]?.id ?? '';

    // Atualizar project no Supabase: slug, is_published, published_url, data.pages com slugs
    const { error } = await this.supa.client
      .from('projects')
      .update({
        slug,
        is_published:  true,
        published_url: `/p/${slug}`,
        data: { pages: pagesWithSlug, currentPageId }
      })
      .eq('id', projectId);

    if (error) { console.error('[PublishService]', error); return null; }

    const pageUrls = pagesWithSlug.map(p => ({
      name: p.name,
      url:  `/p/${slug}/${p.slug}`
    }));

    return {
      projectUrl: `/p/${slug}`,
      pageUrls
    };
  }

  async unpublishProject(projectId: string): Promise<void> {
    await this.supa.client
      .from('projects')
      .update({ is_published: false, published_url: null })
      .eq('id', projectId);
  }

  private _slugify(str: string): string {
    return str.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}
