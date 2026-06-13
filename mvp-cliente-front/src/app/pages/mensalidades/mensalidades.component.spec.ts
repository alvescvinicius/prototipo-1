import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MensalidadesComponent } from './mensalidades.component';

describe('MensalidadesComponent', () => {
  let component: MensalidadesComponent;
  let fixture: ComponentFixture<MensalidadesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MensalidadesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MensalidadesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
