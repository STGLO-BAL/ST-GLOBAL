import { createVercelHttpHandler } from "@trpc/server/adapters/vercel";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

export default createVercelHttpHandler({
  router: appRouter,
  createContext,
});
