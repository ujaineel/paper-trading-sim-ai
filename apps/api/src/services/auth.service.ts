import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { users } from "@trading-sim/shared/db/schema";
import type { Database } from "@trading-sim/shared/db";
import { ConflictError, UnauthorizedError } from "../utils/errors";

const SALT_ROUNDS = 12;

export class AuthService {
  constructor(private db: Database) {}

  async register(email: string, password: string, displayName: string) {
    // Check for existing user
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await this.db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        displayName,
      })
      .returning();

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async login(email: string, password: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async getUser(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return null;

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
