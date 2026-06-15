import { Injectable } from '@angular/core';

import { Section } from '../interfaces/section';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  private past:   string[] = [];
  private future: string[] = [];

  private readonly MAX_HISTORY = 50;

  // ─── Snapshot ────────────────────────────────────────────────

  snapshot(sections: Section[]): void {
    this.past.push(this._serialize(sections));

    if (this.past.length > this.MAX_HISTORY) {
      this.past.shift();
    }

    // qualquer nova ação limpa o futuro
    this.future = [];
  }

  // ─── Undo ────────────────────────────────────────────────────

  undo(current: Section[]): Section[] | null {
    if (!this.canUndo) return null;

    this.future.push(this._serialize(current));
    const prev = this.past.pop()!;

    return this._deserialize(prev);
  }

  // ─── Redo ────────────────────────────────────────────────────

  redo(current: Section[]): Section[] | null {
    if (!this.canRedo) return null;

    this.past.push(this._serialize(current));
    const next = this.future.pop()!;

    return this._deserialize(next);
  }

  // ─── Estado ──────────────────────────────────────────────────

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get historySize(): number {
    return this.past.length;
  }

  clear(): void {
    this.past   = [];
    this.future = [];
  }

  // ─── Serialização ────────────────────────────────────────────

  private _serialize(sections: Section[]): string {
    return JSON.stringify(sections);
  }

  private _deserialize(raw: string): Section[] {
    return JSON.parse(raw) as Section[];
  }

}
