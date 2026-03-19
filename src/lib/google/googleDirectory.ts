// ============================================
// GOOGLE ADMIN DIRECTORY API CLIENT
// ============================================

import type { Employee } from '@/types/frappe';
import type { GoogleDirectoryUser, DirectoryListResponse } from './types';

const DIRECTORY_API = 'https://admin.googleapis.com/admin/directory/v1';
const FETCH_PAGE_TIMEOUT_MS = 15_000;

/**
 * Obtiene todos los usuarios del directorio de Google Workspace para un dominio.
 * Maneja paginacion automaticamente. Timeout de 15s por página.
 */
export async function fetchDirectoryUsers(
  token: string,
  domain: string
): Promise<GoogleDirectoryUser[]> {
  const allUsers: GoogleDirectoryUser[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      domain,
      maxResults: '500',
      projection: 'full',
      orderBy: 'email',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const url = `${DIRECTORY_API}/users?${params}`;
    console.log('[Directory] Llamando:', url);

    // AbortController con timeout para evitar que fetch quede colgado
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_PAGE_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Timeout al obtener usuarios del directorio de Google (15s)');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    console.log('[Directory] Status:', res.status);

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[Directory] Error response:', errBody);
      let msg = `Error ${res.status} al obtener directorio`;
      try {
        const err = JSON.parse(errBody);
        msg = err?.error?.message || msg;
        if (res.status === 403) {
          msg += ' — Tu cuenta necesita ser Admin de Google Workspace para acceder al directorio.';
        }
      } catch { /* ignore parse error */ }
      throw new Error(msg);
    }

    const rawText = await res.text();
    console.log('[Directory] Respuesta (primeros 500 chars):', rawText.substring(0, 500));
    const data: DirectoryListResponse = JSON.parse(rawText);
    console.log('[Directory] Usuarios en esta pagina:', data.users?.length ?? 0);
    if (data.users) {
      allUsers.push(...data.users);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allUsers;
}

/**
 * Convierte un usuario del Directorio de Google a Partial<Employee>.
 */
export function mapDirectoryToEmployee(
  user: GoogleDirectoryUser,
  defaultCompany: string
): Partial<Employee> {
  const emp: Partial<Employee> = {
    first_name: user.name.givenName || '',
    last_name: user.name.familyName || '',
    company_email: user.primaryEmail,
    company: defaultCompany,
    status: 'Active',
    employment_type: 'Tiempo Completo',
  };

  // Imagen
  if (user.thumbnailPhotoUrl) {
    emp.image = user.thumbnailPhotoUrl;
  }

  // Telefono
  if (user.phones && user.phones.length > 0) {
    emp.cell_phone = user.phones[0].value;
  }

  // Organizacion (department + title)
  if (user.organizations && user.organizations.length > 0) {
    const org = user.organizations[0];
    if (org.department) emp.department = org.department;
    if (org.title) emp.designation = org.title;
  }

  return emp;
}

