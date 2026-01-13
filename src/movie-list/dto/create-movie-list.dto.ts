import { IsInt, IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateMovieListDto {
  @IsInt()
  @IsNotEmpty()
  year: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  studios: string;

  @IsString()
  @IsNotEmpty()
  producers: string;

  @IsBoolean()
  @IsNotEmpty()
  winner: boolean;
}
