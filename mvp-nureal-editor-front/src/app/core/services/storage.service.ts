import { Injectable } from '@angular/core';

import { Page } from '../interfaces/page';

export interface SavedProject {
  version:       number;
  savedAt:       string;
  projectName:   string;
  pages:         Page[];
  currentPageId: string;
}

@Injectable({ providedIn: 'root' })
export class StorageService {

  private readonly KEY     = 'nureal_editor_project';
  private readonly VERSION = 2;

  save(pages: Page[], currentPageId: string, projectName = 'Minha Aplicação'): void {
    const payload: SavedProject = {
      version: this.VERSION,
      savedAt: new Date().toISOString(),
      projectName,
      pages,
      currentPageId
    };
    try {
      localStorage.setItem(this.KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('[StorageService] Falha ao salvar:', e);
    }
  }

  load(): SavedProject | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as any;

      // Migração v1 → v2
      if (parsed.version === 1) {
        const home: Page = { id: crypto.randomUUID(), name: 'Pagina 1', sections: parsed.sections ?? [] };
        return {
          version:       2,
          savedAt:       parsed.savedAt,
          projectName:   parsed.projectName,
          pages:         [home],
          currentPageId: home.id
        };
      }

      if (parsed.version !== this.VERSION) {
        console.warn('[StorageService] Versão incompatível.');
        return null;
      }

      return parsed as SavedProject;
    } catch (e) {
      console.warn('[StorageService] Falha ao carregar:', e);
      return null;
    }
  }

  clear(): void { localStorage.removeItem(this.KEY); }

  hasSavedData(): boolean { return localStorage.getItem(this.KEY) !== null; }
}

