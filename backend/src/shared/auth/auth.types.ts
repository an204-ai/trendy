import { UserRole } from "../database/entities";

export interface UserPrincipal {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
}
