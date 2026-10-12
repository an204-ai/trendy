import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SendChatMessageDto {
  @IsString() @MinLength(1) @MaxLength(4000) body: string;
}

export class UpdateConversationDto {
  @IsIn(["OPEN", "CLOSED"]) status: "OPEN" | "CLOSED";
}
