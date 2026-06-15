import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { ComponentType } from '../../../core/enums/component-type.enum';
import { PageComponent } from '../../../core/interfaces/page-component';
import { Section } from '../../../core/interfaces/section';

type StyleTab     = 'content' | 'typography' | 'spacing' | 'visual' | 'dimensions' | 'css';
type SectionTab   = 'visual' | 'dimensions';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent {

  public ComponentType = ComponentType;
  public activeTab: StyleTab   = 'content';
  public sectionTab: SectionTab = 'visual';

  public tabs: { id: StyleTab; label: string }[] = [
    { id: 'content',    label: 'Conteudo'   },
    { id: 'typography', label: 'Texto'       },
    { id: 'spacing',    label: 'Espacamento' },
    { id: 'visual',     label: 'Visual'      },
    { id: 'dimensions', label: 'Dimensoes'   },
    { id: 'css',        label: 'CSS'         },
  ];

  public sectionTabs: { id: SectionTab; label: string }[] = [
    { id: 'visual',     label: 'Visual'    },
    { id: 'dimensions', label: 'Dimensoes' },
  ];

  public fontWeightOptions = [
    { value: '300', label: 'Light'    },
    { value: '400', label: 'Regular'  },
    { value: '500', label: 'Medium'   },
    { value: '600', label: 'SemiBold' },
    { value: '700', label: 'Bold'     },
  ];

  public textAlignOptions = [
    { value: 'left',    label: '<-' },
    { value: 'center',  label: '|'  },
    { value: 'right',   label: '->' },
    { value: 'justify', label: '||' },
  ];

  public borderStyleOptions = [
    { value: 'solid',  label: 'Solida'     },
    { value: 'dashed', label: 'Tracejada'  },
    { value: 'dotted', label: 'Pontilhada' },
    { value: 'none',   label: 'Nenhuma'    },
  ];

  constructor(public editorState: EditorStateService) {}

  get selectedComponent(): PageComponent | null {
    const node = this.editorState.selectedNode;
    if (!node) return null;
    return 'config' in node && node.type !== ComponentType.SECTION
      ? node as PageComponent
      : null;
  }

  get selectedSection(): Section | null {
    const node = this.editorState.selectedNode;
    if (!node) return null;
    return node.type === ComponentType.SECTION ? node as Section : null;
  }

  get hasContentTab(): boolean {
    if (!this.selectedComponent) return false;
    const t = this.selectedComponent.type;
    return (
      t === ComponentType.TEXT     ||
      t === ComponentType.TITLE    ||
      t === ComponentType.BUTTON   ||
      t === ComponentType.IMAGE    ||
      t === ComponentType.INPUT    ||
      t === ComponentType.CHECKBOX ||
      t === ComponentType.SELECT   ||
      t === ComponentType.MENU     ||
      t === ComponentType.CARD     ||
      t === ComponentType.CAROUSEL ||
      t === ComponentType.ACCORDION ||
      t === ComponentType.GRID
    );
  }

  setTab(tab: StyleTab): void   { this.activeTab  = tab; }
  setSectionTab(t: SectionTab): void { this.sectionTab = t; }

  px(value: string | undefined): number | null {
    if (!value) return null;
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  setPx(
    obj: Record<string, string | undefined>,
    key: string,
    raw: number | string | null
  ): void {
    if (raw === null || raw === '' || raw === undefined) {
      obj[key] = undefined;
    } else {
      obj[key] = `${raw}px`;
    }
  }

}
