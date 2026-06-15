import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface FormSubmission {
  id:         string;
  project_id: string;
  page_id:    string;
  form_id:    string;
  data:       Record<string, string>;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class FormSubmissionsService {

  constructor(private supa: SupabaseService) {}

  /** Salva uma submissão — chamado da página pública (sem auth) */
  async submit(
    projectId: string,
    pageId:    string,
    formId:    string,
    data:      Record<string, string>
  ): Promise<boolean> {
    const { error } = await this.supa.client
      .from('form_submissions')
      .insert({ project_id: projectId, page_id: pageId, form_id: formId, data });
    if (error) { console.error('[FormSubmissions]', error); return false; }
    return true;
  }

  /** Lista submissões de um projeto — chamado do dashboard (auth obrigatório) */
  async listByProject(projectId: string): Promise<FormSubmission[]> {
    const { data, error } = await this.supa.client
      .from('form_submissions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) { console.error('[FormSubmissions]', error); return []; }
    return data as FormSubmission[];
  }

  async deleteSubmission(id: string): Promise<void> {
    await this.supa.client.from('form_submissions').delete().eq('id', id);
  }
}
