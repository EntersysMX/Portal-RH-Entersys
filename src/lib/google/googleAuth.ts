// ============================================
// GOOGLE IDENTITY SERVICES (GIS) - OAuth2
// ============================================

// Declaraciones de tipo para google.accounts.oauth2
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: TokenClientConfig): TokenClient;
        };
      };
    };
  }
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string; message: string }) => void;
}

interface TokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const TOKEN_KEY = 'google_access_token';
const TOKEN_EXPIRY_KEY = 'google_token_expiry';

const SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
].join(' ');

const SCRIPT_TIMEOUT_MS = 15_000;
const TOKEN_TIMEOUT_MS = 60_000;

/**
 * Carga dinamica del script de Google Identity Services.
 * Solo se agrega al DOM una vez. Timeout de 15s para evitar bloqueos.
 */
export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Timeout al cargar el script de Google Identity Services (15s)'));
    }, SCRIPT_TIMEOUT_MS);

    const done = () => { clearTimeout(timer); resolve(); };
    const fail = () => { clearTimeout(timer); reject(new Error('No se pudo cargar el script de Google Identity Services')); };

    const existing = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', done);
      existing.addEventListener('error', fail);
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = done;
    script.onerror = fail;
    document.head.appendChild(script);
  });
}

/**
 * Inicia flujo OAuth2 popup para obtener access token.
 * Timeout de 60s para evitar promesas que nunca resuelven si el popup se cierra.
 */
export function requestAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services no esta cargado. Llama loadGoogleScript() primero.'));
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Timeout de autenticación con Google (60s). Intenta de nuevo.'));
      }
    }, TOKEN_TIMEOUT_MS);

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        // Guardar token y expiracion
        const expiresAt = Date.now() + response.expires_in * 1000;
        sessionStorage.setItem(TOKEN_KEY, response.access_token);
        sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
        resolve(response.access_token);
      },
      error_callback: (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(error.message || 'Error de autenticacion con Google'));
      },
    });

    client.requestAccessToken({ prompt: '' });
  });
}

/**
 * Retorna el token almacenado si aun es valido.
 */
export function getStoredToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) return null;

  // 60 seg de margen
  if (Date.now() > parseInt(expiry, 10) - 60_000) {
    clearToken();
    return null;
  }

  return token;
}

/**
 * Limpia el token almacenado.
 */
export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Verifica si hay un token valido guardado.
 */
export function isAuthenticated(): boolean {
  return getStoredToken() !== null;
}
