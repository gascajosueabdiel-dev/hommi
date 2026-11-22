// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/web',
  timeout: 30000,
  retries: 1,
  use: {
    headless: false, // Para que abra el navegador visible
    launchOptions: {
      slowMo: 2000,  // Espera 2 segundos entre cada acción para que lo veas bien
    },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: [
    ['html', { outputFolder: 'tests/evidencias/web' }],
    ['list']
  ],
});