import fastify, { FastifyReply, FastifyRequest } from "fastify";
import { userRoutes } from "./modules/auth/userpassword/user.route";
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import fastifyCookie from "@fastify/cookie";
import fastifyJwt, { FastifyJWT, JWT } from "@fastify/jwt";
import { registerCorsPlugin } from "./utils/cors";
import { googleOAuth2 } from "./modules/auth/oauth/oauth2";
import { googleOauth2Routes } from "./modules/auth/oauth/google/google.route";

const app = fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

registerCorsPlugin(app);

app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET!,
    hook: 'preHandler'
});

googleOAuth2(app);

app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
});

declare module 'fastify' {
  interface FastifyRequest {
    jwt: JWT
  }
  export interface FastifyInstance {
    authenticate: any
  }
}
type UserPayload = {
  id: string
  email: string
  name: string
}
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: UserPayload
  }
}

app.addHook('preHandler', (req, res, next) => {
    req.jwt = app.jwt;
    return next();
})


app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    const token = req.cookies.access_token;
    
    if (!token) {
        return reply.code(401).send({
            message: 'Authentication Required'
        });
    }

    try {
        const decodedToken = req.jwt.verify<FastifyJWT['user']>(token);
        req.user = decodedToken;
    } catch (error) {
        return reply.code(401).send({
            message: 'Unauthorized'
        });
    }
})

async function main() {
  await app.listen({
    port: 8000,
    host: '0.0.0.0',
  })
}

app.get('/healthcheck', async (_req, reply) => {
  reply.send({ message: 'Success' })
});

app.register(userRoutes, { prefix: '/api/auth' });
app.register(googleOauth2Routes, { prefix: '/api/oauth2/google' })

// graceful shutdown
const listeners = ['SIGINT', 'SIGTERM']
listeners.forEach((signal) => {
  process.on(signal, async () => {
    await app.close()
    process.exit(0)
  })
});

main().catch((err) => {
  console.error(err)
  process.exit(1)
})