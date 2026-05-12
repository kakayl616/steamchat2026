import app from "../src/api/index.js";
import { handle } from "hono/vercel";

export const config = { runtime: "nodejs" };
export default handle(app);
