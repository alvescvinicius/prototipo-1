import { FormField }       from './form-field';
import { FormAction }      from './form-action';
import { ComponentAction } from './component-action';

export interface ComponentConfig {

  // Content
  content?:     string;
  placeholder?: string;
  label?:       string;
  description?: string;
  src?:         string;
  href?:        string;
  items?:       string;
  options?:     string;

  // Layout (self — como filho flex)
  display?:    string;
  alignSelf?:  string;
  flexGrow?:   number;
  flexShrink?: number;
  flexBasis?:  string;
  order?:      number;
  cursor?:     string;

  // Positioning (CSS)
  position?: string;   // static | relative | absolute | fixed | sticky
  top?:      string;
  right?:    string;
  bottom?:   string;
  left?:     string;

  // Overlay / Sobreposição
  mixBlendMode?: string;
  overflow?:     string;

  // Custom CSS
  customCss?: string;

  // Typography
  fontSize?:      string;
  fontWeight?:    string;
  fontFamily?:    string;
  color?:         string;
  textAlign?:     string;
  letterSpacing?: string;
  lineHeight?:    string;

  // Spacing
  paddingTop?:    string;
  paddingBottom?: string;
  paddingLeft?:   string;
  paddingRight?:  string;
  marginTop?:     string;
  marginBottom?:  string;
  marginLeft?:    string;
  marginRight?:   string;

  // Visual
  backgroundColor?: string;
  borderRadius?:    string;
  borderWidth?:     string;
  borderColor?:     string;
  borderStyle?:     string;
  opacity?:         number;
  boxShadow?:       string;

  // Form advanced
  boundObject?:  string;
  formActions?:  FormAction[];

  // Form simple (legacy)
  formFields?:   FormField[];
  submitLabel?:  string;
  submitAction?: string;
  formId?:       string;

  // Dimensions
  width?:     string;
  height?:    string;
  maxWidth?:  string;
  minWidth?:  string;
  minHeight?: string;
  columns?:   string;

  // Background (page / section)
  backgroundImage?:    string;
  backgroundSize?:     string;
  backgroundRepeat?:   string;
  backgroundPosition?: string;

  // Flex layout
  flexDirection?:  string;
  alignItems?:     string;
  justifyContent?: string;
  gap?:            string;
  flexWrap?:       string;

  // CSS inheritance control
  inheritParentCss?: boolean;   // false = reset herança do pai

  // Free positioning
  absolutePos?:   boolean;
  posX?:          number;
  posY?:          number;
  posLocked?:     boolean;   // trava movimento/resize no canvas
  zIndex?:        number;
  allowOverflow?: boolean;

  // Carousel
  carouselTransition?: 'slide' | 'fade' | 'none';
  carouselAutoPlay?:   boolean;
  carouselAutoPlayDelay?: number;
  // Style variant
  variant?: string;

  // Actions (event-driven, all components)
  actions?: ComponentAction[];
}
