import { z } from "zod";

const latLng = z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]);

export const missionSchema = z
  .object({
    name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(120, "Máximo 120 caracteres"),
    zone: z.string().trim().min(2, "Indica la zona de inspección").max(80, "Máximo 80 caracteres"),
    description: z.string().max(500, "Máximo 500 caracteres"),
    status: z.enum(["borrador", "planificada", "cancelada"]),
    planned_altitude_m: z
      .number({ invalid_type_error: "Debe ser un número" })
      .min(5, "La altitud mínima es 5 m")
      .max(120, "La altitud máxima es 120 m")
      .nullable(),
    area: z.array(latLng),
    waypoints: z.array(latLng),
  })
  .superRefine((v, ctx) => {
    if (v.status !== "planificada") return;
    if (v.area.length < 3) ctx.addIssue({ code: "custom", path: ["area"], message: "Para planificar, dibuja una zona de al menos 3 vértices" });
    if (v.waypoints.length < 2) ctx.addIssue({ code: "custom", path: ["waypoints"], message: "Para planificar, define al menos 2 waypoints" });
    if (v.planned_altitude_m == null) ctx.addIssue({ code: "custom", path: ["planned_altitude_m"], message: "Para planificar, indica la altitud" });
  });

export type MissionFormValues = z.infer<typeof missionSchema>;
