import AsyncStorage from '@react-native-async-storage/async-storage';
import { TABLE } from '../constant';

export type Entity = 'dish' | 'category';
export interface SyncOp {
  key: string; // `${entity}:${id}` - mỗi bản ghi chỉ giữ thao tác mới nhất
  entity: Entity;
  type: 'upsert' | 'delete';
  id: string;
  ts: number;
}

let counter = 0;

export async function getQueue(): Promise<SyncOp[]> {
  try {
    const raw = await AsyncStorage.getItem(TABLE.queue);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(q: SyncOp[]) {
  await AsyncStorage.setItem(TABLE.queue, JSON.stringify(q));
}

export async function enqueue(entity: Entity, type: 'upsert' | 'delete', id: string) {
  const key = `${entity}:${id}`;
  const q = (await getQueue()).filter(o => o.key !== key);
  q.push({ key, entity, type, id, ts: Date.now() * 1000 + (counter++ % 1000) });
  await saveQueue(q);
}

// Chỉ xóa thao tác nếu nó chưa bị thay thế bởi thao tác mới hơn trong lúc đang sync
export async function removeOpIfUnchanged(op: SyncOp) {
  const q = await getQueue();
  await saveQueue(q.filter(o => !(o.key === op.key && o.ts === op.ts)));
}
