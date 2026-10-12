import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(8) @MaxLength(128) password: string;
  @IsString() @MinLength(2) @MaxLength(120) fullName: string;
  @IsOptional() @IsString() @MaxLength(32) phone?: string;
}

export class LoginDto {
  @IsString() @MinLength(1) @MaxLength(254) email: string;
  @IsString() @MinLength(1) @MaxLength(128) password: string;
}

export class GoogleLoginDto {
  @IsString() @MinLength(20) @MaxLength(4096) credential: string;
  @IsString() @MinLength(16) @MaxLength(128) nonce: string;
}

export class ProfileUpdateDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) fullName?: string;
  @IsOptional() @IsString() @MaxLength(32) phone?: string;
}

export class CreateStaffDto extends RegisterDto {}
