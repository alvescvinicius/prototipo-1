import { Section } from './section';

export interface PageConfig {
  // Visual
  backgroundColor?:    string;
  backgroundImage?:    string;
  backgroundSize?:     string;
  backgroundRepeat?:   string;
  backgroundPosition?: string;
  color?:              string;
  // Dimensões
  maxWidth?:           string;
  minHeight?:          string;
  paddingTop?:         string;
  paddingBottom?:      string;
  paddingLeft?:        string;
  paddingRight?:       string;
  // Layout (flex)
  flexDirection?:      string;
  alignItems?:         string;
  justifyContent?:     string;
  gap?:                string;
  flexWrap?:           string;
  // Tipografia
  fontFamily?:         string;
  fontSize?:           string;
}

export interface Page {
  id:       string;
  name:     string;
  slug?:    string;
  sections: Section[];
  config?:  PageConfig;
}
