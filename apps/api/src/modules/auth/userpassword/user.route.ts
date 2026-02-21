import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { userSchemas } from "./user.schema";
import { createUser, getUsers, loginUser } from "./user.controller";

export async function userRoutes(app: FastifyInstance) {
    // Returns the current authenticated user from JWT
    app.get('/me', { preHandler: [app.authenticate] }, (req: FastifyRequest, reply: FastifyReply) => {
        return reply.send(req.user);
    });

    app.post('/register', {
        schema: {
            body: userSchemas.createUserSchema,
            response: {
                201: userSchemas.createUserResponseSchema,
            },
        },
    }, createUser);

    app.post('/login', {
        schema: {
            body: userSchemas.loginSchema,
            response: {
                200: userSchemas.loginResponseSchema,
            },
        },
    }, loginUser);

    app.delete('/logout', { preHandler: [app.authenticate] }, (req: FastifyRequest, reply: FastifyReply) => {
        reply.clearCookie('access_token', { path: '/' });
        return reply.code(200).send({ message: 'Logged out successfully' });
    });

    app.log.info('user routes registered');
}
