import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { DataState } from "../../components/DataState";
import { RouteEditor } from "../../components/RouteEditor";
import { DEMO_MODE } from "../../lib/config";
import { useMission, useSaveMission } from "../../hooks/useData";
import type { LatLng, Mission } from "../../types/domain";
import { type MissionFormValues, missionSchema } from "./missionSchema";

const EMPTY: MissionFormValues = {
  name: "", zone: "", description: "", status: "borrador", planned_altitude_m: 15, area: [], waypoints: [],
};
const EDITABLE = ["borrador", "planificada"];
const input = "mt-1 block w-full rounded border border-line bg-white px-2 py-1.5";

const toValues = (m: Mission): MissionFormValues => ({
  name: m.name, zone: m.zone, description: m.description,
  status: m.status === "planificada" ? "planificada" : "borrador",
  planned_altitude_m: m.planned_altitude_m, area: m.area, waypoints: m.waypoints,
});

export function MissionFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const existing = useMission(id ?? "");
  const save = useSaveMission(id);

  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: EMPTY,
    values: existing.data ? toValues(existing.data.mission) : undefined,
  });
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const area = watch("area");
  const waypoints = watch("waypoints");

  const onSubmit = handleSubmit((values) =>
    save.mutate(values, { onSuccess: (m) => navigate(`/missions/${m.id}`) }),
  );
  const setGeometry = (v: { area: LatLng[]; waypoints: LatLng[] }) => {
    setValue("area", v.area, { shouldValidate: true });
    setValue("waypoints", v.waypoints, { shouldValidate: true });
  };

  const blocked = editing && existing.data && !EDITABLE.includes(existing.data.mission.status);

  const body = (
    <form onSubmit={onSubmit} noValidate className="mt-4 flex max-w-5xl flex-col gap-4">
      <div className="grid gap-4 rounded border border-line bg-white p-4 md:grid-cols-2">
        <label className="text-sm font-bold">
          Nombre
          <input className={input} {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && <span role="alert" className="font-normal text-red-800">{errors.name.message}</span>}
        </label>
        <label className="text-sm font-bold">
          Zona de inspección
          <input className={input} placeholder="Ej. Poniente" {...register("zone")} aria-invalid={!!errors.zone} />
          {errors.zone && <span role="alert" className="font-normal text-red-800">{errors.zone.message}</span>}
        </label>
        <label className="text-sm font-bold md:col-span-2">
          Descripción
          <textarea className={input} rows={2} {...register("description")} />
          {errors.description && <span role="alert" className="font-normal text-red-800">{errors.description.message}</span>}
        </label>
        <label className="text-sm font-bold">
          Altitud planificada (m)
          <input
            className={input}
            inputMode="decimal"
            {...register("planned_altitude_m", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })}
            aria-invalid={!!errors.planned_altitude_m}
          />
          {errors.planned_altitude_m && <span role="alert" className="font-normal text-red-800">{errors.planned_altitude_m.message}</span>}
        </label>
        <label className="text-sm font-bold">
          Estado
          <select className={input} {...register("status")}>
            <option value="borrador">Borrador</option>
            <option value="planificada">Planificada</option>
            {editing && <option value="cancelada">Cancelada</option>}
          </select>
        </label>
      </div>

      <div className="rounded border border-line bg-white p-4">
        <h2 className="mb-2 font-bold">Zona y ruta</h2>
        <RouteEditor area={area} waypoints={waypoints} onChange={setGeometry} />
        {errors.area && <p role="alert" className="mt-1 text-red-800">{errors.area.message}</p>}
        {errors.waypoints && <p role="alert" className="mt-1 text-red-800">{errors.waypoints.message}</p>}
      </div>

      {save.isError && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-900">{(save.error as Error).message}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={save.isPending} className="rounded bg-survey px-4 py-2 font-bold text-white disabled:opacity-60">
          {save.isPending ? "Guardando…" : "Guardar misión"}
        </button>
        <Link to={editing ? `/missions/${id}` : "/missions"} className="rounded border border-line bg-white px-4 py-2">Cancelar</Link>
      </div>
    </form>
  );

  return (
    <section>
      <h1 className="text-2xl font-bold">{editing ? "Editar misión" : "Nueva misión"}</h1>
      <p className="mt-2 max-w-3xl text-sm">
        La plataforma solo <strong>registra</strong> la misión. Todavía no se envía al VANT: esa integración requiere un servicio de comunicación autorizado.
        {DEMO_MODE && " En modo demostración los cambios no se conservan al recargar la página."}
      </p>
      {editing ? (
        <DataState isPending={existing.isPending} error={existing.error}>
          {blocked ? (
            <p role="alert" className="mt-4 rounded border border-amber-300 bg-amber-50 p-4 text-amber-900">
              Solo se pueden editar misiones en borrador o planificadas.
            </p>
          ) : body}
        </DataState>
      ) : body}
    </section>
  );
}
