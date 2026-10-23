import AsyncStorage from '@react-native-async-storage/async-storage';
import { TABLE } from '../constant';
import { enqueue } from '../sync/queue';
import { Dish, DishCategory } from '../types';
import { saveCategories } from './categoryRepo';
import { saveDishes } from './dishRepo';

const categories: DishCategory[] = [
  { BIT240160_Id: 'cat-1', BIT240160_Name: 'Appetizer', BIT240160_Description: 'Starters' },
  { BIT240160_Id: 'cat-2', BIT240160_Name: 'Main Course', BIT240160_Description: 'Main dishes' },
  { BIT240160_Id: 'cat-3', BIT240160_Name: 'Dessert', BIT240160_Description: 'Sweet dishes' },
];

const img = (id: number, thumb = false) => ({
  BIT240160_ImageUrl: `https://picsum.photos/id/${id}/400/300`,
  BIT240160_IsThumbnail: thumb,
});

const dishes: Dish[] = [
  {
    BIT240160_Id: 'dish-1', BIT240160_Name: 'Spring Rolls', BIT240160_Price: 35000,
    BIT240160_PreparationTime: 10, BIT240160_IsAvailable: true,
    BIT240160_Description: 'Crispy fried rolls', BIT240160_DishCategoryId: 'cat-1',
    BIT240160_DishImage: [img(292, true), img(312)],
  },
  {
    BIT240160_Id: 'dish-2', BIT240160_Name: 'Beef Pho', BIT240160_Price: 60000,
    BIT240160_PreparationTime: 20, BIT240160_IsAvailable: true,
    BIT240160_Description: 'Traditional noodle soup', BIT240160_DishCategoryId: 'cat-2',
    BIT240160_DishImage: [img(326, true), img(365), img(425)],
  },
  {
    BIT240160_Id: 'dish-3', BIT240160_Name: 'Grilled Chicken', BIT240160_Price: 85000,
    BIT240160_PreparationTime: 30, BIT240160_IsAvailable: false,
    BIT240160_Description: 'Charcoal grilled chicken', BIT240160_DishCategoryId: 'cat-2',
    BIT240160_DishImage: [img(493, true)],
  },
  {
    BIT240160_Id: 'dish-4', BIT240160_Name: 'Flan', BIT240160_Price: 25000,
    BIT240160_PreparationTime: 5, BIT240160_IsAvailable: true,
    BIT240160_Description: 'Caramel custard', BIT240160_DishCategoryId: 'cat-3',
    BIT240160_DishImage: [img(1080, true)],
  },
  {
    BIT240160_Id: 'dish-5', BIT240160_Name: 'Fruit Salad', BIT240160_Price: 30000,
    BIT240160_PreparationTime: 15, BIT240160_IsAvailable: true,
    BIT240160_Description: 'Fresh seasonal fruit', BIT240160_DishCategoryId: 'cat-3',
    BIT240160_DishImage: [img(1080, true), img(1084)],
  },
];

// Chỉ seed khi "bảng" chưa từng tồn tại (key null) -> xóa hết món vẫn không bị seed lại
export async function seedIfEmpty() {
  try {
    if ((await AsyncStorage.getItem(TABLE.category)) === null) {
      await saveCategories(categories);
      for (const c of categories) await enqueue('category', 'upsert', c.BIT240160_Id);
    }
    if ((await AsyncStorage.getItem(TABLE.dish)) === null) {
      await saveDishes(dishes);
      for (const d of dishes) await enqueue('dish', 'upsert', d.BIT240160_Id);
    }
  } catch {
    // bỏ qua - app vẫn chạy với dữ liệu rỗng
  }
}
