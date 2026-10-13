import { randomBytes } from "node:crypto";
import { DataSource } from "typeorm";
import { UserPrincipal } from "../auth/auth.types";
import {
  CustomerOrder,
  OrderItem,
  OrderStatusHistory,
  OrderTransaction,
  Product,
  ProductVariant,
  Promotion,
} from "../database/entities";
import { CreateOrderDto } from "./orders.dto";

export interface OrderCreationResult {
  success: boolean;
  orderCode?: string;
  statusCode?: number;
  message?: string;
}

export async function executeOrderCreation(
  dataSource: DataSource,
  customer: UserPrincipal | null,
  dto: CreateOrderDto,
  idempotencyKey?: string,
  actor: UserPrincipal = customer!
): Promise<OrderCreationResult> {
  // 1. Kiểm tra đơn hàng trùng theo idempotencyKey (nếu có)
  if (idempotencyKey && customer?.id) {
    const existing = await dataSource.getRepository(CustomerOrder).findOne({
      where: { customerId: customer.id, idempotencyKey },
      relations: { items: true, history: true },
    });
    if (existing) {
      return { success: true, orderCode: existing.orderCode };
    }
  }

  // 2. Gom nhóm và kiểm tra số lượng theo SKU
  const quantities = new Map<string, number>();
  for (const item of dto.items) {
    const sku = item.sku.trim();
    quantities.set(sku, (quantities.get(sku) || 0) + item.quantity);
  }
  for (const [, quantity] of quantities) {
    if (quantity > 20) {
      return {
        success: false,
        statusCode: 400,
        message: "Mỗi SKU tối đa 20 sản phẩm trong một đơn hàng",
      };
    }
  }

  // 3. Thực thi transaction với khóa bi quan (pessimistic_write lock)
  // Sắp xếp SKU theo thứ tự từ điển để tránh deadlock giữa các giao dịch song song
  const sortedEntries = [...quantities.entries()].sort(([a], [b]) => a.localeCompare(b));

  try {
    return await dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const variantRepo = manager.getRepository(ProductVariant);
      const orderItems: Partial<OrderItem>[] = [];
      let subtotal = 0;
      const variantsToDeduct: { variant: ProductVariant; quantity: number }[] = [];

      for (const [sku, quantity] of sortedEntries) {
        let variant = await variantRepo
          .createQueryBuilder("variant")
          .setLock("pessimistic_write")
          .where('variant."sku" = :sku AND variant."active" = true', { sku })
          .getOne();

        let product: Product | null = null;
        if (variant) {
          product = await productRepo.findOneBy({ id: variant.productId, active: true });
        } else {
          product = await productRepo.findOneBy({ sku, active: true });
        }

        if (!product) {
          return {
            success: false,
            statusCode: 400,
            message: `Không tìm thấy sản phẩm đang bán với SKU ${sku}`,
          };
        }

        // KIỂM TRA TỒN KHO: Nếu không đủ -> Ngay lập tức từ chối và thoát, KHÔNG TẠO ĐƠN VÀO DB
        if (variant && variant.stockOnHand !== null) {
          if (variant.stockOnHand < quantity) {
            const variantText = variant.name ? ` (${variant.name})` : "";
            return {
              success: false,
              statusCode: 409,
              message: `Sản phẩm ${product.name}${variantText} hiện không đủ tồn kho (còn ${variant.stockOnHand}, yêu cầu ${quantity})`,
            };
          }
          variantsToDeduct.push({ variant, quantity });
        }

        const unitPrice = variant?.price ?? product.price;
        subtotal += unitPrice * quantity;
        orderItems.push({
          productId: product.id,
          variantId: variant?.id || null,
          sku,
          productCode: product.code,
          productName: product.name,
          variantName: variant?.name || null,
          unitPrice,
          quantity,
          lineTotal: unitPrice * quantity,
        });
      }

      if (!orderItems.length) {
        return {
          success: false,
          statusCode: 400,
          message: "Đơn hàng chưa có sản phẩm hợp lệ",
        };
      }

      // 4. Kiểm tra mã khuyến mãi (nếu có)
      let discountAmount = 0;
      let appliedPromo: Promotion | null = null;
      if (dto.promotionCode?.trim()) {
        const promoRepo = manager.getRepository(Promotion);
        const promo = await promoRepo
          .createQueryBuilder("p")
          .where("upper(p.code) = upper(:code)", { code: dto.promotionCode.trim() })
          .getOne();

        if (!promo || !promo.active) {
          return {
            success: false,
            statusCode: 400,
            message: "Mã khuyến mãi không tồn tại hoặc đã ngừng áp dụng",
          };
        }

        if (customer?.id) {
          const alreadyUsed = await manager
            .getRepository(CustomerOrder)
            .createQueryBuilder("o")
            .where("o.customerId = :customerId", { customerId: customer.id })
            .andWhere("upper(o.promotionCode) = upper(:code)", { code: dto.promotionCode.trim() })
            .andWhere("o.status != 'CANCELLED'")
            .andWhere("o.deletedAt IS NULL")
            .getOne();

          if (alreadyUsed) {
            return {
              success: false,
              statusCode: 400,
              message: "Bạn đã sử dụng mã khuyến mãi này cho đơn hàng trước đó",
            };
          }
        }

        const now = new Date();
        if (new Date(promo.startsAt) > now) {
          return { success: false, statusCode: 400, message: "Chương trình khuyến mãi chưa bắt đầu" };
        }
        if (new Date(promo.endsAt) < now) {
          return { success: false, statusCode: 400, message: "Mã khuyến mãi đã hết hạn sử dụng" };
        }
        if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
          return { success: false, statusCode: 400, message: "Mã khuyến mãi đã hết lượt sử dụng" };
        }
        if (subtotal < promo.minimumOrder) {
          return {
            success: false,
            statusCode: 400,
            message: `Đơn hàng tối thiểu phải từ ${promo.minimumOrder.toLocaleString("vi-VN")} đ để áp dụng mã này`,
          };
        }

        if (promo.discountType === "PERCENT") {
          discountAmount = Math.round((subtotal * promo.discountValue) / 100);
          if (promo.maximumDiscount && discountAmount > promo.maximumDiscount) {
            discountAmount = promo.maximumDiscount;
          }
        } else {
          discountAmount = promo.discountValue;
        }
        discountAmount = Math.min(discountAmount, subtotal);
        appliedPromo = promo;
      }

      // 5. TRỪ TỒN KHO AN TOÀN TRONG GIAO DỊCH (VÌ ĐÃ XÁC NHẬN ĐỦ HÀNG)
      for (const entry of variantsToDeduct) {
        entry.variant.stockOnHand = (entry.variant.stockOnHand ?? 0) - entry.quantity;
        await variantRepo.save(entry.variant);
      }

      // 6. TẠO VÀ LƯU ĐƠN HÀNG Ở TRẠNG THÁI PENDING_CONFIRMATION
      const total = Math.max(0, subtotal - discountAmount);
      const code = `TR${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;
      const orderRepo = manager.getRepository(CustomerOrder);
      const savedOrder = await orderRepo.save(
        orderRepo.create({
          orderCode: code,
          customerId: customer?.id || null,
          idempotencyKey: idempotencyKey || null,
          status: "PENDING_CONFIRMATION",
          paymentMethod: "COD",
          paymentStatus: "UNPAID",
          subtotal,
          shippingFee: 0,
          discountAmount,
          promotionCode: appliedPromo?.code || null,
          total,
          recipientName: dto.shipping.recipientName.trim(),
          email: dto.shipping.email.trim().toLowerCase(),
          phone: dto.shipping.phone.trim(),
          addressLine: dto.shipping.addressLine.trim(),
          ward: dto.shipping.ward?.trim() || null,
          district: dto.shipping.district?.trim() || null,
          province: dto.shipping.province.trim(),
          country: "Việt Nam",
          customerNote: dto.note?.trim() || null,
        })
      );

      if (appliedPromo) {
        await manager.getRepository(Promotion).increment({ id: appliedPromo.id }, "usageCount", 1);
      }

      const itemRepo = manager.getRepository(OrderItem);
      await itemRepo.save(orderItems.map((item) => itemRepo.create({ ...item, orderId: savedOrder.id })));

      await manager.getRepository(OrderStatusHistory).save({
        orderId: savedOrder.id,
        fromStatus: null,
        toStatus: "PENDING_CONFIRMATION",
        actorUserId: actor.id,
        note:
          actor.id === customer?.id
            ? "Khách hàng đặt đơn COD (Đã xử lý giữ hàng qua Message Queue)"
            : `Nhân viên ${actor.fullName} tạo đơn COD (Đã xử lý giữ hàng qua Message Queue)`,
      });

      await manager.getRepository(OrderTransaction).save({
        orderId: savedOrder.id,
        type: "COD_DUE",
        status: "PENDING",
        amount: savedOrder.total,
        note: "Đơn COD chờ thu",
        actorUserId: actor.id,
      });

      return { success: true, orderCode: savedOrder.orderCode };
    });
  } catch (err) {
    return {
      success: false,
      statusCode: (err as { status?: number }).status || 500,
      message: (err as Error).message || "Lỗi xử lý đơn hàng",
    };
  }
}
