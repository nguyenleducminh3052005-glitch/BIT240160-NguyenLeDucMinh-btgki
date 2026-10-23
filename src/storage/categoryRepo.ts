import AsyncStorage from '@react-native-async-storage/async-storage';
import { TABLE } from '../constant';
import { emitLocalChange } from '../sync/events';
import { enqueue } from '../sync/queue';
import { DishCategory } from '../types';
import { getDishes } from './dishRepo';

export async function getCategories(): Promise<DishCategory[]> {
  try {
    const raw = await AsyncStorage.getItem(TABLE.category);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCategories(list: DishCategory[]) {
  await AsyncStorage.setItem(TABLE.category, JSON.stringify(list));
}

export async function upsertCategory(c: DishCategory) {
  const list = await getCategories();
  const i = list.findIndex(x => x.BIT240160_Id === c.BIT240160_Id);
  if (i >= 0) list[i] = c;
  else list.push(c);
  await saveCategories(list);
  await enqueue('category', 'upsert', c.BIT240160_Id);
  emitLocalChange();
}

// Không cho xóa loại đang được món ăn sử dụng
export async function deleteCategory(id: string): Promise<'ok' | 'in_use'> {
  const used = (await getDishes()).some(d => d.BIT240160_DishCategoryId === id);
  if (used) return 'in_use';
  const list = await getCategories();
  await saveCategories(list.filter(c => c.BIT240160_Id !== id));
  await enqueue('category', 'delete', id);
  emitLocalChange();
  return 'ok';
}
