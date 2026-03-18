export interface FrappeError {
  code: string;
  message: string;
  details?: string;
}

interface ErrorMapping {
  code: string;
  message: string | ((details: string) => string);
}

const EXC_TYPE_MAP: Record<string, ErrorMapping> = {
  LinkValidationError: {
    code: 'RH-001',
    message: (details) => {
      const fieldMatch = details.match(/Could not find (\w+)/i) || details.match(/Invalid Link/i);
      if (fieldMatch) return `El valor de "${fieldMatch[1]}" no existe en el catálogo. Verifica que sea un valor válido.`;
      return 'Un campo hace referencia a un valor que no existe en el catálogo. Verifica los datos.';
    },
  },
  DuplicateEntryError: {
    code: 'RH-002',
    message: 'Ya existe un registro con ese nombre.',
  },
  MandatoryError: {
    code: 'RH-003',
    message: (details) => {
      const fields = extractMandatoryFields(details);
      if (fields) return `Faltan campos obligatorios: ${fields}.`;
      return 'Faltan campos obligatorios.';
    },
  },
  ValidationError: {
    code: 'RH-004',
    message: (details) => `Error de validación: ${details || 'Revisa los datos ingresados'}.`,
  },
  PermissionError: {
    code: 'RH-005',
    message: 'No tienes permisos para realizar esta acción.',
  },
  TimestampMismatchError: {
    code: 'RH-006',
    message: 'El registro fue modificado por otro usuario. Recarga e intenta de nuevo.',
  },
  InvalidEmailAddressError: {
    code: 'RH-007',
    message: 'La dirección de email no es válida.',
  },
};

function extractMandatoryFields(text: string): string | null {
  // Frappe sends messages like: "Please set value for Company : Employee"
  // or "Value missing for Company"
  const patterns = [
    /Please set value for (.+?) :/gi,
    /Value missing for (.+)/gi,
    /Mandatory field[s]?.*?:\s*(.+)/gi,
    /(?:fields? required|obligatorio[s]?).*?:\s*(.+)/gi,
  ];
  const fields: string[] = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      fields.push(match[1].trim());
    }
  }
  return fields.length > 0 ? fields.join(', ') : null;
}

function extractExcType(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;

  const axiosError = error as { response?: { data?: { exc_type?: string; exc?: string; _server_messages?: string } } };
  const data = axiosError.response?.data;
  if (!data) return null;

  if (data.exc_type) return data.exc_type;

  // Try to extract from exc traceback
  if (data.exc) {
    try {
      const excStr = typeof data.exc === 'string' ? data.exc : JSON.stringify(data.exc);
      const match = excStr.match(/frappe\.exceptions\.(\w+)/);
      if (match) return match[1];
    } catch {
      // ignore parse errors
    }
  }

  return null;
}

function extractServerMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return '';

  const axiosError = error as {
    response?: { data?: { _server_messages?: string; message?: string; exc?: string } };
    message?: string;
  };
  const data = axiosError.response?.data;
  if (!data) return axiosError.message || '';

  // _server_messages is a JSON-encoded array of JSON-encoded strings
  if (data._server_messages) {
    try {
      const msgs: string[] = JSON.parse(data._server_messages);
      const parsed = msgs
        .map((m) => {
          try {
            const obj = JSON.parse(m);
            return obj.message || obj.msg || m;
          } catch {
            return m;
          }
        })
        .filter(Boolean);
      if (parsed.length > 0) return stripHtml(parsed.join('. '));
    } catch {
      // fallback
    }
  }

  if (data.message) return stripHtml(data.message);
  return '';
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

function getHttpStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const axiosError = error as { response?: { status?: number } };
  return axiosError.response?.status ?? null;
}

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const axiosError = error as { code?: string; message?: string; response?: unknown };
  if (!axiosError.response) return true; // No response = network issue
  if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ERR_NETWORK') return true;
  if (axiosError.message?.includes('Network Error')) return true;
  return false;
}

export function parseFrappeError(error: unknown): FrappeError {
  // Network / timeout errors
  if (isNetworkError(error)) {
    return {
      code: 'RH-010',
      message: 'No se pudo conectar al servidor. Verifica tu conexión.',
    };
  }

  const excType = extractExcType(error);
  const serverMessage = extractServerMessage(error);
  const httpStatus = getHttpStatus(error);

  // Match by exc_type
  if (excType && EXC_TYPE_MAP[excType]) {
    const mapping = EXC_TYPE_MAP[excType];
    const message =
      typeof mapping.message === 'function'
        ? mapping.message(serverMessage)
        : mapping.message;
    return {
      code: mapping.code,
      message,
      details: serverMessage || undefined,
    };
  }

  // Match by HTTP status
  if (httpStatus === 404) {
    return {
      code: 'RH-008',
      message: 'El registro no fue encontrado. Puede haber sido eliminado.',
      details: serverMessage || undefined,
    };
  }

  if (httpStatus === 403) {
    return {
      code: 'RH-005',
      message: 'No tienes permisos para realizar esta acción.',
      details: serverMessage || undefined,
    };
  }

  if (httpStatus === 500 || httpStatus === 502 || httpStatus === 503) {
    return {
      code: 'RH-009',
      message: 'Error interno del servidor. Contacta a soporte con este código.',
      details: serverMessage || undefined,
    };
  }

  // If we have a server message with a known exc_type pattern in the text
  if (serverMessage) {
    for (const [excName, mapping] of Object.entries(EXC_TYPE_MAP)) {
      if (serverMessage.includes(excName)) {
        const message =
          typeof mapping.message === 'function'
            ? mapping.message(serverMessage)
            : mapping.message;
        return { code: mapping.code, message, details: serverMessage };
      }
    }
  }

  // Unknown error
  return {
    code: 'RH-099',
    message: 'Error inesperado. Contacta a soporte con el código RH-099.',
    details: serverMessage || (error instanceof Error ? error.message : undefined),
  };
}
