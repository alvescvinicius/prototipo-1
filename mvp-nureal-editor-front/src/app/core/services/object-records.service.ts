import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ObjectRecord {
  id:          string;
  user_id:     string;
  project_id:  string | null;
  object_name: string;
  data:        Record<string, string>;
  created_at:  string;
  updated_at:  string;
}

@Injectable({ providedIn: 'root' })
export class ObjectRecordsService {

  constructor(private supa: SupabaseService) {}

  /** Inserir registro — chamado da página pública (sem auth) */
  async create(
    userId:     string,    // user_id do dono do objeto (passado no form config)
    projectId:  string,
    objectName: string,
    data:       Record<string, string>
  ): Promise<ObjectRecord | null> {
    const { data: record, error } = await this.supa.client
      .from('object_records')
      .insert({ user_id: userId, project_id: projectId, object_name: objectName, data })
      .select().single();
    if (error) { console.error('[ObjectRecords]', error); return null; }
    return record as ObjectRecord;
  }

  /** Listar registros de um objeto — dashboard (auth obrigatório) */
  async listByObject(objectName: string): Promise<ObjectRecord[]> {
    const { data, error } = await this.supa.client
      .from('object_records')
      .select('*')
      .eq('object_name', objectName)
      .order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []) as ObjectRecord[];
  }

  async listByProject(projectId: string, objectName?: string): Promise<ObjectRecord[]> {
    let q = this.supa.client
      .from('object_records').select('*')
      .eq('project_id', projectId);
    if (objectName) q = q.eq('object_name', objectName);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return (data ?? []) as ObjectRecord[];
  }

  async delete(id: string): Promise<void> {
    await this.supa.client.from('object_records').delete().eq('id', id);
  }

  async update(id: string, data: Record<string, string>): Promise<void> {
    await this.supa.client
      .from('object_records')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', id);
  }
}
