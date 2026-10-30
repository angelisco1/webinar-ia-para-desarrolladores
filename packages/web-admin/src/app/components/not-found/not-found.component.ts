import { Component } from '@angular/core'

@Component({
  selector: 'app-not-found',
  standalone: false,
  template: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 12px;">
      <h1 style="font-size: 72px; color: #4ade80; font-weight: 700;">404</h1>
      <p style="color: #5c6378; font-size: 18px;">Página no encontrada</p>
      <a routerLink="/" class="btn btn-primary">Volver al inicio</a>
    </div>
  `
})
export class NotFoundComponent {}
