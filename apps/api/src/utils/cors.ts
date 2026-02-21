import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";

export async function registerCorsPlugin(app: FastifyInstance) {
    app.register(cors, {
        origin: 'http://localhost:4000',
        credentials: true,
    });
}