import { Section } from './section';

export interface PageConfig {
  backgroundColor?:    string;
  backgroundImage?:    string;
  backgroundSize?:     string;
  backgroundRepeat?:   string;
  backgroundPosition?: string;
  maxWidth?:           string;
  minHeight?:          string;
  paddingTop?:         string;
  paddingBottom?:      string;
  paddingLeft?:        string;
  paddingRight?:       string;
  fontFamily?:         string;
}

export interface Page {
  id:       string;
  name:     string;
  slug?:    string;
  sections: Section[];
  config?:  PageConfig;
}
