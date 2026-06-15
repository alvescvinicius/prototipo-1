import { ComponentType } from '../enums/component-type.enum';
import { ComponentConfig } from './component-config';
import { PageComponent } from './page-component';

export interface Section {
  id:             string;
  type:           ComponentType;
  name:           string;
  order:          number;
  config:         ComponentConfig;
  pageComponents: PageComponent[];
}
