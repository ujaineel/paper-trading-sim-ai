import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import axios from "axios";
import { db } from "../../../../db";
import { usersTable } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export const googleOauth2Routes = async (app: FastifyInstance) => {
    app.get('/callback', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

            // Fetch user profile from Google
            const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${token.access_token}` },
            });

            const { email, name } = profile;

            // Upsert user — find by email or create
            let user = (await db.select().from(usersTable)).find((u) => u.email === email);

            if (!user) {
                await db.insert(usersTable).values({
                    name: name || email.split('@')[0],
                    email,
                    password: null,
                    authProvider: 'google',
                });
                user = (await db.select().from(usersTable)).find((u) => u.email === email);
            }

            if (!user) {
                return reply.code(500).send({ message: 'Failed to create user' });
            }

            // Sign our own JWT and set cookie (same as password login)
            const jwt = req.jwt.sign({
                id: user.id,
                email: user.email,
                name: user.name,
            });

            reply.setCookie('access_token', jwt, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
            });

            // Redirect to frontend dashboard
            return reply.redirect('http://localhost:4000/dashboard');
        } catch (error) {
            app.log.error(error);
            return reply.redirect('http://localhost:4000/login?error=oauth_failed');
        }
    });
};