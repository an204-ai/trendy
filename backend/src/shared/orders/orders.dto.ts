import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class OrderLineDto {
  @IsString({ message: "Mã SKU sản phẩm phải là chuỗi ký tự" })
  @MinLength(2, { message: "Mã SKU phải có ít nhất 2 ký tự" })
  @MaxLength(80, { message: "Mã SKU không được vượt quá 80 ký tự" })
  sku: string;

  @Type(() => Number)
  @IsInt({ message: "Số lượng sản phẩm phải là số nguyên" })
  @Min(1, { message: "Số lượng sản phẩm tối thiểu là 1" })
  @Max(20, { message: "Số lượng sản phẩm tối đa là 20" })
  quantity: number;
}
export class ShippingAddressDto {
  @IsString({ message: "Họ và tên người nhận phải là chuỗi ký tự" })
  @MinLength(2, { message: "Họ và tên người nhận phải có ít nhất 2 ký tự" })
  @MaxLength(120, { message: "Họ và tên người nhận không được vượt quá 120 ký tự" })
  recipientName: string;

  @IsEmail({}, { message: "Địa chỉ email không đúng định dạng" })
  @MaxLength(254, { message: "Email không được vượt quá 254 ký tự" })
  email: string;

  @IsString({ message: "Số điện thoại phải là chuỗi ký tự" })
  @MinLength(8, { message: "Số điện thoại phải có ít nhất 8 chữ số" })
  @MaxLength(32, { message: "Số điện thoại không được vượt quá 32 ký tự" })
  phone: string;

  @IsString({ message: "Địa chỉ giao hàng phải là chuỗi ký tự" })
  @MinLength(5, { message: "Địa chỉ giao hàng phải có ít nhất 5 ký tự" })
  @MaxLength(255, { message: "Địa chỉ giao hàng không được vượt quá 255 ký tự" })
  addressLine: string;

  @IsOptional() @IsString({ message: "Phường/Xã phải là chuỗi ký tự" }) @MaxLength(120, { message: "Phường/Xã không được vượt quá 120 ký tự" }) ward?: string;
  @IsOptional() @IsString({ message: "Quận/Huyện phải là chuỗi ký tự" }) @MaxLength(120, { message: "Quận/Huyện không được vượt quá 120 ký tự" }) district?: string;
  @IsString({ message: "Tỉnh/Thành phố phải là chuỗi ký tự" }) @MinLength(2, { message: "Tỉnh/Thành phố phải có ít nhất 2 ký tự" }) @MaxLength(120, { message: "Tỉnh/Thành phố không được vượt quá 120 ký tự" }) province: string;
}
export class CreateOrderDto {
  @IsArray({ message: "Danh sách sản phẩm không hợp lệ" })
  @ArrayMinSize(1, { message: "Đơn hàng phải có ít nhất một sản phẩm" })
  @ArrayMaxSize(30, { message: "Đơn hàng không được vượt quá 30 mặt hàng" })
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items: OrderLineDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shipping: ShippingAddressDto;

  @IsOptional() @IsString({ message: "Ghi chú phải là chuỗi ký tự" }) @MaxLength(1000, { message: "Ghi chú không được vượt quá 1000 ký tự" }) note?: string;
  @IsOptional() @IsString({ message: "Mã khuyến mãi phải là chuỗi ký tự" }) @MaxLength(48, { message: "Mã khuyến mãi không được vượt quá 48 ký tự" }) promotionCode?: string;
}

export class CheckPromotionDto {
  @IsString({ message: "Mã khuyến mãi phải là chuỗi ký tự" }) @MinLength(1, { message: "Vui lòng nhập mã khuyến mãi" }) @MaxLength(48, { message: "Mã khuyến mãi không được vượt quá 48 ký tự" }) code: string;
  @Type(() => Number) @IsInt({ message: "Giá trị đơn hàng phải là số nguyên" }) @Min(0, { message: "Giá trị đơn hàng không được âm" }) subtotal: number;
}

export class CreateStaffOrderDto extends CreateOrderDto {
  @IsOptional() @IsUUID("4", { message: "Mã định danh khách hàng không hợp lệ" }) customerId?: string;
}

export class UpdateOrderDto {
  @IsOptional() @IsIn(["RECEIVED", "PENDING_CONFIRMATION", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"], { message: "Trạng thái đơn hàng không hợp lệ" }) status?: string;
  @IsOptional() @IsArray({ message: "Danh sách sản phẩm không hợp lệ" }) @ArrayMinSize(1, { message: "Cần ít nhất một sản phẩm" }) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => OrderLineDto) items?: OrderLineDto[];
  @IsOptional() @IsString({ message: "Đơn vị vận chuyển phải là chuỗi ký tự" }) @MaxLength(100, { message: "Đơn vị vận chuyển tối đa 100 ký tự" }) carrier?: string;
  @IsOptional() @IsString({ message: "Mã vận đơn phải là chuỗi ký tự" }) @MaxLength(100, { message: "Mã vận đơn tối đa 100 ký tự" }) trackingNumber?: string;
  @IsOptional() @IsBoolean({ message: "Trạng thái thanh toán không hợp lệ" }) paymentCollected?: boolean;
  @IsOptional() @IsString({ message: "Ghi chú phải là chuỗi ký tự" }) @MaxLength(500, { message: "Ghi chú tối đa 500 ký tự" }) note?: string;
  @IsOptional() @IsString({ message: "Họ và tên người nhận phải là chuỗi" }) @MinLength(2, { message: "Họ và tên người nhận phải có ít nhất 2 ký tự" }) @MaxLength(120, { message: "Họ và tên người nhận tối đa 120 ký tự" }) recipientName?: string;
  @IsOptional() @IsEmail({}, { message: "Email không đúng định dạng" }) @MaxLength(254, { message: "Email tối đa 254 ký tự" }) email?: string;
  @IsOptional() @IsString({ message: "Số điện thoại phải là chuỗi" }) @MinLength(8, { message: "Số điện thoại phải có ít nhất 8 ký tự" }) @MaxLength(32, { message: "Số điện thoại tối đa 32 ký tự" }) phone?: string;
  @IsOptional() @IsString({ message: "Địa chỉ giao hàng phải là chuỗi" }) @MinLength(5, { message: "Địa chỉ giao hàng phải có ít nhất 5 ký tự" }) @MaxLength(255, { message: "Địa chỉ tối đa 255 ký tự" }) addressLine?: string;
  @IsOptional() @IsString() @MaxLength(120, { message: "Phường/Xã tối đa 120 ký tự" }) ward?: string;
  @IsOptional() @IsString() @MaxLength(120, { message: "Quận/Huyện tối đa 120 ký tự" }) district?: string;
  @IsOptional() @IsString({ message: "Tỉnh/Thành phố phải là chuỗi" }) @MinLength(2, { message: "Tỉnh/Thành phố phải có ít nhất 2 ký tự" }) @MaxLength(120, { message: "Tỉnh/Thành phố tối đa 120 ký tự" }) province?: string;
  @IsOptional() @IsString() @MaxLength(1000, { message: "Ghi chú tối đa 1000 ký tự" }) customerNote?: string;
}

export class CancelOrderDto {
  @IsOptional() @IsString({ message: "Lý do hủy phải là chuỗi ký tự" }) @MaxLength(500, { message: "Lý do hủy không được vượt quá 500 ký tự" }) note?: string;
}

export class RefundOrderDto {
  @IsOptional() @IsString() @MaxLength(120) reference?: string;
  @IsOptional() @IsString({ message: "Ghi chú hoàn tiền phải là chuỗi ký tự" }) @MaxLength(500, { message: "Ghi chú không được vượt quá 500 ký tự" }) note?: string;
}
