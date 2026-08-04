import type { Role } from '../domain/enums';

declare global {
  namespace Express {
    interface AuthContext {
      userId: string;
      name: string;
      email: string;
      role: Role;
      /** null quando o usuario e ADMIN sem cadastro de vendedor. */
      sellerId: string | null;
    }

    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};
