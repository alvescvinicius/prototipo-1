import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageTreeComponent } from './page-tree.component';

describe('PageTreeComponent', () => {
  let component: PageTreeComponent;
  let fixture: ComponentFixture<PageTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
