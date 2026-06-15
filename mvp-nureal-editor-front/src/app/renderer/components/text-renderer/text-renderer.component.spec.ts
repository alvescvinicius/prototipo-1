import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextRendererComponent } from './text-renderer.component';

describe('TextRendererComponent', () => {
  let component: TextRendererComponent;
  let fixture: ComponentFixture<TextRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
