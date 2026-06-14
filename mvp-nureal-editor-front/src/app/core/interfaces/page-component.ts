import { ComponentType } from '../enums/component-type.enum';

export interface PageComponent {

  id: string;

  type: ComponentType;

  name: string;

  order: number;

  children: PageComponent[];

  config: any;

}
