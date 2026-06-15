import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService }     from './auth.service';
import { NurealObject, ObjectField } from '../interfaces/nureal-object';

@Injectable({ providedIn: 'root' })
export class NurealObjectsService {

  objects = signal<NurealObject[]>([]);
  loading = signal(false);

  constructor(private supa: SupabaseService, private auth: AuthService) {}

  async loadAll(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    this.loading.set(true);
    const { data, error } = await this.supa.client
      .from('nureal_objects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (!error) this.objects.set((data ?? []) as NurealObject[]);
    this.loading.set(false);
  }

  async create(name: string, label: string): Promise<NurealObject | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;
    const { data, error } = await this.supa.client
      .from('nureal_objects')
      .insert({ user_id: userId, name, label, fields: [] })
      .select().single();
    if (error) { console.error(error); return null; }
    const obj = data as NurealObject;
    this.objects.update(list => [...list, obj]);
    return obj;
  }

  async update(id: string, patch: Partial<Pick<NurealObject, 'label' | 'fields'>>): Promise<void> {
    const { error } = await this.supa.client
      .from('nureal_objects')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { console.error(error); return; }
    this.objects.update(list =>
      list.map(o => o.id === id ? { ...o, ...patch } : o)
    );
  }

  async delete(id: string): Promise<void> {
    await this.supa.client.from('nureal_objects').delete().eq('id', id);
    this.objects.update(list => list.filter(o => o.id !== id));
  }

  getByName(name: string): NurealObject | undefined {
    return this.objects().find(o => o.name === name);
  }
}
