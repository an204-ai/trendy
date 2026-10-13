import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreatePromotionDto {
  @IsString({ message: "Tên chương trình phải là chuỗi ký tự" }) @MinLength(2, { message: "Tên chương trình phải có ít nhất 2 ký tự" }) @MaxLength(160, { message: "Tên chương trình không được vượt quá 160 ký tự" }) name: string;
  @IsString({ message: "Mã khuyến mãi phải là chuỗi ký tự" }) @MinLength(3, { message: "Mã khuyến mãi phải có ít nhất 3 ký tự" }) @MaxLength(48, { message: "Mã khuyến mãi không được vượt quá 48 ký tự" }) code: string;
  @IsIn(["PERCENT", "FIXED"], { message: "Hình thức giảm giá không hợp lệ" }) discountType: "PERCENT" | "FIXED";
  @Type(() => Number) @IsInt({ message: "Mức giảm giá phải là số nguyên" }) @Min(1, { message: "Mức giảm giá tối thiểu là 1" }) discountValue: number;
  @IsOptional() @Type(() => Number) @IsInt({ message: "Đơn tối thiểu phải là số nguyên" }) @Min(0, { message: "Đơn tối thiểu không được âm" }) minimumOrder?: number;
  @IsOptional() @Transform(({ value }) => value === "" || value === null ? null : Number(value)) @IsInt({ message: "Giảm tối đa phải là số nguyên" }) @Min(1, { message: "Giảm tối đa tối thiểu là 1" }) maximumDiscount?: number | null;
  @IsOptional() @Transform(({ value }) => value === "" || value === null ? null : Number(value)) @IsInt({ message: "Giới hạn sử dụng phải là số nguyên" }) @Min(1, { message: "Giới hạn sử dụng tối thiểu là 1" }) usageLimit?: number | null;
  @IsDateString({}, { message: "Thời gian bắt đầu không hợp lệ" }) startsAt: string;
  @IsDateString({}, { message: "Thời gian kết thúc không hợp lệ" }) endsAt: string;
  @IsOptional() @IsBoolean({ message: "Trạng thái không hợp lệ" }) active?: boolean;
}

export class UpdatePromotionDto {
  @IsOptional() @IsString({ message: "Tên chương trình phải là chuỗi ký tự" }) @MinLength(2, { message: "Tên chương trình phải có ít nhất 2 ký tự" }) @MaxLength(160, { message: "Tên chương trình không được vượt quá 160 ký tự" }) name?: string;
  @IsOptional() @IsString({ message: "Mã khuyến mãi phải là chuỗi ký tự" }) @MinLength(3, { message: "Mã khuyến mãi phải có ít nhất 3 ký tự" }) @MaxLength(48, { message: "Mã khuyến mãi không được vượt quá 48 ký tự" }) code?: string;
  @IsOptional() @IsIn(["PERCENT", "FIXED"], { message: "Hình thức giảm giá không hợp lệ" }) discountType?: "PERCENT" | "FIXED";
  @IsOptional() @Type(() => Number) @IsInt({ message: "Mức giảm giá phải là số nguyên" }) @Min(1, { message: "Mức giảm giá tối thiểu là 1" }) discountValue?: number;
  @IsOptional() @Type(() => Number) @IsInt({ message: "Đơn tối thiểu phải là số nguyên" }) @Min(0, { message: "Đơn tối thiểu không được âm" }) minimumOrder?: number;
  @IsOptional() @Transform(({ value }) => value === "" || value === null ? null : Number(value)) @IsInt({ message: "Giảm tối đa phải là số nguyên" }) @Min(1, { message: "Giảm tối đa tối thiểu là 1" }) maximumDiscount?: number | null;
  @IsOptional() @Transform(({ value }) => value === "" || value === null ? null : Number(value)) @IsInt({ message: "Giới hạn sử dụng phải là số nguyên" }) @Min(1, { message: "Giới hạn sử dụng tối thiểu là 1" }) usageLimit?: number | null;
  @IsOptional() @IsDateString({}, { message: "Thời gian bắt đầu không hợp lệ" }) startsAt?: string;
  @IsOptional() @IsDateString({}, { message: "Thời gian kết thúc không hợp lệ" }) endsAt?: string;
  @IsOptional() @IsBoolean({ message: "Trạng thái không hợp lệ" }) active?: boolean;
}
