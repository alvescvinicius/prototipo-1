import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService }     from './auth.service';
import { ExportService }   from './export.service';
import { Section }         from '../interfaces/section';

@Injectable({ providedIn: 'root' })
export class PublishService {

  constructor(
    private supa:   SupabaseService,
    private auth:   AuthService,
    private exportSvc: ExportService
  ) {}

  async publishProject(
    projectId: string,
    projectName: string,
    sections: Section[]
  ): Promise<string | null> {

    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const html  = this._buildHtml(sections, projectName);
    const path  = `${userId}/${projectId}/index.html`;
    const bytes = new TextEncoder().encode(html);

    const { error } = await this.supa.client.storage
      .from('published-sites')
      .upload(path, bytes, {
        contentType: 'text/html',
        upsert: true
      });

    if (error) { console.error('[PublishService]', error); return null; }

    const { data } = this.supa.client.storage
      .from('published-sites')
      .getPublicUrl(path);

    const publicUrl = data.publicUrl;

    // Salvar URL no projeto
    await this.supa.client
      .from('projects')
      .update({ is_published: true, published_url: publicUrl, slug: this._slugify(projectName) })
      .eq('id', projectId);

    return publicUrl;
  }

  async unpublishProject(projectId: string, userId: string): Promise<void> {
    await this.supa.client.storage
      .from('published-sites')
      .remove([`${userId}/${projectId}/index.html`]);

    await this.supa.client
      .from('projects')
      .update({ is_published: false, published_url: null })
      .eq('id', projectId);
  }

  private _buildHtml(sections: Section[], name: string): string {
    // Reutiliza o ExportService existente
    return (this.exportSvc as any)._buildFullDocument(sections, name);
  }

  private _slugify(str: string): string {
    return str.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

}
