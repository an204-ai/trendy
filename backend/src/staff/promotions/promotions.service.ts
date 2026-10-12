import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Promotion } from "../../shared/database/entities";
import { UserPrincipal } from "../../shared/auth/auth.types";
import { CreatePromotionDto, UpdatePromotionDto } from "./promotions.dto";

@Injectable()
export class PromotionsService {
  constructor(@InjectRepository(Promotion) private readonly promotions: Repository<Promotion>) {}

  list() { return this.promotions.find({ order: { updatedAt: "DESC" } }); }

  async create(actor: UserPrincipal, dto: CreatePromotionDto) {
    this.validate(dto);
    await this.assertCodeAvailable(dto.code);
    const promotion = this.promotions.create({
      name: dto.name.trim(), code: dto.code.trim().toLocaleUpperCase(), discountType: dto.discountType,
      discountValue: dto.discountValue, minimumOrder: dto.minimumOrder ?? 0, maximumDiscount: dto.maximumDiscount ?? null,
      usageLimit: dto.usageLimit ?? null, startsAt: new Date(dto.startsAt), endsAt: new Date(dto.endsAt),
      active: dto.active ?? true, createdBy: actor.id,
    });
    return this.promotions.save(promotion);
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const promotion = await this.promotions.findOneBy({ id });
    if (!promotion) throw new NotFoundException("Không tìm thấy chương trình khuyến mãi");
    const values = {
      name: dto.name ?? promotion.name,
      code: dto.code ?? promotion.code,
      discountType: dto.discountType ?? promotion.discountType,
      discountValue: dto.discountValue ?? promotion.discountValue,
      minimumOrder: dto.minimumOrder ?? promotion.minimumOrder,
      maximumDiscount: dto.maximumDiscount !== undefined ? dto.maximumDiscount : promotion.maximumDiscount,
      usageLimit: dto.usageLimit !== undefined ? dto.usageLimit : promotion.usageLimit,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : promotion.startsAt,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : promotion.endsAt,
    };
    this.validate(values);
    if (dto.code && dto.code.trim().toLocaleUpperCase() !== promotion.code) await this.assertCodeAvailable(dto.code, id);
    Object.assign(promotion, values, { name: values.name.trim(), code: values.code.trim().toLocaleUpperCase(), ...(dto.active !== undefined ? { active: dto.active } : {}) });
    return this.promotions.save(promotion);
  }

  async remove(id: string) {
    const promotion = await this.promotions.findOneBy({ id });
    if (!promotion) throw new NotFoundException("Không tìm thấy chương trình khuyến mãi");
    await this.promotions.remove(promotion);
    return { id, deleted: true };
  }

  private validate(values: { discountType: string; discountValue: number; startsAt: string | Date; endsAt: string | Date }) {
    if (values.discountType === "PERCENT" && values.discountValue > 100) throw new BadRequestException("Mức giảm theo phần trăm không thể vượt quá 100%");
    if (new Date(values.endsAt) <= new Date(values.startsAt)) throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
  }

  private async assertCodeAvailable(code: string, exceptId?: string) {
    const query = this.promotions.createQueryBuilder("promotion").where('upper("promotion"."code") = upper(:code)', { code: code.trim() });
    if (exceptId) query.andWhere('"promotion"."id" <> :exceptId', { exceptId });
    if (await query.getOne()) throw new ConflictException("Mã khuyến mãi đã được sử dụng");
  }
}
