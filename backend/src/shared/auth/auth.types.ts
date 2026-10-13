import { UserRole } from "../database/entities";

export interface UserPrincipal {
  id: string;
  customerCode?: string | null;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isGoogle?: boolean;
}
