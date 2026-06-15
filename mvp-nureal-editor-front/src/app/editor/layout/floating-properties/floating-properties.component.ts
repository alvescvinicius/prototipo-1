import {
  Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { PropertiesComponent } from '../properties/properties.component';

@Component({
  selector: 'app-floating-properties',
  standalone: true,
  imports: [CommonModule, PropertiesComponent],
  templateUrl: './floating-properties.component.html',
  styleUrls: ['./floating-properties.component.scss'],
})
export class FloatingPropertiesComponent implements OnInit, OnDestroy {

  panelX = 0;
  panelY = 0;
  visible = false;

  private _checkTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    public editorState: EditorStateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Poll for changes (EditorStateService isn't signal-based for selectedNode)
    this._checkTimer = setInterval(() => this._sync(), 50);
  }

  ngOnDestroy(): void {
    if (this._checkTimer) clearInterval(this._checkTimer);
  }

  private _prevNode: unknown = null;
  private _prevPos: { x: number; y: number } | null = null;

  private _sync(): void {
    const node = this.editorState.selectedNode;
    const pos  = this.editorState.floatingPanelPos;

    const nodeChanged = node !== this._prevNode;
    const posChanged  = pos !== this._prevPos;

    if (nodeChanged || posChanged) {
      this._prevNode = node;
      this._prevPos  = pos;

      if (node && pos) {
        this._place(pos.x, pos.y);
        this.visible = true;
      } else {
        this.visible = false;
      }
      this.cdr.markForCheck();
    }
  }

  private _place(cx: number, cy: number): void {
    const W = 300;   // panel width
    const H = 480;   // estimated panel height
    const margin = 12;

    let x = cx + 16;
    let y = cy;

    // Clamp right edge
    if (x + W > window.innerWidth - margin) {
      x = cx - W - 16;
    }
    // Clamp bottom edge
    if (y + H > window.innerHeight - margin) {
      y = window.innerHeight - H - margin;
    }
    // Clamp top
    if (y < margin) y = margin;
    // Clamp left
    if (x < margin) x = margin;

    this.panelX = x;
    this.panelY = y;
  }

  close(): void {
    this.editorState.selectNode(null);
    this.visible = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.close(); }
}
