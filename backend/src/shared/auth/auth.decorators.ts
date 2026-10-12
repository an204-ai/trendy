import { SetMetadata, createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserRole } from "../database/entities";
import { UserPrincipal } from "./auth.types";

export const ROLE_METADATA = "allowedRoles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLE_METADATA, roles);
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): UserPrincipal => {
  return context.switchToHttp().getRequest().user;
});
