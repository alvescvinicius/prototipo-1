import { Component } from '@angular/core';
import { HeaderComponent } from '../../core/layout/header/header.component';
import { CarouselComponent } from '../../shared/components/carousel/carousel.component';

import { ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, CarouselComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  currentSlide = 0;

  @ViewChild('carousel')
  carousel!: ElementRef<HTMLDivElement>;
  proximo(): void {
    if (this.currentSlide < 4) {
      this.currentSlide++;
    }

    this.carousel.nativeElement.scrollBy({
      left: window.innerWidth,
      behavior: 'smooth',
    });
  }

  anterior(): void {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }

    this.carousel.nativeElement.scrollBy({
      left: -window.innerWidth,
      behavior: 'smooth',
    });
  }
}
