import { NotAvailableError } from "../services/errors";

interface Props {
  isPending: boolean;
  error: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

/** Estados de carga, error y ausencia de datos, con mensajes que dicen qué hacer. */
export function DataState({ isPending, error, isEmpty, emptyMessage = "No hay datos para mostrar.", children }: Props) {
  if (isPending) return <p role="status" className="p-4">Cargando…</p>;
  if (error) {
    const msg =
      error instanceof NotAvailableError
        ? `${error.message} Activa el modo demostración con VITE_DEMO_MODE=true o espera a esa fase.`
        : "No se pudieron cargar los datos. Revisa la conexión con el servidor e inténtalo de nuevo.";
    return (
      <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-900">
        {msg}
      </p>
    );
  }
  if (isEmpty) return <p className="rounded border border-dashed border-line bg-white p-4">{emptyMessage}</p>;
  return <>{children}</>;
}
