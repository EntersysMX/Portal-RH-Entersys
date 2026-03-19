import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ============================================
// FRAPPE HR API CLIENT
// ============================================
//
// Frappe HR es un software que TÚ instalas en tu servidor (con Docker).
// NO es un servicio externo de pago. NO necesitas comprar ningún API key.
//
// Frappe expone REST API automática para TODOS los DocTypes (Employee,
// Leave Application, Salary Slip, etc.) sin costo.
//
// Hay 3 formas de autenticarse (todas gratis):
//
// 1. Cookie/Session (login con usuario y password)
//    POST /api/method/login { usr, pwd }
//    Frappe devuelve una cookie de sesión automáticamente.
//
// 2. API Token (recomendado para producción)
//    Header: Authorization: token {api_key}:{api_secret}
//    Se genera desde: Frappe > User Settings > API Access > Generate Keys
//
// 3. Basic Auth
//    Header: Authorization: Basic base64({usuario}:{password})
//
// Docs oficiales: https://frappeframework.com/docs/user/en/api
// ============================================

function getFrappeUrl(): string {
  // En desarrollo, siempre usar el proxy de Vite (que agrega Host: hr.localhost)
  if (import.meta.env.DEV) return '';

  const stored = localStorage.getItem('frappe_url');
  if (stored) return stored;

  return import.meta.env.VITE_FRAPPE_URL || 'http://localhost:8080';
}

const client = axios.create({
  timeout: 30_000, // 30s — evita que cualquier request quede colgado indefinidamente
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Necesario para cookie-based auth
});

// Interceptor: configurar baseURL dinámicamente + auth
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // URL dinámica (puede cambiar desde Settings)
  config.baseURL = getFrappeUrl();

  // Autenticación por token (prioridad sobre cookie)
  const token = localStorage.getItem('frappe_api_token');
  if (token) {
    // Formato Frappe: token api_key:api_secret
    config.headers.Authorization = `token ${token}`;
  }

  return config;
});

// Interceptor: manejar errores de auth globalmente
const AUTH_ENDPOINTS = ['/api/method/login', '/api/method/logout', '/api/method/frappe.auth.get_logged_user', '/api/method/frappe.utils.change_log.get_versions'];
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url || '';
    const isAuthCall = AUTH_ENDPOINTS.some((ep) => url.includes(ep));

    if (!isAuthCall && (error.response?.status === 401 || error.response?.status === 403)) {
      localStorage.removeItem('frappe_api_token');
      localStorage.removeItem('frappe_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Login con usuario y contraseña.
 * Frappe devuelve una cookie sid que se usa automáticamente.
 * POST /api/method/login
 */
export async function frappeLogin(usr: string, pwd: string) {
  const res = await client.post('/api/method/login', { usr, pwd });
  return res.data;
}

/**
 * Logout - invalida la sesión actual.
 * GET /api/method/logout
 */
export async function frappeLogout() {
  const res = await client.get('/api/method/logout');
  localStorage.removeItem('frappe_api_token');
  localStorage.removeItem('frappe_user');
  return res.data;
}

/**
 * Verifica quién está logueado actualmente.
 * GET /api/method/frappe.auth.get_logged_user
 */
export async function frappeGetLoggedUser() {
  const res = await client.get('/api/method/frappe.auth.get_logged_user');
  return res.data;
}

/**
 * Test de conexión: intenta obtener el usuario logueado.
 * Útil para verificar que la URL y el token son correctos.
 */
export async function frappeTestConnection(): Promise<{
  success: boolean;
  user?: string;
  version?: string;
  error?: string;
}> {
  try {
    const [userRes, versionRes] = await Promise.all([
      client.get('/api/method/frappe.auth.get_logged_user'),
      client.get('/api/method/frappe.utils.change_log.get_versions').catch(() => null),
    ]);

    const user = userRes.data?.message;
    const versions = versionRes?.data?.message;
    const frappeVersion = versions?.frappe?.version;

    return {
      success: true,
      user: user || 'Connected',
      version: frappeVersion || 'Unknown',
    };
  } catch (err: unknown) {
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status === 401 || axiosErr.response?.status === 403) {
      return { success: false, error: 'Token inválido o sesión expirada. Verifica tus credenciales.' };
    }
    if (axiosErr.code === 'ERR_NETWORK') {
      return { success: false, error: 'No se puede conectar. Verifica que Frappe HR esté corriendo en la URL indicada.' };
    }
    return { success: false, error: 'Error de conexión desconocido.' };
  }
}

// ============================================
// FUNCIONES GENÉRICAS DE LA API REST
// ============================================

interface ListParams {
  doctype: string;
  fields?: string[];
  filters?: Record<string, unknown> | unknown[][];
  order_by?: string;
  limit_start?: number;
  limit_page_length?: number;
  group_by?: string;
}

interface CountParams {
  doctype: string;
  filters?: Record<string, unknown> | unknown[][];
}

/**
 * Listar documentos de un DocType.
 * GET /api/resource/:doctype
 * Ejemplo: GET /api/resource/Employee?fields=["*"]&limit_page_length=20
 */
export async function frappeGetList<T>({
  doctype,
  fields = ['*'],
  filters,
  order_by,
  limit_start = 0,
  limit_page_length = 20,
  group_by,
}: ListParams): Promise<T[]> {
  const params: Record<string, string> = {
    fields: JSON.stringify(fields),
    limit_start: String(limit_start),
    limit_page_length: String(limit_page_length),
  };
  if (filters) params.filters = JSON.stringify(filters);
  if (order_by) params.order_by = order_by;
  if (group_by) params.group_by = group_by;

  const res = await client.get(`/api/resource/${doctype}`, { params });
  return res.data.data;
}

/**
 * Obtener un documento específico por su nombre/ID.
 * GET /api/resource/:doctype/:name
 * Ejemplo: GET /api/resource/Employee/HR-EMP-00001
 */
export async function frappeGetDoc<T>(doctype: string, name: string): Promise<T> {
  const res = await client.get(`/api/resource/${doctype}/${encodeURIComponent(name)}`);
  return res.data.data;
}

/**
 * Crear un nuevo documento.
 * POST /api/resource/:doctype
 * Ejemplo: POST /api/resource/Employee { first_name: "Juan", ... }
 */
export async function frappeCreateDoc<T>(doctype: string, data: Partial<T>): Promise<T> {
  const res = await client.post(`/api/resource/${doctype}`, data);
  return res.data.data;
}

/**
 * Actualizar un documento existente.
 * PUT /api/resource/:doctype/:name
 * Ejemplo: PUT /api/resource/Employee/HR-EMP-00001 { status: "Inactive" }
 */
export async function frappeUpdateDoc<T>(
  doctype: string,
  name: string,
  data: Partial<T>
): Promise<T> {
  const res = await client.put(`/api/resource/${doctype}/${encodeURIComponent(name)}`, data);
  return res.data.data;
}

/**
 * Eliminar un documento.
 * DELETE /api/resource/:doctype/:name
 */
export async function frappeDeleteDoc(doctype: string, name: string): Promise<void> {
  await client.delete(`/api/resource/${doctype}/${encodeURIComponent(name)}`);
}

/**
 * Contar documentos con filtros opcionales.
 * GET /api/method/frappe.client.get_count
 */
export async function frappeGetCount({ doctype, filters }: CountParams): Promise<number> {
  const params: Record<string, string> = { doctype };
  if (filters) params.filters = JSON.stringify(filters);

  const res = await client.get('/api/method/frappe.client.get_count', { params });
  return res.data.message;
}

/**
 * Llamar cualquier método whitelisted de Frappe.
 * POST /api/method/:method
 * Ejemplo: POST /api/method/hrms.api.get_employee_details
 */
export async function frappeCall<T>(method: string, args?: Record<string, unknown>): Promise<T> {
  const res = await client.post(`/api/method/${method}`, args);
  return res.data.message;
}

/**
 * Subir un archivo a Frappe.
 * POST /api/method/upload_file (multipart/form-data)
 * Puede vincularse a un DocType/docname para asociar el archivo.
 */
export async function frappeUploadFile(params: {
  file: File;
  doctype?: string;
  docname?: string;
  is_private?: boolean;
}): Promise<{ file_url: string; name: string }> {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.doctype) formData.append('doctype', params.doctype);
  if (params.docname) formData.append('docname', params.docname);
  formData.append('is_private', params.is_private ? '1' : '0');

  const res = await client.post('/api/method/upload_file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.message;
}

/**
 * Ejecutar un reporte de Frappe.
 * GET /api/method/frappe.client.get_report
 */
export async function frappeGetReport(
  report_name: string,
  filters?: Record<string, unknown>
) {
  const params: Record<string, string> = { report_name };
  if (filters) params.filters = JSON.stringify(filters);

  const res = await client.get('/api/method/frappe.client.get_report', { params });
  return res.data.message;
}

// ============================================
// FUNCIONES DE ROLES Y EMPLEADO
// ============================================

/**
 * Obtener los roles del usuario logueado.
 * Usa la Resource API para obtener el User doc con sus roles.
 */
export async function frappeGetUserRoles(userEmail?: string): Promise<string[]> {
  const email = userEmail || 'Administrator';
  try {
    const res = await client.get(`/api/resource/User/${encodeURIComponent(email)}`);
    const roles: { role: string }[] = res.data?.data?.roles || [];
    return roles.map((r) => r.role);
  } catch {
    return ['Employee'];
  }
}

/**
 * Buscar el Employee vinculado al usuario actual.
 * Retorna null si no hay Employee vinculado.
 */
export async function frappeGetEmployeeByUser(userEmail: string): Promise<{
  employee_id: string;
  employee_name: string;
} | null> {
  try {
    const employees = await frappeGetList<{ name: string; employee_name: string }>({
      doctype: 'Employee',
      fields: ['name', 'employee_name'],
      filters: { user_id: userEmail, status: 'Active' },
      limit_page_length: 1,
    });
    if (employees.length > 0) {
      return {
        employee_id: employees[0].name,
        employee_name: employees[0].employee_name,
      };
    }
    return null;
  } catch {
    return null;
  }
}
