import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class OrderLineDto {
  @IsString() @MinLength(2) @MaxLength(80) sku: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(20) quantity: number;
}
export class ShippingAddressDto {
  @IsString() @MinLength(2) @MaxLength(120) recipientName: string;
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(8) @MaxLength(32) phone: string;
  @IsString() @MinLength(5) @MaxLength(255) addressLine: string;
  @IsOptional() @IsString() @MaxLength(120) ward?: string;
  @IsOptional() @IsString() @MaxLength(120) district?: string;
  @IsString() @MinLength(2) @MaxLength(120) province: string;
}
export class CreateOrderDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => OrderLineDto) items: OrderLineDto[];
  @ValidateNested() @Type(() => ShippingAddressDto) shipping: ShippingAddressDto;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class CreateStaffOrderDto extends CreateOrderDto {
  @IsUUID() customerId: string;
}

export class UpdateOrderDto {
  @IsOptional() @IsIn(["RECEIVED", "PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]) status?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => OrderLineDto) items?: OrderLineDto[];
  @IsOptional() @IsString() @MaxLength(100) carrier?: string;
  @IsOptional() @IsString() @MaxLength(100) trackingNumber?: string;
  @IsOptional() @IsBoolean() paymentCollected?: boolean;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) recipientName?: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(32) phone?: string;
  @IsOptional() @IsString() @MinLength(5) @MaxLength(255) addressLine?: string;
  @IsOptional() @IsString() @MaxLength(120) ward?: string;
  @IsOptional() @IsString() @MaxLength(120) district?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) province?: string;
  @IsOptional() @IsString() @MaxLength(1000) customerNote?: string;
}

export class CancelOrderDto {
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class RefundOrderDto {
  @IsOptional() @IsString() @MaxLength(120) reference?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}
