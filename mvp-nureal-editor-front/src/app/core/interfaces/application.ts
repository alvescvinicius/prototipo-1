import { Page } from "./page";
export interface Application {
  id: string;
  name: string;
  pages: Page[];
}
