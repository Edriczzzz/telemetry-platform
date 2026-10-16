export class NotAvailableError extends Error {
  constructor(message = "Esta fuente de datos todavía no está disponible") {
    super(message);
  }
}
