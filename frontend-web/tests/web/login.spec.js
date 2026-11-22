// tests/web/login.spec.js
import { test, expect } from '@playwright/test';

// URL de producción de tu aplicación
const BASE_URL = 'https://hommi.homes'; 

test.describe('Pruebas automatizadas de Login - RoomieCheck (Hommi)', () => {

  // Prueba 1 — Login EXITOSO con credenciales reales
  test('Login exitoso con credenciales válidas de estudiante', async ({ page }) => {
    // 1. Navegar directo a la URL de login en la nube
    await page.goto(`${BASE_URL}/login`);
    
    // 2. Verificar que la página cargue correctamente
    await expect(page).toHaveTitle(/frontend-web|RoomieCheck|Hommi/i);
    
    // 3. Rellenar el formulario con tus datos reales
    await page.locator('input[type="email"], input[name="email"]').fill('danakaren44@gmail.com');
    await page.locator('input[type="password"], input[name="password"]').fill('12345678');
    
    // 4. Hacer clic en el botón de iniciar sesión
    await page.locator('button[type="submit"]', { hasText: /Iniciar sesión|Ingresar/i }).click();
    
    // 5. Esperar redirección a la página real de aterrizaje deseadas (/mi-panel)
    await page.waitForURL('**/mi-panel', { timeout: 8000 }); 
    
    // 6. ASERCIONES: Validar que la URL cambió correctamente a /mi-panel
    await expect(page).toHaveURL(/mi-panel/);
    
    // 7. Validar que la interfaz muestra elementos del panel de usuario (como el botón de salir)
    const logoutButton = page.locator('button, a', { hasText: /Cerrar sesión|Salir|Cerrar Sesion/i }).first();
    await expect(logoutButton).toBeVisible();
    
    console.log('Prueba exitosa: Login en producción y redirección a /mi-panel completada');
  });

  // Prueba 2 — Login FALLIDO con credenciales incorrectas
  test('Login fallido con credenciales inválidas', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.locator('input[type="email"]').fill('danakaren44@gmail.com');
    await page.locator('input[type="password"]').fill('clave_incorrecta_123'); // Contraseña falsa
    
    await page.locator('button[type="submit"]').click();
    
    // Esperar a que el backend responda el rechazo
    await page.waitForTimeout(1500);
    
    // Verificar que no nos dejó pasar y seguimos en /login
    await expect(page).toHaveURL(/login/);
    
    // Buscar el mensaje de error o alerta en la pantalla
    const errorBanner = page.locator('.auth-banner--error, [role="alert"], .text-red-500, .error-message').first();
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/incorrect|error|inválid|no válido/i);
    
    console.log('Prueba exitosa: El sistema bloqueó el acceso inválido en producción');
  });

  // Prueba 3 — Login con campos vacíos
  test('Login fallido con campos vacíos', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Intentar dar clic en ingresar sin llenar ningún campo
    await page.locator('button[type="submit"]').click();
    
    await page.waitForTimeout(500);
    
    // El navegador o la validación interna retienen al usuario en /login
    await expect(page).toHaveURL(/login/);
    
    console.log('Prueba exitosa: Formulario vacío retenido');
  });

});