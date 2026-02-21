import { pgTable, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable('users', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password'),
    authProvider: text('auth_provider').notNull().default('local'),
});