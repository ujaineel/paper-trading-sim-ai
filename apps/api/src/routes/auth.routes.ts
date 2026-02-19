import type { FastifyInstance } from "fastify";
import { AuthService } from "../services/auth.service";
import { authGuard } from "../middleware/auth.guard";

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app.db);

  // POST /auth/register
  app.post("/register", async (request, reply) => {
    const { email, password, displayName } = request.body as {
      email: string;
      password: string;
      displayName: string;
    };

    if (!email || !password || !displayName) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: "Bad Request", message: "email, password, and displayName are required" });
    }

    const user = await authService.register(email, password, displayName);
    const token = app.jwt.sign({ userId: user.id });

    return reply.status(201).send({ token, user });
  });

  // POST /auth/login
  app.post("/login", async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return reply
        .status(400)
        .send({ statusCode: 400, error: "Bad Request", message: "email and password are required" });
    }

    const user = await authService.login(email, password);
    const token = app.jwt.sign({ userId: user.id });

    return { token, user };
  });

  // GET /auth/me
  app.get("/me", { preHandler: [authGuard] }, async (request, reply) => {
    const user = await authService.getUser(request.user.userId);
    if (!user) {
      return reply.status(404).send({ statusCode: 404, error: "Not Found", message: "User not found" });
    }
    return { user };
  });
}
