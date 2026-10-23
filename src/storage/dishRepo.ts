import AsyncStorage from '@react-native-async-storage/async-storage';
import { TABLE } from '../constant';
import { emitLocalChange } from '../sync/events';
import { enqueue } from '../sync/queue';
import { Dish } from '../types';

export async function getDishes(): Promise<Dish[]> {
  try {
    const raw = await AsyncStorage.getItem(TABLE.dish);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Ghi thô (không đưa vào hàng đợi đồng bộ) - dùng cho seed và kéo dữ liệu từ MockAPI
export async function saveDishes(list: Dish[]) {
  await AsyncStorage.setItem(TABLE.dish, JSON.stringify(list));
}

export async function getDishById(id: string): Promise<Dish | null> {
  const list = await getDishes();
  return list.find(d => d.BIT240160_Id === id) ?? null;
}

export async function upsertDish(d: Dish) {
  const list = await getDishes();
  const i = list.findIndex(x => x.BIT240160_Id === d.BIT240160_Id);
  if (i >= 0) list[i] = d;
  else list.push(d);
  await saveDishes(list);
  await enqueue('dish', 'upsert', d.BIT240160_Id);
  emitLocalChange();
}

export async function removeDish(id: string) {
  const list = await getDishes();
  await saveDishes(list.filter(d => d.BIT240160_Id !== id));
  await enqueue('dish', 'delete', id);
  emitLocalChange();
}
