import { Section } from './section';

export interface Page {
  id:       string;
  name:     string;
  sections: Section[];
}
