import { ComponentType } from '../enums/component-type.enum';
import { PageComponent } from './page-component';

export interface Section {

  id: string;

  type: ComponentType;

  name: string;

  order: number;

  pageComponents: PageComponent[];

}
