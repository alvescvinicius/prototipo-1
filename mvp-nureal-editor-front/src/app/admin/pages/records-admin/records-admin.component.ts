import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { NurealObjectsService } from '../../../core/services/nureal-objects.service';
import { ObjectRecordsService, ObjectRecord } from '../../../core/services/object-records.service';
import { AuthService } from '../../../core/services/auth.service';
import { NurealObject, ObjectField } from '../../../core/interfaces/nureal-object';

@Component({
  selector: 'app-records-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './records-admin.component.html',
  styleUrl: './records-admin.component.scss',
})
export class RecordsAdminComponent implements OnInit {

  selected: NurealObject | null = null;
  records  = signal<ObjectRecord[]>([]);
  loading  = signal(true);
  loadingRecords = signal(false);

  // Criar registro
  showCreate = false;
  saving     = signal(false);
  newRecord: Record<string, string> = {};

  constructor(
    public  objectsSvc: NurealObjectsService,
    private recordsSvc: ObjectRecordsService,
    private auth:       AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    await this.objectsSvc.loadAll();
    const list = this.objectsSvc.objects();
    this.selected = list.find(o => o.name === 'aluno') ?? list[0] ?? null;
    this.loading.set(false);
    if (this.selected) await this.loadRecords();
  }

  async selectObject(obj: NurealObject): Promise<void> {
    this.selected = obj;
    this.closeCreate();
    await this.loadRecords();
  }

  async loadRecords(): Promise<void> {
    if (!this.selected) { this.records.set([]); return; }
    this.loadingRecords.set(true);
    this.records.set(await this.recordsSvc.listByObject(this.selected.name));
    this.loadingRecords.set(false);
  }

  get fields(): ObjectField[] {
    return this.selected?.fields ?? [];
  }

  get statusField(): ObjectField | null {
    return this.fields.find(f => f.name === 'status' && f.type === 'select') ?? null;
  }

  /** Campos exibidos como colunas (status fica numa coluna própria editável). */
  get columnFields(): ObjectField[] {
    return this.fields.filter(f => f.name !== 'status');
  }

  cell(record: ObjectRecord, field: ObjectField): string {
    return record.data?.[field.name] ?? '';
  }

  options(field: ObjectField | null): string[] {
    if (!field?.options) return [];
    return field.options.split(',').map(s => s.trim()).filter(Boolean);
  }

  /** Mapeia o tipo do objeto para o type do <input> do HTML. */
  inputType(field: ObjectField): string {
    switch (field.type) {
      case 'email':  return 'email';
      case 'number': return 'number';
      case 'date':   return 'date';
      case 'phone':  return 'tel';
      default:       return 'text';
    }
  }

  async setStatus(record: ObjectRecord, value: string): Promise<void> {
    const data = { ...record.data, status: value };
    record.data = data;
    await this.recordsSvc.update(record.id, data);
  }

  async deleteRecord(record: ObjectRecord): Promise<void> {
    if (!confirm('Remover este cadastro? Esta ação não pode ser desfeita.')) return;
    await this.recordsSvc.delete(record.id);
    await this.loadRecords();
  }

  // ── Criar registro manualmente ────────────────────────────

  openCreate(): void {
    this.newRecord = {};
    // Pré-seleciona "Novo" no status, se existir
    if (this.statusField) this.newRecord['status'] = 'Novo';
    this.showCreate = true;
  }

  closeCreate(): void {
    if (this.saving()) return;
    this.showCreate = false;
  }

  get canSave(): boolean {
    return this.fields.filter(f => f.required).every(f => (this.newRecord[f.name] ?? '').trim() !== '');
  }

  async saveRecord(): Promise<void> {
    if (!this.selected || this.saving() || !this.canSave) return;
    this.saving.set(true);
    const userId = this.auth.user()?.id ?? '';
    const data: Record<string, string> = {};
    for (const f of this.fields) {
      const v = (this.newRecord[f.name] ?? '').trim();
      if (v) data[f.name] = v;
    }
    const rec = await this.recordsSvc.create(userId, null, this.selected.name, data);
    this.saving.set(false);
    if (rec) {
      this.showCreate = false;
      await this.loadRecords();
    } else {
      alert('Não foi possível salvar o cadastro. Tente novamente.');
    }
  }

  // ── Métricas simples ──────────────────────────────────────

  countByStatus(status: string): number {
    return this.records().filter(r => (r.data?.['status'] ?? '') === status).length;
  }

  get pendingCount(): number {
    if (!this.statusField) return 0;
    return this.records().filter(r => {
      const s = r.data?.['status'] ?? '';
      return s === '' || s === 'Novo';
    }).length;
  }

  formatDateTime(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('pt-BR');
  }

  exportCsv(): void {
    const recs = this.records();
    if (!recs.length || !this.selected) return;
    const cols = this.fields;
    const header = ['Data', ...cols.map(f => f.label)].join(',');
    const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const rows = recs.map(r =>
      [this.formatDateTime(r.created_at), ...cols.map(f => esc(r.data?.[f.name] ?? ''))].join(',')
    );
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${this.selected.name}-cadastros.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
