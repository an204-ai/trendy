import { Controller, Get, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AccessTokenGuard, RolesGuard } from "../../shared/auth/auth.guards";
import { Roles } from "../../shared/auth/auth.decorators";
import { User, UserRole } from "../../shared/database/entities";

@Controller("staff/customers")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class StaffCustomersController {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}
  @Get() async list() {
    const customers = await this.users.find({ where: { role: UserRole.CUSTOMER, active: true }, order: { createdAt: "ASC" }, take: 500 });
    return customers.map(({ id, customerCode, email, fullName, phone }) => ({
      id,
      customerCode: customerCode || `KH${id.slice(0, 4).toUpperCase()}`,
      email,
      fullName,
      phone,
    }));
  }
}
