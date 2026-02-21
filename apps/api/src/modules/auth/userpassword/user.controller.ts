import { FastifyReply, FastifyRequest } from "fastify";
import { CreateUserInput, LoginUserInput } from "./user.schema";
import bcrypt from "bcrypt";
import { db } from "../../../db";
import { usersTable } from "../../../db/schema";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS ?? '') || 10;

export async function createUser(req: FastifyRequest<{ Body: CreateUserInput }>, reply: FastifyReply) {
    const { name, email, password } = req.body;
    
    const user = ((await db.select().from(usersTable)).find((user) => user.email === email));
    
    if (user) {
        return reply.code(401).send({
            message: 'User already exists with this email'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        await db.insert(usersTable).values({
            name,
            email,
            password: hashedPassword,
        });

        const insertedUser = ((await db.select().from(usersTable)).find((user) => user.email === email));

        return reply.code(201).send(insertedUser);
    } catch (error) {
        return reply.code(500).send(error);
    }
}

export async function loginUser(req: FastifyRequest<{ Body: LoginUserInput }>, reply: FastifyReply) {
    const { email, password } = req.body;
    
    const user = ((await db.select().from(usersTable)).find((user) => user.email === email));
    
    if (!user) {
        return reply.code(401).send({
            message: 'Invalid email or password'
        });
    }

    if (!user.password) {
        return reply.code(401).send({
            message: 'This account uses Google sign-in. Please use the Google login button.'
        });
    }

    try {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return reply.code(401).send({
                message: 'Invalid email or password'
            });
        }

        const token = req.jwt.sign({
            id: user.id,
            email: user.email,
            name: user.name,
        });

        reply.setCookie('access_token', token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        });

        return reply.code(200).send({ accessToken: token });
    } catch (error) {
        return reply.code(500).send(error);
    }
}

export async function getUsers(req: FastifyRequest, reply: FastifyReply) {
    const users = (await db.select().from(usersTable)).map(({ name, id, email }) => {
        return {
            id,
            email,
            name,
        };
    });
    return reply.code(200).send(users);
}
