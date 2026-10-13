import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum UserRole {
  CUSTOMER = "CUSTOMER",
  STAFF = "STAFF",
  ADMIN = "ADMIN",
}

export type OrderStatus =
  | "RECEIVED"
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

@Entity({ name: "User" })
@Index("User_email_unique", ["email"], { unique: true })
@Index("User_googleSubject_unique", ["googleSubject"], { unique: true, where: '"googleSubject" IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "varchar", length: 32, nullable: true, unique: true }) customerCode: string | null;
  @Column({ type: "varchar", length: 254 }) email: string;
  @Column({ type: "varchar", length: 128 }) passwordHash: string;
  @Column({ type: "varchar", length: 255, nullable: true }) googleSubject: string | null;
  @Column({ type: "varchar", length: 120 }) fullName: string;
  @Column({ type: "varchar", length: 32, nullable: true }) phone: string | null;
  @Column({ type: "varchar", length: 16, default: UserRole.CUSTOMER }) role: UserRole;
  @Column({ type: "boolean", default: true }) active: boolean;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
  @OneToMany(() => RefreshSession, (session) => session.user) sessions: RefreshSession[];
  @OneToMany(() => CustomerOrder, (order) => order.customer) orders: CustomerOrder[];
}

@Entity({ name: "RefreshSession" })
@Index("RefreshSession_tokenHash_unique", ["tokenHash"], { unique: true })
export class RefreshSession {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "uuid" }) userId: string;
  @Column({ type: "varchar", length: 64 }) tokenHash: string;
  @Column({ type: "timestamptz" }) expiresAt: Date;
  @Column({ type: "timestamptz", nullable: true }) revokedAt: Date | null;
  @Column({ type: "varchar", length: 300, nullable: true }) userAgent: string | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @ManyToOne(() => User, (user) => user.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" }) user: User;
}

@Entity({ name: "ProductCategory" })
export class ProductCategory {
  @PrimaryColumn({ type: "varchar", length: 80 }) id: string;
  @Column({ type: "varchar", length: 120 }) title: string;
  @Column({ type: "varchar", length: 160, nullable: true }) label: string | null;
  @Column({ type: "varchar", length: 80, nullable: true }) parentId: string | null;
  @Column({ type: "integer", default: 0 }) sortOrder: number;
  @Column({ type: "boolean", default: true }) active: boolean;
  @ManyToOne(() => ProductCategory, (category) => category.children, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "parentId" }) parent: ProductCategory | null;
  @OneToMany(() => ProductCategory, (category) => category.parent) children: ProductCategory[];
  @OneToMany(() => ProductCategoryLink, (link) => link.category) productLinks: ProductCategoryLink[];
}

@Entity({ name: "Product" })
@Index("Product_code_unique", ["code"], { unique: true })
@Index("Product_slug_unique", ["slug"], { unique: true })
@Index("Product_sku_unique", ["sku"], { unique: true })
export class Product {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "varchar", length: 48 }) code: string;
  @Column({ type: "varchar", length: 120 }) slug: string;
  @Column({ type: "varchar", length: 160 }) name: string;
  @Column({ type: "varchar", length: 80 }) sku: string;
  @Column({ type: "integer" }) price: number;
  @Column({ type: "text", nullable: true }) description: string | null;
  @Column({ type: "text" }) image: string;
  @Column({ type: "text", nullable: true }) front: string | null;
  @Column({ type: "jsonb", nullable: true }) specifications: Record<string, unknown> | null;
  @Column({ type: "boolean", default: true }) active: boolean;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
  @OneToMany(() => ProductVariant, (variant) => variant.product) variants: ProductVariant[];
  @OneToMany(() => ProductImage, (image) => image.product) images: ProductImage[];
  @OneToMany(() => ProductCategoryLink, (link) => link.product) categoryLinks: ProductCategoryLink[];
}

@Entity({ name: "ProductVariant" })
@Index("ProductVariant_sku_unique", ["sku"], { unique: true })
export class ProductVariant {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "uuid" }) productId: string;
  @Column({ type: "varchar", length: 80 }) sku: string;
  @Column({ type: "varchar", length: 120 }) name: string;
  @Column({ type: "varchar", length: 24, nullable: true }) swatch: string | null;
  @Column({ type: "integer", nullable: true }) price: number | null;
  @Column({ type: "integer", nullable: true }) stockOnHand: number | null;
  @Column({ type: "text", nullable: true }) image: string | null;
  @Column({ type: "boolean", default: true }) active: boolean;
  @ManyToOne(() => Product, (product) => product.variants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" }) product: Product;
}

@Entity({ name: "ProductImage" })
export class ProductImage {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "uuid" }) productId: string;
  @Column({ type: "uuid", nullable: true }) variantId: string | null;
  @Column({ type: "text" }) url: string;
  @Column({ type: "varchar", length: 180, nullable: true }) alt: string | null;
  @Column({ type: "integer", default: 0 }) position: number;
  @ManyToOne(() => Product, (product) => product.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" }) product: Product;
}

@Entity({ name: "ProductCategoryLink" })
export class ProductCategoryLink {
  @PrimaryColumn({ type: "uuid" }) productId: string;
  @PrimaryColumn({ type: "varchar", length: 80 }) categoryId: string;
  @ManyToOne(() => Product, (product) => product.categoryLinks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" }) product: Product;
  @ManyToOne(() => ProductCategory, (category) => category.productLinks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "categoryId" }) category: ProductCategory;
}

@Entity({ name: "CustomerOrder" })
@Index("CustomerOrder_orderCode_unique", ["orderCode"], { unique: true })
@Index("CustomerOrder_customer_createdAt", ["customerId", "createdAt"])
@Index("CustomerOrder_status_createdAt", ["status", "createdAt"])
export class CustomerOrder {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "varchar", length: 32 }) orderCode: string;
  @Column({ type: "uuid", nullable: true }) customerId: string | null;
  @Column({ type: "varchar", length: 100, nullable: true }) idempotencyKey: string | null;
  @Column({ type: "varchar", length: 32, default: "RECEIVED" }) status: OrderStatus;
  @Column({ type: "varchar", length: 8, default: "COD" }) paymentMethod: string;
  @Column({ type: "varchar", length: 16, default: "UNPAID" }) paymentStatus: string;
  @Column({ type: "integer" }) subtotal: number;
  @Column({ type: "integer", default: 0 }) shippingFee: number;
  @Column({ type: "integer", default: 0 }) discountAmount: number;
  @Column({ type: "varchar", length: 48, nullable: true }) promotionCode: string | null;
  @Column({ type: "integer" }) total: number;
  @Column({ type: "varchar", length: 120 }) recipientName: string;
  @Column({ type: "varchar", length: 254 }) email: string;
  @Column({ type: "varchar", length: 32 }) phone: string;
  @Column({ type: "varchar", length: 255 }) addressLine: string;
  @Column({ type: "varchar", length: 120, nullable: true }) ward: string | null;
  @Column({ type: "varchar", length: 120, nullable: true }) district: string | null;
  @Column({ type: "varchar", length: 120 }) province: string;
  @Column({ type: "varchar", length: 80, default: "Việt Nam" }) country: string;
  @Column({ type: "text", nullable: true }) customerNote: string | null;
  @Column({ type: "varchar", length: 100, nullable: true }) carrier: string | null;
  @Column({ type: "varchar", length: 100, nullable: true }) trackingNumber: string | null;
  @Column({ type: "timestamptz", nullable: true }) deletedAt: Date | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
  @ManyToOne(() => User, (user) => user.orders, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "customerId" }) customer: User | null;
  @OneToMany(() => OrderItem, (item) => item.order) items: OrderItem[];
  @OneToMany(() => OrderStatusHistory, (history) => history.order) history: OrderStatusHistory[];
  @OneToMany(() => OrderTransaction, (transaction) => transaction.order) transactions: OrderTransaction[];
}

@Entity({ name: "OrderTransaction" })
@Index("OrderTransaction_order_createdAt", ["orderId", "createdAt"])
export class OrderTransaction {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "uuid" }) orderId: string;
  @Column({ type: "varchar", length: 32 }) type: string;
  @Column({ type: "varchar", length: 20 }) status: string;
  @Column({ type: "integer" }) amount: number;
  @Column({ type: "varchar", length: 120, nullable: true }) reference: string | null;
  @Column({ type: "text", nullable: true }) note: string | null;
  @Column({ type: "uuid", nullable: true }) actorUserId: string | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @ManyToOne(() => CustomerOrder, (order) => order.transactions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" }) order: CustomerOrder;
}

@Entity({ name: "Promotion" })
@Index("Promotion_code_unique", ["code"], { unique: true })
export class Promotion {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "varchar", length: 160 }) name: string;
  @Column({ type: "varchar", length: 48 }) code: string;
  @Column({ type: "varchar", length: 12 }) discountType: string;
  @Column({ type: "integer" }) discountValue: number;
  @Column({ type: "integer", default: 0 }) minimumOrder: number;
  @Column({ type: "integer", nullable: true }) maximumDiscount: number | null;
  @Column({ type: "integer", nullable: true }) usageLimit: number | null;
  @Column({ type: "integer", default: 0 }) usageCount: number;
  @Column({ type: "timestamptz" }) startsAt: Date;
  @Column({ type: "timestamptz" }) endsAt: Date;
  @Column({ type: "boolean", default: true }) active: boolean;
  @Column({ type: "uuid", nullable: true }) createdBy: string | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
}

@Entity({ name: "Conversation" })
@Index("Conversation_customer_status", ["customerId", "status"])
export class Conversation {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "uuid" }) customerId: string;
  @Column({ type: "varchar", length: 16, default: "OPEN" }) status: string;
  @Column({ type: "timestamptz", nullable: true }) lastMessageAt: Date | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
  @ManyToOne(() => User, { onDelete: "CASCADE" }) @JoinColumn({ name: "customerId" }) customer: User;
  @OneToMany(() => ChatMessage, (message) => message.conversation) messages: ChatMessage[];
}

@Entity({ name: "ChatMessage" })
@Index("ChatMessage_conversation_createdAt", ["conversationId", "createdAt"])
export class ChatMessage {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "uuid" }) conversationId: string;
  @Column({ type: "uuid" }) senderUserId: string;
  @Column({ type: "text" }) body: string;
  @Column({ type: "boolean", default: false }) readByStaff: boolean;
  @Column({ type: "boolean", default: false }) readByCustomer: boolean;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "conversationId" }) conversation: Conversation;
  @ManyToOne(() => User, { onDelete: "CASCADE" }) @JoinColumn({ name: "senderUserId" }) sender: User;
}

@Entity({ name: "OrderItem" })
export class OrderItem {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "uuid" }) orderId: string;
  @Column({ type: "uuid", nullable: true }) productId: string | null;
  @Column({ type: "uuid", nullable: true }) variantId: string | null;
  @Column({ type: "varchar", length: 80 }) sku: string;
  @Column({ type: "varchar", length: 48 }) productCode: string;
  @Column({ type: "varchar", length: 160 }) productName: string;
  @Column({ type: "varchar", length: 120, nullable: true }) variantName: string | null;
  @Column({ type: "integer" }) unitPrice: number;
  @Column({ type: "integer" }) quantity: number;
  @Column({ type: "integer" }) lineTotal: number;
  @ManyToOne(() => CustomerOrder, (order) => order.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" }) order: CustomerOrder;
}

@Entity({ name: "OrderStatusHistory" })
@Index("OrderStatusHistory_order_createdAt", ["orderId", "createdAt"])
export class OrderStatusHistory {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "uuid" }) orderId: string;
  @Column({ type: "varchar", length: 32, nullable: true }) fromStatus: string | null;
  @Column({ type: "varchar", length: 32 }) toStatus: string;
  @Column({ type: "uuid", nullable: true }) actorUserId: string | null;
  @Column({ type: "text", nullable: true }) note: string | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @ManyToOne(() => CustomerOrder, (order) => order.history, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" }) order: CustomerOrder;
}

@Entity({ name: "OutboxEvent" })
@Index("OutboxEvent_pending", ["publishedAt", "createdAt"])
export class OutboxEvent {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ type: "varchar", length: 80 }) eventName: string;
  @Column({ type: "uuid" }) aggregateId: string;
  @Column({ type: "jsonb" }) payload: Record<string, unknown>;
  @Column({ type: "integer", default: 0 }) attempts: number;
  @Column({ type: "text", nullable: true }) lastError: string | null;
  @Column({ type: "timestamptz", nullable: true }) publishedAt: Date | null;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}

@Entity({ name: "ProcessedMessage" })
export class ProcessedMessage {
  @PrimaryColumn({ type: "varchar", length: 64 }) id: string;
  @Column({ type: "varchar", length: 80 }) eventName: string;
  @CreateDateColumn({ type: "timestamptz" }) processedAt: Date;
}

export const databaseEntities = [
  User,
  RefreshSession,
  ProductCategory,
  Product,
  ProductVariant,
  ProductImage,
  ProductCategoryLink,
  CustomerOrder,
  OrderTransaction,
  OrderItem,
  OrderStatusHistory,
  OutboxEvent,
  ProcessedMessage,
  Promotion,
  Conversation,
  ChatMessage,
];
