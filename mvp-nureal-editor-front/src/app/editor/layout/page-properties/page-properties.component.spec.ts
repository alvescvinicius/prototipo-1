import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagePropertiesComponent } from './page-properties.component';

describe('PagePropertiesComponent', () => {
  let component: PagePropertiesComponent;
  let fixture: ComponentFixture<PagePropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagePropertiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagePropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
