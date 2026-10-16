import { DEMO_MODE } from "../lib/config";
import { createDemoSource } from "./demo/demoSource";
import { liveSource } from "./live/liveSource";
import type { DataSource } from "./types";

/** Único punto donde se decide el origen de los datos. Los componentes no saben cuál es. */
export const dataSource: DataSource = DEMO_MODE ? createDemoSource() : liveSource;
