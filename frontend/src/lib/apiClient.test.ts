import { ApiError, apiFetch } from "./apiClient";

afterEach(() => vi.restoreAllMocks());

it("normaliza errores con el formato del backend", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: { code: "validation_error", message: "Datos inválidos", details: [{ field: "body.lat", message: "fuera de rango" }] } }), { status: 422 }),
  ));
  await expect(apiFetch("/x")).rejects.toMatchObject({ status: 422, code: "validation_error", details: [{ field: "body.lat" }] });
});

it("convierte fallos de red en ApiError network_error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fail")));
  const err = (await apiFetch("/x").catch((e: unknown) => e)) as ApiError;
  expect(err).toBeInstanceOf(ApiError);
  expect(err.code).toBe("network_error");
});
