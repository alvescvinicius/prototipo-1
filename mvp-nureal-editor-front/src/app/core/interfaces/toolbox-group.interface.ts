import { ToolboxItem } from './toolbox-item.interface';

export interface ToolboxGroup {
  id: string;
  name: string;
  expanded: boolean;
  items: ToolboxItem[];
}
