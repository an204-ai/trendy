import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SendChatMessageDto {
  @IsString({ message: "Nội dung tin nhắn phải là chuỗi ký tự" })
  @MinLength(1, { message: "Nội dung tin nhắn không được để trống" })
  @MaxLength(4000, { message: "Nội dung tin nhắn không được vượt quá 4000 ký tự" })
  body: string;
}

export class UpdateConversationDto {
  @IsIn(["OPEN", "CLOSED"], { message: "Trạng thái hội thoại không hợp lệ" })
  status: "OPEN" | "CLOSED";
}
