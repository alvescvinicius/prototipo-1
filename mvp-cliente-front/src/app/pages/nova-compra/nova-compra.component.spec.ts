import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovaCompraComponent } from './nova-compra.component';

describe('NovaCompraComponent', () => {
  let component: NovaCompraComponent;
  let fixture: ComponentFixture<NovaCompraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovaCompraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovaCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
