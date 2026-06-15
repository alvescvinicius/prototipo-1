import { Page } from './page';

export interface Project {
  id:            string;
  user_id:       string;
  name:          string;
  slug:          string | null;
  data:          { pages: Page[]; currentPageId: string };
  is_published:  boolean;
  published_url: string | null;
  created_at:    string;
  updated_at:    string;
}

export interface Profile {
  id:         string;
  email:      string;
  name:       string;
  avatar_url: string | null;
  plan:       'free' | 'pro';
}
