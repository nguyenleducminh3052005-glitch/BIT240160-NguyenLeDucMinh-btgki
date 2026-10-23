import { MSSV } from './constant';
void MSSV;

// Tên field có tiền tố BIT240160_ (theo đề bài)
export interface DishCategory {
  BIT240160_Id: string;
  BIT240160_Name: string;
  BIT240160_Description: string;
}

export interface DishImage {
  BIT240160_ImageUrl: string;
  BIT240160_IsThumbnail: boolean;
}

export interface Dish {
  BIT240160_Id: string;
  BIT240160_Name: string;
  BIT240160_Price: number;
  BIT240160_PreparationTime: number;
  BIT240160_IsAvailable: boolean;
  BIT240160_Description: string;
  BIT240160_DishCategoryId: string; // khóa ngoại -> DishCategory.BIT240160_Id
  BIT240160_DishImage: DishImage[];
}
