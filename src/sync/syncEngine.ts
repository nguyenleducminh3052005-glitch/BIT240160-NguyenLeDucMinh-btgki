import { RESOURCE, isApiConfigured } from '../constant';
import { getCategories, saveCategories } from '../storage/categoryRepo';
import { getDishes, saveDishes } from '../storage/dishRepo';
import { Dish, DishCategory } from '../types';
import { fetchAll, pushDelete, pushUpsert } from './api';
import { SyncOp, getQueue, removeOpIfUnchanged } from './queue';

export interface SyncResult {
  status: 'ok' | 'not_configured';
  changed: boolean;
}

let running = false;
let again = false;

const order = (o: SyncOp) =>
  o.type === 'upsert' ? (o.entity === 'category' ? 0 : 1) : o.entity === 'dish' ? 2 : 3;

// 1) Đẩy hàng đợi thay đổi local lên MockAPI
async function pushQueue() {
  const ops = (await getQueue()).sort((a, b) => order(a) - order(b) || a.ts - b.ts);
  for (const op of ops) {
    const resource = op.entity === 'dish' ? RESOURCE.dish : RESOURCE.category;
    if (op.type === 'delete') {
      await pushDelete(resource, op.id);
    } else {
      const item =
        op.entity === 'dish'
          ? (await getDishes()).find(d => d.BIT240160_Id === op.id)
          : (await getCategories()).find(c => c.BIT240160_Id === op.id);
      if (item) await pushUpsert(resource, item); // item đã bị xóa local thì bỏ qua
    }
    await removeOpIfUnchanged(op); // thành công mới xóa khỏi hàng đợi
  }
}

function cleanCategory(r: any): DishCategory | null {
  if (!r || typeof r.BIT240160_Id !== 'string') return null;
  return {
    BIT240160_Id: r.BIT240160_Id,
    BIT240160_Name: String(r.BIT240160_Name ?? ''),
    BIT240160_Description: String(r.BIT240160_Description ?? ''),
  };
}

function cleanDish(r: any): Dish | null {
  if (!r || typeof r.BIT240160_Id !== 'string') return null;
  const imgs = Array.isArray(r.BIT240160_DishImage) ? r.BIT240160_DishImage : [];
  return {
    BIT240160_Id: r.BIT240160_Id,
    BIT240160_Name: String(r.BIT240160_Name ?? ''),
    BIT240160_Price: Number(r.BIT240160_Price) || 0,
    BIT240160_PreparationTime: Number(r.BIT240160_PreparationTime) || 0,
    BIT240160_IsAvailable: r.BIT240160_IsAvailable === true || r.BIT240160_IsAvailable === 'true',
    BIT240160_Description: String(r.BIT240160_Description ?? ''),
    BIT240160_DishCategoryId: String(r.BIT240160_DishCategoryId ?? ''),
    BIT240160_DishImage: imgs
      .filter((i: any) => i && typeof i.BIT240160_ImageUrl === 'string')
      .map((i: any) => ({
        BIT240160_ImageUrl: i.BIT240160_ImageUrl,
        BIT240160_IsThumbnail: i.BIT240160_IsThumbnail === true,
      })),
  };
}

// 2) Kéo dữ liệu mới từ MockAPI về local (bản ghi đang chờ đẩy lên thì giữ bản local)
async function pull(): Promise<boolean> {
  const pending = new Set((await getQueue()).map(o => o.key));
  let changed = false;

  const remoteCats = await fetchAll(RESOURCE.category);
  const cats = await getCategories();
  const before1 = JSON.stringify(cats);
  for (const r of remoteCats) {
    const c = cleanCategory(r);
    if (!c || pending.has(`category:${c.BIT240160_Id}`)) continue;
    const i = cats.findIndex(x => x.BIT240160_Id === c.BIT240160_Id);
    if (i >= 0) cats[i] = c;
    else cats.push(c);
  }
  if (JSON.stringify(cats) !== before1) {
    await saveCategories(cats);
    changed = true;
  }

  const remoteDishes = await fetchAll(RESOURCE.dish);
  const dishes = await getDishes();
  const before2 = JSON.stringify(dishes);
  for (const r of remoteDishes) {
    const d = cleanDish(r);
    if (!d || pending.has(`dish:${d.BIT240160_Id}`)) continue;
    const i = dishes.findIndex(x => x.BIT240160_Id === d.BIT240160_Id);
    if (i >= 0) dishes[i] = d;
    else dishes.push(d);
  }
  if (JSON.stringify(dishes) !== before2) {
    await saveDishes(dishes);
    changed = true;
  }
  return changed;
}

export async function runSync(): Promise<SyncResult> {
  if (!isApiConfigured()) return { status: 'not_configured', changed: false };
  if (running) {
    again = true; // đang sync -> chạy lại sau khi xong để không sót thay đổi mới
    return { status: 'ok', changed: false };
  }
  running = true;
  try {
    do {
      again = false;
      await pushQueue();
    } while (again);
    const changed = await pull();
    return { status: 'ok', changed };
  } finally {
    running = false;
  }
}
