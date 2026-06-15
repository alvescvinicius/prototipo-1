import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EditorStateService } from '../../../core/services/editor-state.service';
import { ComponentType } from '../../../core/enums/component-type.enum';
import { PageComponent } from '../../../core/interfaces/page-component';

type StyleTab = 'content' | 'typography' | 'spacing' | 'visual' | 'dimensions';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent {

  public ComponentType = ComponentType;
  public activeTab: StyleTab = 'content';

  public tabs: { id: StyleTab; label: string }[] = [
    { id: 'content',    label: 'Conteúdo'   },
    { id: 'typography', label: 'Texto'       },
    { id: 'spacing',    label: 'Espaçamento' },
    { id: 'visual',     label: 'Visual'      },
    { id: 'dimensions', label: 'Dimensões'   },
  ];

  public fontWeightOptions = [
    { value: '300', label: 'Light'    },
    { value: '400', label: 'Regular'  },
    { value: '500', label: 'Medium'   },
    { value: '600', label: 'SemiBold' },
    { value: '700', label: 'Bold'     },
  ];

  public textAlignOptions = [
    { value: 'left',    label: '←'  },
    { value: 'center',  label: '↔'  },
    { value: 'right',   label: '→'  },
    { value: 'justify', label: '↔↔' },
  ];

  public borderStyleOptions = [
    { value: 'solid',  label: 'Sólida'    },
    { value: 'dashed', label: 'Tracejada' },
    { value: 'dotted', label: 'Pontilhada'},
    { value: 'none',   label: 'Nenhuma'   },
  ];

  constructor(public editorState: EditorStateService) {}

  get selectedComponent(): PageComponent | null {
    if (!this.editorState.selectedNode) return null;
    if ('config' in this.editorState.selectedNode) {
      return this.editorState.selectedNode;
    }
    return null;
  }

  get hasContentTab(): boolean {
    if (!this.selectedComponent) return false;
    const t = this.selectedComponent.type;
    return (
      t === ComponentType.TEXT    ||
      t === ComponentType.TITLE   ||
      t === ComponentType.BUTTON  ||
      t === ComponentType.IMAGE
    );
  }

  setTab(tab: StyleTab): void {
    this.activeTab = tab;
  }

}
