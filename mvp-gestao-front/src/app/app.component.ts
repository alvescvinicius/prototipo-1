import { Component } from '@angular/core';
import { ContentComponent } from './core/layout/content/content.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ContentComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {}
