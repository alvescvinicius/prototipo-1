import { Injectable } from '@angular/core';

import { Section } from '../interfaces/section';

export interface SavedProject {
  version:   number;
  savedAt:   string;
  projectName: string;
  sections:  Section[];
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly KEY     = 'nureal_editor_project';
  private readonly VERSION = 1;

  // ─── Salvar ──────────────────────────────────────────────────

  save(sections: Section[], projectName = 'Minha Aplicação'): void {
    const payload: SavedProject = {
      version:     this.VERSION,
      savedAt:     new Date().toISOString(),
      projectName,
      sections
    };

    try {
      localStorage.setItem(this.KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[StorageService] Falha ao salvar:', e);
    }
  }

  // ─── Carregar ────────────────────────────────────────────────

  load(): SavedProject | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as SavedProject;

      if (parsed.version !== this.VERSION) {
        console.warn('[StorageService] Versão incompatível, ignorando dados salvos.');
        return null;
      }

      return parsed;
    } catch (e) {
      console.warn('[StorageService] Falha ao carregar:', e);
      return null;
    }
  }

  // ─── Limpar ──────────────────────────────────────────────────

  clear(): void {
    localStorage.removeItem(this.KEY);
  }

  // ─── Metadata ────────────────────────────────────────────────

  hasSavedData(): boolean {
    return localStorage.getItem(this.KEY) !== null;
  }

  getSavedAt(): Date | null {
    const data = this.load();
    if (!data) return null;
    return new Date(data.savedAt);
  }

}
