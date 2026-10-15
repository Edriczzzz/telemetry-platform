import { API_URL } from "./config";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { field: string; message: string }[] | null,
  ) {
    super(message);
  }
}

/** Cliente HTTP centralizado. Normaliza los errores al formato del backend: { error: { code, message, details } }. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(0, "network_error", "No se pudo contactar con el servidor");
  }
  if (!res.ok) {
    let body: { error?: { code: string; message: string; details?: { field: string; message: string }[] | null } } = {};
    try {
      body = await res.json();
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(
      res.status,
      body.error?.code ?? `http_${res.status}`,
      body.error?.message ?? "Error inesperado del servidor",
      body.error?.details,
    );
  }
  return (await res.json()) as T;
}
