import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { UserRole } from "../database/entities";

export class RegisterDto {
  @IsEmail({}, { message: "Địa chỉ email không đúng định dạng" }) @MaxLength(254, { message: "Email không được vượt quá 254 ký tự" }) email: string;
  @IsString({ message: "Mật khẩu phải là chuỗi ký tự" }) @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }) @MaxLength(128, { message: "Mật khẩu không được vượt quá 128 ký tự" }) password: string;
  @IsString({ message: "Họ và tên phải là chuỗi ký tự" }) @MinLength(2, { message: "Họ và tên phải có ít nhất 2 ký tự" }) @MaxLength(120, { message: "Họ và tên không được vượt quá 120 ký tự" }) fullName: string;
  @IsOptional() @IsString({ message: "Số điện thoại phải là chuỗi ký tự" }) @MaxLength(32, { message: "Số điện thoại không được vượt quá 32 ký tự" }) phone?: string;
}

export class LoginDto {
  @IsString({ message: "Vui lòng nhập email" }) @MinLength(1, { message: "Vui lòng nhập email" }) @MaxLength(254) email: string;
  @IsString({ message: "Vui lòng nhập mật khẩu" }) @MinLength(1, { message: "Vui lòng nhập mật khẩu" }) @MaxLength(128) password: string;
}

export class GoogleLoginDto {
  @IsString() @MinLength(20, { message: "Mã xác thực Google không hợp lệ" }) @MaxLength(4096) credential: string;
  @IsString() @MinLength(16) @MaxLength(128) nonce: string;
}

export class ProfileUpdateDto {
  @IsOptional() @IsString({ message: "Họ và tên phải là chuỗi" }) @MinLength(2, { message: "Họ và tên phải có ít nhất 2 ký tự" }) @MaxLength(120, { message: "Họ và tên không được vượt quá 120 ký tự" }) fullName?: string;
  @IsOptional() @IsString({ message: "Số điện thoại phải là chuỗi" }) @MaxLength(32, { message: "Số điện thoại không được vượt quá 32 ký tự" }) phone?: string;
}

export class ChangePasswordDto {
  @IsString({ message: "Vui lòng nhập mật khẩu hiện tại" })
  @MinLength(1, { message: "Vui lòng nhập mật khẩu hiện tại" })
  currentPassword: string;

  @IsString({ message: "Mật khẩu mới phải là chuỗi ký tự" })
  @MinLength(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự" })
  @MaxLength(128, { message: "Mật khẩu mới không được vượt quá 128 ký tự" })
  newPassword: string;
}

export class CreateStaffDto {
  @IsEmail({}, { message: "Địa chỉ email không đúng định dạng" }) @MaxLength(254, { message: "Email không được vượt quá 254 ký tự" }) email: string;
  @IsString({ message: "Mật khẩu phải là chuỗi ký tự" }) @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }) @MaxLength(128, { message: "Mật khẩu không được vượt quá 128 ký tự" }) password: string;
  @IsString({ message: "Họ và tên phải là chuỗi ký tự" }) @MinLength(2, { message: "Họ và tên phải có ít nhất 2 ký tự" }) @MaxLength(120, { message: "Họ và tên không được vượt quá 120 ký tự" }) fullName: string;
  @IsOptional() @IsString({ message: "Số điện thoại phải là chuỗi ký tự" }) @MaxLength(32, { message: "Số điện thoại không được vượt quá 32 ký tự" }) phone?: string;
  @IsOptional() @IsEnum(UserRole, { message: "Vai trò người dùng không hợp lệ" }) role?: UserRole;
}

export class UpdateStaffDto {
  @IsOptional() @IsEmail({}, { message: "Địa chỉ email không đúng định dạng" }) @MaxLength(254, { message: "Email không được vượt quá 254 ký tự" }) email?: string;
  @IsOptional() @IsString({ message: "Họ và tên phải là chuỗi ký tự" }) @MinLength(2, { message: "Họ và tên phải có ít nhất 2 ký tự" }) @MaxLength(120, { message: "Họ và tên không được vượt quá 120 ký tự" }) fullName?: string;
  @IsOptional() @IsString({ message: "Số điện thoại phải là chuỗi ký tự" }) @MaxLength(32, { message: "Số điện thoại không được vượt quá 32 ký tự" }) phone?: string;
  @IsOptional() @IsString({ message: "Mật khẩu phải là chuỗi ký tự" }) @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }) @MaxLength(128, { message: "Mật khẩu không được vượt quá 128 ký tự" }) password?: string;
  @IsOptional() @IsBoolean({ message: "Trạng thái không hợp lệ" }) active?: boolean;
  @IsOptional() @IsEnum(UserRole, { message: "Vai trò người dùng không hợp lệ" }) role?: UserRole;
}
