import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import OAuth2, { OAuth2Namespace } from "@fastify/oauth2";

declare module 'fastify' {
    interface FastifyInstance {
        googleOAuth2: OAuth2Namespace;
    }
}

const googleOAuth2Options = {
    name: 'googleOAuth2',
    scope: ['email', 'profile'],
    credentials: {
        client: {
            id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
            secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        },
        auth: OAuth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/api/oauth2/google',
    callbackUri: 'http://localhost:8000/api/oauth2/google/callback',
}

export async function googleOAuth2(app: FastifyInstance) {
    app.register(OAuth2, googleOAuth2Options);
};