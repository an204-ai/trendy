import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";

export class ProductVariantInputDto {
  @IsString({ message: "Mã SKU biến thể phải là chuỗi ký tự" })
  @MinLength(2, { message: "Mã SKU biến thể phải có ít nhất 2 ký tự" })
  @MaxLength(80, { message: "Mã SKU biến thể không được vượt quá 80 ký tự" })
  sku: string;

  @IsString({ message: "Tên biến thể phải là chuỗi ký tự" })
  @MinLength(1, { message: "Tên biến thể không được để trống" })
  @MaxLength(120, { message: "Tên biến thể không được vượt quá 120 ký tự" })
  name: string;

  @IsOptional() @IsString({ message: "Mã màu phải là chuỗi ký tự" }) @MaxLength(24, { message: "Mã màu không được vượt quá 24 ký tự" }) swatch?: string;
  @IsOptional() @Type(() => Number) @IsInt({ message: "Giá biến thể phải là số nguyên" }) @Min(0, { message: "Giá biến thể không được âm" }) price?: number;
  @IsOptional() @Type(() => Number) @IsInt({ message: "Tồn kho biến thể phải là số nguyên" }) @Min(0, { message: "Tồn kho biến thể không được âm" }) stockOnHand?: number;
  @IsOptional() @IsString({ message: "Hình ảnh biến thể không hợp lệ" }) @MaxLength(20000000) image?: string;
}

export class CreateProductDto {
  @IsString({ message: "Mã sản phẩm phải là chuỗi ký tự" })
  @MinLength(2, { message: "Mã sản phẩm phải có ít nhất 2 ký tự" })
  @MaxLength(48, { message: "Mã sản phẩm không được vượt quá 48 ký tự" })
  code: string;

  @IsString({ message: "Đường dẫn tĩnh phải là chuỗi ký tự" })
  @MinLength(2, { message: "Đường dẫn tĩnh phải có ít nhất 2 ký tự" })
  @MaxLength(120, { message: "Đường dẫn tĩnh không được vượt quá 120 ký tự" })
  slug: string;

  @IsString({ message: "Tên sản phẩm phải là chuỗi ký tự" })
  @MinLength(2, { message: "Tên sản phẩm phải có ít nhất 2 ký tự" })
  @MaxLength(160, { message: "Tên sản phẩm không được vượt quá 160 ký tự" })
  name: string;

  @IsString({ message: "Mã SKU phải là chuỗi ký tự" })
  @MinLength(2, { message: "Mã SKU phải có ít nhất 2 ký tự" })
  @MaxLength(80, { message: "Mã SKU không được vượt quá 80 ký tự" })
  sku: string;

  @Type(() => Number)
  @IsInt({ message: "Giá bán tiêu chuẩn phải là số nguyên" })
  @Min(0, { message: "Giá bán tiêu chuẩn không được âm" })
  price: number;

  @IsString({ message: "Vui lòng chọn hình ảnh đại diện cho sản phẩm" })
  @MinLength(1, { message: "Vui lòng chọn hình ảnh đại diện cho sản phẩm" })
  @MaxLength(20000000)
  image: string;

  @IsOptional() @IsString() @MaxLength(20000000) front?: string;
  @IsOptional() @IsString({ message: "Mô tả sản phẩm phải là chuỗi ký tự" }) @MaxLength(10000, { message: "Mô tả không được vượt quá 10.000 ký tự" }) description?: string;
  @IsOptional() @IsObject({ message: "Thông số sản phẩm không hợp lệ" }) specifications?: Record<string, unknown>;
  @IsOptional() @IsArray({ message: "Thư viện hình ảnh phải là mảng" }) @ArrayMaxSize(12, { message: "Tối đa 12 hình ảnh thư viện" }) @IsString({ each: true }) images?: string[];
  @IsArray({ message: "Danh mục sản phẩm không hợp lệ" }) @ArrayMaxSize(20, { message: "Tối đa 20 danh mục" }) @IsString({ each: true, message: "Mã danh mục không hợp lệ" }) categoryIds: string[];
  @IsArray({ message: "Danh sách biến thể không hợp lệ" }) @ArrayMinSize(1, { message: "Cần ít nhất một biến thể sản phẩm" }) @ArrayMaxSize(150, { message: "Tối đa 150 biến thể sản phẩm" }) @ValidateNested({ each: true }) @Type(() => ProductVariantInputDto) variants: ProductVariantInputDto[];
  @IsOptional() @IsBoolean({ message: "Trạng thái sản phẩm không hợp lệ" }) active?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString({ message: "Mã sản phẩm phải là chuỗi ký tự" }) @MinLength(2, { message: "Mã sản phẩm phải có ít nhất 2 ký tự" }) @MaxLength(48, { message: "Mã sản phẩm không được vượt quá 48 ký tự" }) code?: string;
  @IsOptional() @IsString({ message: "Đường dẫn tĩnh phải là chuỗi ký tự" }) @MinLength(2, { message: "Đường dẫn tĩnh phải có ít nhất 2 ký tự" }) @MaxLength(120, { message: "Đường dẫn tĩnh không được vượt quá 120 ký tự" }) slug?: string;
  @IsOptional() @IsString({ message: "Tên sản phẩm phải là chuỗi ký tự" }) @MinLength(2, { message: "Tên sản phẩm phải có ít nhất 2 ký tự" }) @MaxLength(160, { message: "Tên sản phẩm không được vượt quá 160 ký tự" }) name?: string;
  @IsOptional() @IsString({ message: "Mã SKU phải là chuỗi ký tự" }) @MinLength(2, { message: "Mã SKU phải có ít nhất 2 ký tự" }) @MaxLength(80, { message: "Mã SKU không được vượt quá 80 ký tự" }) sku?: string;
  @IsOptional() @Type(() => Number) @IsInt({ message: "Giá bán phải là số nguyên" }) @Min(0, { message: "Giá bán không được âm" }) price?: number;
  @IsOptional() @IsString({ message: "Vui lòng chọn hình ảnh đại diện cho sản phẩm" }) @MinLength(1, { message: "Vui lòng chọn hình ảnh đại diện cho sản phẩm" }) @MaxLength(20000000) image?: string;
  @IsOptional() @IsString() @MaxLength(20000000) front?: string;
  @IsOptional() @IsString({ message: "Mô tả sản phẩm phải là chuỗi ký tự" }) @MaxLength(10000, { message: "Mô tả không được vượt quá 10.000 ký tự" }) description?: string;
  @IsOptional() @IsObject({ message: "Thông số sản phẩm không hợp lệ" }) specifications?: Record<string, unknown>;
  @IsOptional() @IsArray({ message: "Thư viện hình ảnh phải là mảng" }) @ArrayMaxSize(12, { message: "Tối đa 12 hình ảnh thư viện" }) @IsString({ each: true }) images?: string[];
  @IsOptional() @IsArray({ message: "Danh mục sản phẩm không hợp lệ" }) @ArrayMaxSize(20, { message: "Tối đa 20 danh mục" }) @IsString({ each: true, message: "Mã danh mục không hợp lệ" }) categoryIds?: string[];
  @IsOptional() @IsArray({ message: "Danh sách biến thể không hợp lệ" }) @ArrayMinSize(1, { message: "Cần ít nhất một biến thể sản phẩm" }) @ArrayMaxSize(150, { message: "Tối đa 150 biến thể sản phẩm" }) @ValidateNested({ each: true }) @Type(() => ProductVariantInputDto) variants?: ProductVariantInputDto[];
  @IsOptional() @IsBoolean({ message: "Trạng thái sản phẩm không hợp lệ" }) active?: boolean;
}

export class UpdateStockDto {
  @Type(() => Number) @IsInt({ message: "Tồn kho phải là số nguyên" }) @Min(0, { message: "Tồn kho không được âm" }) @Max(1000000, { message: "Tồn kho tối đa 1.000.000" }) stockOnHand: number;
}

export class CreateCategoryDto {
  @IsOptional() @IsString({ message: "Mã danh mục phải là chuỗi ký tự" }) @MinLength(2, { message: "Mã danh mục phải có ít nhất 2 ký tự" }) @MaxLength(80, { message: "Mã danh mục không được vượt quá 80 ký tự" }) id?: string;
  @IsString({ message: "Tên danh mục phải là chuỗi ký tự" }) @MinLength(2, { message: "Tên danh mục phải có ít nhất 2 ký tự" }) @MaxLength(120, { message: "Tên danh mục không được vượt quá 120 ký tự" }) title: string;
  @IsOptional() @IsString({ message: "Tên hiển thị phải là chuỗi ký tự" }) @MaxLength(160, { message: "Tên hiển thị không được vượt quá 160 ký tự" }) label?: string;
  @IsOptional() @IsString() @MaxLength(80) parentId?: string;
  @IsOptional() @Type(() => Number) @IsInt({ message: "Thứ tự hiển thị phải là số nguyên" }) @Min(0, { message: "Thứ tự không được âm" }) @Max(10000, { message: "Thứ tự tối đa 10.000" }) sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString({ message: "Tên danh mục phải là chuỗi ký tự" }) @MinLength(2, { message: "Tên danh mục phải có ít nhất 2 ký tự" }) @MaxLength(120, { message: "Tên danh mục không được vượt quá 120 ký tự" }) title?: string;
  @IsOptional() @IsString({ message: "Tên hiển thị phải là chuỗi ký tự" }) @MaxLength(160, { message: "Tên hiển thị không được vượt quá 160 ký tự" }) label?: string;
  @IsOptional() @IsString() @MaxLength(80) parentId?: string;
  @IsOptional() @Type(() => Number) @IsInt({ message: "Thứ tự hiển thị phải là số nguyên" }) @Min(0, { message: "Thứ tự không được âm" }) @Max(10000, { message: "Thứ tự tối đa 10.000" }) sortOrder?: number;
  @IsOptional() @IsBoolean({ message: "Trạng thái không hợp lệ" }) active?: boolean;
}
