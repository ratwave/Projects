import { App } from './ui/app';

/** Bootstrap: create the app and show the main menu. */
function boot(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.style.display = 'none';

  const app = new App(canvas);
  void app.showMenu();

  // Dev hook for automated interaction tests.
  (window as unknown as { __app: App }).__app = app;
}

boot();
