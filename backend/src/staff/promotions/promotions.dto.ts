import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreatePromotionDto {
  @IsString() @MinLength(2) @MaxLength(160) name: string;
  @IsString() @MinLength(3) @MaxLength(48) code: string;
  @IsIn(["PERCENT", "FIXED"]) discountType: "PERCENT" | "FIXED";
  @Type(() => Number) @IsInt() @Min(1) discountValue: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minimumOrder?: number;
  @IsOptional() @Transform(({ value }) => value === "" || value === null ? null : Number(value)) @IsInt() @Min(1) maximumDiscount?: number | null;
  @IsOptional() @Transform(({ value }) => value === "" || value === null ? null : Number(value)) @IsInt() @Min(1) usageLimit?: number | null;
  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdatePromotionDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(48) code?: string;
  @IsOptional() @IsIn(["PERCENT", "FIXED"]) discountType?: "PERCENT" | "FIXED";
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) discountValue?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minimumOrder?: number;
  @IsOptional() @Transform(({ value }) => value === "" || value === null ? null : Number(value)) @IsInt() @Min(1) maximumDiscount?: number | null;
  @IsOptional() @Transform(({ value }) => value === "" || value === null ? null : Number(value)) @IsInt() @Min(1) usageLimit?: number | null;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
