export function PagePlaceholder({ title, phase, children }: { title: string; phase: string; children?: React.ReactNode }) {
  return (
    <section className="max-w-2xl">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-3 rounded border border-dashed border-line bg-white p-4">
        Esta sección todavía no está implementada. Se construye en {phase}.
      </p>
      {children}
    </section>
  );
}
