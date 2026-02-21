import { z } from "zod";

// Data we need from user to register
const createUserSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Data we need from user to login
const createUserResponseSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
});

const loginSchema = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type LoginUserInput = z.infer<typeof loginSchema>;

const loginResponseSchema = z.object({
    accessToken: z.string(),
});

export const userSchemas = {
    createUserSchema,
    createUserResponseSchema,
    loginSchema,
    loginResponseSchema,
};