import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NurealObjectsService } from '../../../core/services/nureal-objects.service';
import { NurealObject, ObjectField, FieldType } from '../../../core/interfaces/nureal-object';
import { AuthService } from '../../../core/services/auth.service';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',     label: 'Texto' },
  { value: 'email',    label: 'Email' },
  { value: 'phone',    label: 'Telefone' },
  { value: 'number',   label: 'Número' },
  { value: 'textarea', label: 'Área de texto' },
  { value: 'boolean',  label: 'Sim/Não' },
  { value: 'date',     label: 'Data' },
  { value: 'select',   label: 'Seleção' },
];

@Component({
  selector: 'app-object-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './object-manager.component.html',
  styleUrl: './object-manager.component.scss'
})
export class ObjectManagerComponent implements OnInit {

  readonly fieldTypes = FIELD_TYPES;

  selectedObject: NurealObject | null = null;
  showNewObjectForm = false;
  newObjectName  = '';
  newObjectLabel = '';
  saving = signal(false);

  constructor(
    public  objectsSvc: NurealObjectsService,
    public  auth:       AuthService,
    private router:     Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.objectsSvc.loadAll();
    if (this.objectsSvc.objects().length > 0) {
      this.selectedObject = this.objectsSvc.objects()[0];
    }
  }

  selectObject(obj: NurealObject): void {
    this.selectedObject = { ...obj, fields: obj.fields.map(f => ({ ...f })) };
  }

  // ── Criar objeto ──────────────────────────────────────

  async createObject(): Promise<void> {
    const name  = this.newObjectName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const label = this.newObjectLabel.trim();
    if (!name || !label) return;
    this.saving.set(true);
    const obj = await this.objectsSvc.create(name, label);
    this.saving.set(false);
    if (obj) {
      this.showNewObjectForm = false;
      this.newObjectName  = '';
      this.newObjectLabel = '';
      this.selectedObject = { ...obj };
    }
  }

  async deleteObject(id: string): Promise<void> {
    if (!confirm('Excluir este objeto? Registros existentes NÃO serão removidos.')) return;
    await this.objectsSvc.delete(id);
    this.selectedObject = this.objectsSvc.objects()[0] ?? null;
  }

  // ── Campos ──────────────────────────────────────────

  addField(): void {
    if (!this.selectedObject) return;
    const field: ObjectField = {
      id:       crypto.randomUUID(),
      name:     'campo_' + (this.selectedObject.fields.length + 1),
      label:    'Campo ' + (this.selectedObject.fields.length + 1),
      type:     'text',
      required: false,
    };
    this.selectedObject = { ...this.selectedObject, fields: [...this.selectedObject.fields, field] };
  }

  removeField(fieldId: string): void {
    if (!this.selectedObject) return;
    this.selectedObject = {
      ...this.selectedObject,
      fields: this.selectedObject.fields.filter(f => f.id !== fieldId)
    };
  }

  onFieldNameChange(field: ObjectField): void {
    field.name = field.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }

  async saveObject(): Promise<void> {
    if (!this.selectedObject) return;
    this.saving.set(true);
    await this.objectsSvc.update(this.selectedObject.id, {
      label:  this.selectedObject.label,
      fields: this.selectedObject.fields,
    });
    this.saving.set(false);
  }

  goToDashboard(): void { this.router.navigate(['/dashboard']); }
}
