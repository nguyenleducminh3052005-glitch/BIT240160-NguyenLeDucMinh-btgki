import { Dish, DishCategory } from './types';
import { TKey } from './i18n/translations';

// Trả về danh sách KEY dịch (không phải text cứng) để hiển thị đúng ngôn ngữ
export function validateDish(d: Dish, all: Dish[], categories: DishCategory[]): TKey[] {
  const errors: TKey[] = [];
  const name = d.BIT240160_Name.trim();
  if (!name) errors.push('err_name_required');
  if (!(d.BIT240160_Price > 0)) errors.push('err_price_positive');
  if (!(d.BIT240160_PreparationTime > 0)) errors.push('err_prep_positive');
  if (!categories.some(c => c.BIT240160_Id === d.BIT240160_DishCategoryId)) {
    errors.push('err_category_invalid');
  }
  const dup = all.some(
    x =>
      x.BIT240160_Id !== d.BIT240160_Id &&
      x.BIT240160_DishCategoryId === d.BIT240160_DishCategoryId &&
      x.BIT240160_Name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (name && dup) errors.push('err_name_duplicate');
  return errors;
}

export function validateCategory(
  name: string,
  id: string | null,
  all: DishCategory[],
): TKey[] {
  const errors: TKey[] = [];
  const n = name.trim();
  if (!n) errors.push('err_cat_name_required');
  else if (all.some(c => c.BIT240160_Id !== id && c.BIT240160_Name.trim().toLowerCase() === n.toLowerCase())) {
    errors.push('err_cat_name_duplicate');
  }
  return errors;
}
