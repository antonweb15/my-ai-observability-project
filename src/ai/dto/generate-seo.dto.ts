import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class GenerateSeoDto {
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  keywords: string;

  @IsBoolean()
  @IsOptional()
  background?: boolean;
}
