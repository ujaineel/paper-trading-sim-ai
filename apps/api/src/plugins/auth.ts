import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { config } from "../config";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string };
    user: { userId: string };
  }
}

export const authPlugin = fp(async (app) => {
  await app.register(jwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: config.jwtExpiresIn },
  });

  app.log.info("Auth (JWT) plugin registered");
});
