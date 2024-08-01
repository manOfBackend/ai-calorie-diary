import { IsString, IsNotEmpty } from 'class-validator';

export class FoodAnalysisDto {
  @IsNotEmpty()
  image: Express.Multer.File;

  @IsString()
  @IsNotEmpty()
  description: string;
}
