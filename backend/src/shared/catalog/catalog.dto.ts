import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class ProductVariantInputDto {
  @IsString() @MinLength(2) @MaxLength(80) sku: string;
  @IsString() @MinLength(1) @MaxLength(120) name: string;
  @IsOptional() @IsString() @MaxLength(24) swatch?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) price?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockOnHand?: number;
  @IsOptional() @IsString() @MaxLength(20000000) image?: string;
}

export class CreateProductDto {
  @IsString() @MinLength(2) @MaxLength(48) code: string;
  @IsString() @MinLength(2) @MaxLength(120) slug: string;
  @IsString() @MinLength(2) @MaxLength(160) name: string;
  @IsString() @MinLength(2) @MaxLength(80) sku: string;
  @Type(() => Number) @IsInt() @Min(0) price: number;
  @IsString() @MinLength(1) @MaxLength(20000000) image: string;
  @IsOptional() @IsString() @MaxLength(20000000) front?: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsOptional() @IsObject() specifications?: Record<string, unknown>;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) images?: string[];
  @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) categoryIds: string[];
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => ProductVariantInputDto) variants: ProductVariantInputDto[];
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(48) code?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) slug?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) sku?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) price?: number;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(20000000) image?: string;
  @IsOptional() @IsString() @MaxLength(20000000) front?: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsOptional() @IsObject() specifications?: Record<string, unknown>;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) categoryIds?: string[];
  @IsOptional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => ProductVariantInputDto) variants?: ProductVariantInputDto[];
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateStockDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(1000000) stockOnHand: number;
}

export class CreateCategoryDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) id?: string;
  @IsString() @MinLength(2) @MaxLength(120) title: string;
  @IsOptional() @IsString() @MaxLength(160) label?: string;
  @IsOptional() @IsString() @MaxLength(80) parentId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10000) sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(160) label?: string;
  @IsOptional() @IsString() @MaxLength(80) parentId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10000) sortOrder?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}
