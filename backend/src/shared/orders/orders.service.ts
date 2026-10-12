import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes } from "node:crypto";
import { DataSource, IsNull, Repository } from "typeorm";
import { CustomerOrder, OrderItem, OrderStatus, OrderStatusHistory, OrderTransaction, OutboxEvent, Product, ProductVariant, User, UserRole } from "../database/entities";
import { UserPrincipal } from "../auth/auth.types";
import { CreateOrderDto, CreateStaffOrderDto, UpdateOrderDto } from "./orders.dto";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  RECEIVED: ["PENDING_CONFIRMATION", "CANCELLED"],
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(private readonly dataSource: DataSource, @InjectRepository(CustomerOrder) private readonly orders: Repository<CustomerOrder>) {}

  async create(customer: UserPrincipal, dto: CreateOrderDto, idempotencyKey?: string, actor: UserPrincipal = customer) {
    if (idempotencyKey?.length && idempotencyKey.length > 100) throw new BadRequestException("Idempotency-Key quá dài");
    if (idempotencyKey) {
      const existing = await this.orders.findOne({ where: { customerId: customer.id, idempotencyKey }, relations: { items: true, history: true } });
      if (existing) return this.present(existing);
    }
    const quantities = new Map<string, number>();
    for (const item of dto.items) quantities.set(item.sku.trim(), (quantities.get(item.sku.trim()) || 0) + item.quantity);
    if ([...quantities.values()].some((quantity) => quantity > 20)) throw new BadRequestException("Mỗi SKU tối đa 20 sản phẩm trong một đơn");

    try {
      const order = await this.dataSource.transaction(async (manager) => {
        const productRepo = manager.getRepository(Product);
        const variantRepo = manager.getRepository(ProductVariant);
        const orderItems: Partial<OrderItem>[] = [];
        const reservedVariants: ProductVariant[] = [];
        let subtotal = 0;

        for (const [sku, quantity] of quantities) {
          let variant = await variantRepo.createQueryBuilder("variant").setLock("pessimistic_write").where('variant."sku" = :sku AND variant."active" = true', { sku }).getOne();
          let product: Product | null = null;
          if (variant) product = await productRepo.findOneBy({ id: variant.productId, active: true });
          else product = await productRepo.findOneBy({ sku, active: true });
          if (!product) throw new BadRequestException(`Không tìm thấy sản phẩm đang bán với SKU ${sku}`);
          if (variant?.stockOnHand !== null && variant && variant.stockOnHand < quantity) throw new ConflictException(`Sản phẩm ${product.name} hiện không đủ tồn kho`);
          if (variant?.stockOnHand !== null && variant) {
            variant.stockOnHand -= quantity;
            reservedVariants.push(variant);
          }
          const unitPrice = variant?.price ?? product.price;
          subtotal += unitPrice * quantity;
          orderItems.push({ productId: product.id, variantId: variant?.id || null, sku, productCode: product.code, productName: product.name, variantName: variant?.name || null, unitPrice, quantity, lineTotal: unitPrice * quantity });
        }
        if (!orderItems.length) throw new BadRequestException("Đơn hàng chưa có sản phẩm hợp lệ");
        if (reservedVariants.length) await variantRepo.save(reservedVariants);

        const code = `TR${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;
        const orderRepo = manager.getRepository(CustomerOrder);
        const savedOrder = await orderRepo.save(orderRepo.create({
          orderCode: code,
          customerId: customer.id,
          idempotencyKey: idempotencyKey || null,
          status: "RECEIVED",
          paymentMethod: "COD",
          paymentStatus: "UNPAID",
          subtotal,
          shippingFee: 0,
          total: subtotal,
          recipientName: dto.shipping.recipientName.trim(),
          email: dto.shipping.email.trim().toLowerCase(),
          phone: dto.shipping.phone.trim(),
          addressLine: dto.shipping.addressLine.trim(),
          ward: dto.shipping.ward?.trim() || null,
          district: dto.shipping.district?.trim() || null,
          province: dto.shipping.province.trim(),
          country: "Việt Nam",
          customerNote: dto.note?.trim() || null,
        }));
        const itemRepo = manager.getRepository(OrderItem);
        await itemRepo.save(orderItems.map((item) => itemRepo.create({ ...item, orderId: savedOrder.id })));
        await manager.getRepository(OrderStatusHistory).save({ orderId: savedOrder.id, fromStatus: null, toStatus: "RECEIVED", actorUserId: actor.id, note: actor.id === customer.id ? "Khách hàng đặt đơn COD" : `Nhân viên ${actor.fullName} tạo đơn COD` });
        await manager.getRepository(OrderTransaction).save({ orderId: savedOrder.id, type: "COD_DUE", status: "PENDING", amount: savedOrder.total, note: "Đơn COD chờ thu", actorUserId: actor.id });
        await manager.getRepository(OutboxEvent).save({ eventName: "order.created", aggregateId: savedOrder.id, payload: { orderId: savedOrder.id, orderCode: savedOrder.orderCode }, publishedAt: null });
        return savedOrder;
      });
      return this.getOwned(customer.id, order.orderCode);
    } catch (error) {
      if (idempotencyKey && (error as { code?: string }).code === "23505") {
        const existing = await this.orders.findOne({ where: { customerId: customer.id, idempotencyKey }, relations: { items: true, history: true } });
        if (existing) return this.present(existing);
      }
      throw error;
    }
  }

  async listMine(customerId: string) {
    const rows = await this.orders.find({ where: { customerId, deletedAt: IsNull() }, relations: { items: true, history: true }, order: { createdAt: "DESC" }, take: 100 });
    return rows.map((order) => this.present(order));
  }

  async getOwned(customerId: string, orderCode: string) {
    const order = await this.orders.findOne({ where: { customerId, orderCode, deletedAt: IsNull() }, relations: { items: true, history: true } });
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
    return this.present(order);
  }

  async listForStaff(status?: string, query?: string) {
    const valid = ["RECEIVED", "PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (status && !valid.includes(status)) throw new BadRequestException("Trạng thái không hợp lệ");
    const builder = this.orders.createQueryBuilder("customerOrder")
      .leftJoinAndSelect("customerOrder.items", "items")
      .leftJoinAndSelect("customerOrder.history", "history")
      .leftJoinAndSelect("customerOrder.customer", "customer")
      .where("customerOrder.deletedAt IS NULL");
    if (status) builder.andWhere("customerOrder.status = :status", { status });
    if (query?.trim()) builder.andWhere("customerOrder.orderCode ILIKE :query", { query: `%${query.trim()}%` });
    const rows = await builder.orderBy("customerOrder.createdAt", "DESC").take(200).getMany();
    return rows.map((order) => this.present(order, true));
  }

  async createForStaff(actor: UserPrincipal, dto: CreateStaffOrderDto) {
    const customer = await this.dataSource.getRepository(User).findOneBy({ id: dto.customerId, role: UserRole.CUSTOMER, active: true });
    if (!customer) throw new NotFoundException("Không tìm thấy tài khoản khách hàng đang hoạt động");
    const principal: UserPrincipal = { id: customer.id, email: customer.email, fullName: customer.fullName, phone: customer.phone, role: customer.role };
    const { customerId: _customerId, ...orderDto } = dto;
    return this.create(principal, orderDto, undefined, actor);
  }

  async getForStaff(orderCode: string) {
    const order = await this.orders.findOne({ where: { orderCode }, relations: { items: true, history: true, customer: true, transactions: true } });
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
    return this.present(order, true);
  }

  async updateForStaff(orderCode: string, actor: UserPrincipal, dto: UpdateOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(CustomerOrder);
      const order = await repo.createQueryBuilder("customerOrder").setLock("pessimistic_write").where('"customerOrder"."orderCode" = :orderCode', { orderCode }).getOne();
      if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
      if (order.deletedAt) throw new ConflictException("Đơn hàng đã được đưa vào thùng rác");
      const previous = order.status;
      const nextStatus = (dto.status || order.status) as OrderStatus;
      if (nextStatus === "CANCELLED") throw new BadRequestException("Dùng chức năng hủy đơn để hệ thống hoàn tồn kho và ghi lịch sử");
      if (!Object.hasOwn(transitions, nextStatus)) throw new BadRequestException("Trạng thái không hợp lệ");
      if (nextStatus !== order.status && !transitions[order.status].includes(nextStatus)) throw new ConflictException(`Không thể chuyển đơn từ ${order.status} sang ${nextStatus}`);
      if (nextStatus === "SHIPPED" && (!dto.carrier?.trim() && !order.carrier || !dto.trackingNumber?.trim() && !order.trackingNumber)) throw new BadRequestException("Cần nhập đơn vị vận chuyển và mã vận đơn trước khi giao");
      if (dto.items && ["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status)) throw new ConflictException("Không thể sửa sản phẩm sau khi đơn đã rời kho hoặc kết thúc");

      if (dto.items) {
        const quantities = new Map<string, number>();
        for (const item of dto.items) quantities.set(item.sku.trim(), (quantities.get(item.sku.trim()) || 0) + item.quantity);
        if ([...quantities.values()].some((quantity) => quantity > 20)) throw new BadRequestException("Mỗi SKU tối đa 20 sản phẩm trong một đơn");

        const itemRepo = manager.getRepository(OrderItem);
        const variantRepo = manager.getRepository(ProductVariant);
        const productRepo = manager.getRepository(Product);
        const oldItems = await itemRepo.find({ where: { orderId: order.id } });
        const oldQuantities = new Map<string, number>();
        for (const item of oldItems) oldQuantities.set(item.sku, (oldQuantities.get(item.sku) || 0) + item.quantity);
        const itemsChanged = oldQuantities.size !== quantities.size || [...quantities].some(([sku, quantity]) => oldQuantities.get(sku) !== quantity);
        if (itemsChanged) {
          const oldVariantIds = [...new Set(oldItems.map((item) => item.variantId).filter((id): id is string => Boolean(id)))].sort();
          for (const variantId of oldVariantIds) {
            const variant = await variantRepo.createQueryBuilder("variant").setLock("pessimistic_write").where('variant."id" = :variantId', { variantId }).getOne();
            if (variant?.stockOnHand !== null && variant) {
              variant.stockOnHand += oldItems.filter((item) => item.variantId === variant.id).reduce((sum, item) => sum + item.quantity, 0);
              await variantRepo.save(variant);
            }
          }

          const nextItems: Partial<OrderItem>[] = [];
          let subtotal = 0;
          for (const [sku, quantity] of [...quantities.entries()].sort(([left], [right]) => left.localeCompare(right))) {
            const variant = await variantRepo.createQueryBuilder("variant").setLock("pessimistic_write").where('variant."sku" = :sku AND variant."active" = true', { sku }).getOne();
            const product = variant
              ? await productRepo.findOneBy({ id: variant.productId, active: true })
              : await productRepo.findOneBy({ sku, active: true });
            if (!product) throw new BadRequestException(`Không tìm thấy sản phẩm đang bán với SKU ${sku}`);
            if (variant?.stockOnHand !== null && variant && variant.stockOnHand < quantity) throw new ConflictException(`Sản phẩm ${product.name} hiện không đủ tồn kho`);
            if (variant?.stockOnHand !== null && variant) {
              variant.stockOnHand -= quantity;
              await variantRepo.save(variant);
            }
            const unitPrice = variant?.price ?? product.price;
            subtotal += unitPrice * quantity;
            nextItems.push({ orderId: order.id, productId: product.id, variantId: variant?.id || null, sku, productCode: product.code, productName: product.name, variantName: variant?.name || null, unitPrice, quantity, lineTotal: unitPrice * quantity });
          }
          await itemRepo.delete({ orderId: order.id });
          await itemRepo.save(nextItems.map((item) => itemRepo.create(item)));
          order.subtotal = subtotal;
          order.total = subtotal + order.shippingFee;
          await manager.getRepository(OrderTransaction).update({ orderId: order.id, type: "COD_DUE", status: "PENDING" }, { amount: order.total, note: "Đã cập nhật số tiền COD của đơn" });
        }
      }
      order.status = nextStatus;
      if (dto.carrier !== undefined) order.carrier = dto.carrier.trim() || null;
      if (dto.trackingNumber !== undefined) order.trackingNumber = dto.trackingNumber.trim() || null;
      if (dto.recipientName !== undefined) order.recipientName = dto.recipientName.trim();
      if (dto.email !== undefined) order.email = dto.email.trim().toLocaleLowerCase();
      if (dto.phone !== undefined) order.phone = dto.phone.trim();
      if (dto.addressLine !== undefined) order.addressLine = dto.addressLine.trim();
      if (dto.ward !== undefined) order.ward = dto.ward.trim() || null;
      if (dto.district !== undefined) order.district = dto.district.trim() || null;
      if (dto.province !== undefined) order.province = dto.province.trim();
      if (dto.customerNote !== undefined) order.customerNote = dto.customerNote.trim() || null;
      if (dto.paymentCollected === true) {
        if (nextStatus !== "DELIVERED") throw new BadRequestException("Chỉ xác nhận COD đã thu khi đơn giao thành công");
        if (order.paymentStatus !== "UNPAID") throw new ConflictException("Đơn hàng không còn ở trạng thái chờ thu tiền");
        order.paymentStatus = "COLLECTED";
      }
      await repo.save(order);
      await manager.getRepository(OrderStatusHistory).save({ orderId: order.id, fromStatus: previous, toStatus: nextStatus, actorUserId: actor.id, note: dto.note?.trim() || (previous === nextStatus ? "Nhân viên cập nhật thông tin đơn hàng" : null) });
      if (dto.paymentCollected === true) await manager.getRepository(OrderTransaction).save({ orderId: order.id, type: "COD_COLLECTION", status: "COMPLETED", amount: order.total, actorUserId: actor.id, note: dto.note?.trim() || "Nhân viên xác nhận thu COD" });
      const updated = await repo.findOne({ where: { id: order.id }, relations: { items: true, history: true, customer: true, transactions: true } });
      return this.present(updated!, true);
    });
  }

  async cancelForStaff(orderCode: string, actor: UserPrincipal, note?: string) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(CustomerOrder);
      const order = await repo.createQueryBuilder("customerOrder").setLock("pessimistic_write").where('"customerOrder"."orderCode" = :orderCode', { orderCode }).getOne();
      if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
      if (order.deletedAt) throw new ConflictException("Đơn hàng đã được đưa vào thùng rác");
      if (!transitions[order.status].includes("CANCELLED")) throw new ConflictException("Đơn hàng đã giao cho vận chuyển nên không thể hủy tại đây");
      const items = await manager.getRepository(OrderItem).findBy({ orderId: order.id });
      const variantRepo = manager.getRepository(ProductVariant);
      for (const item of items) {
        if (!item.variantId) continue;
        const variant = await variantRepo.createQueryBuilder("variant").setLock("pessimistic_write").where('"variant"."id" = :id', { id: item.variantId }).getOne();
        if (variant?.stockOnHand !== null && variant) {
          variant.stockOnHand += item.quantity;
          await variantRepo.save(variant);
        }
      }
      const previous = order.status;
      order.status = "CANCELLED";
      await repo.save(order);
      await manager.getRepository(OrderStatusHistory).save({ orderId: order.id, fromStatus: previous, toStatus: "CANCELLED", actorUserId: actor.id, note: note?.trim() || "Nhân viên hủy đơn" });
      await manager.getRepository(OrderTransaction).save({ orderId: order.id, type: "COD_CANCELLED", status: "COMPLETED", amount: order.total, actorUserId: actor.id, note: "Hủy khoản COD chưa thu" });
      const updated = await repo.findOne({ where: { id: order.id }, relations: { items: true, history: true, customer: true, transactions: true } });
      return this.present(updated!, true);
    });
  }

  async refundForStaff(orderCode: string, actor: UserPrincipal, reference?: string, note?: string) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(CustomerOrder);
      const order = await repo.createQueryBuilder("customerOrder").setLock("pessimistic_write").where('"customerOrder"."orderCode" = :orderCode', { orderCode }).getOne();
      if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
      if (order.status !== "DELIVERED" || order.paymentStatus !== "COLLECTED") throw new ConflictException("Chỉ hoàn tiền cho đơn đã giao và đã thu COD");
      order.paymentStatus = "REFUNDED";
      await repo.save(order);
      await manager.getRepository(OrderTransaction).save({ orderId: order.id, type: "COD_REFUND", status: "COMPLETED", amount: order.total, reference: reference?.trim() || null, actorUserId: actor.id, note: note?.trim() || "Nhân viên xác nhận hoàn tiền" });
      await manager.getRepository(OrderStatusHistory).save({ orderId: order.id, fromStatus: order.status, toStatus: order.status, actorUserId: actor.id, note: note?.trim() || "Đã hoàn COD cho khách hàng" });
      const updated = await repo.findOne({ where: { id: order.id }, relations: { items: true, history: true, customer: true, transactions: true } });
      return this.present(updated!, true);
    });
  }

  async archiveForStaff(orderCode: string, actor: UserPrincipal) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(CustomerOrder);
      const order = await repo.createQueryBuilder("customerOrder").setLock("pessimistic_write").where('"customerOrder"."orderCode" = :orderCode', { orderCode }).getOne();
      if (!order) throw new NotFoundException("Không tìm thấy đơn hàng");
      if (!['CANCELLED', 'DELIVERED'].includes(order.status)) throw new ConflictException("Chỉ có thể xóa mềm đơn đã hủy hoặc đã giao");
      if (order.deletedAt) throw new ConflictException("Đơn hàng đã ở trong thùng rác");
      order.deletedAt = new Date();
      await repo.save(order);
      await manager.getRepository(OrderStatusHistory).save({ orderId: order.id, fromStatus: order.status, toStatus: order.status, actorUserId: actor.id, note: "Nhân viên đưa đơn vào thùng rác" });
      return { orderCode, deleted: true };
    });
  }

  private present(order: CustomerOrder, includeCustomer = false) {
    return {
      id: order.id,
      orderCode: order.orderCode,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      shipping: { recipientName: order.recipientName, email: order.email, phone: order.phone, addressLine: order.addressLine, ward: order.ward, district: order.district, province: order.province, country: order.country },
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      deletedAt: order.deletedAt,
      note: order.customerNote,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      ...(includeCustomer && order.customer ? { customer: { id: order.customer.id, email: order.customer.email, fullName: order.customer.fullName, phone: order.customer.phone } } : {}),
      items: (order.items || []).map((item) => ({ sku: item.sku, productCode: item.productCode, productName: item.productName, variantName: item.variantName, unitPrice: item.unitPrice, quantity: item.quantity, lineTotal: item.lineTotal })),
      history: (order.history || []).map((entry) => ({ fromStatus: entry.fromStatus, toStatus: entry.toStatus, note: entry.note, createdAt: entry.createdAt })),
      ...(order.transactions ? { transactions: order.transactions.map((entry) => ({ id: entry.id, type: entry.type, status: entry.status, amount: entry.amount, reference: entry.reference, note: entry.note, createdAt: entry.createdAt })) } : {}),
    };
  }
}
