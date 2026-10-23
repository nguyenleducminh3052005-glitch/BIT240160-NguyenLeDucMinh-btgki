import { QUICK_MAX_MINUTES } from './constant';
import { Dish, DishImage } from './types';

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatPrice(p: number): string {
  return `${String(Math.round(p)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ₫`;
}

export function isQuick(d: Dish): boolean {
  return d.BIT240160_PreparationTime <= QUICK_MAX_MINUTES;
}

export function isValidUrl(u: string): boolean {
  return /^https?:\/\/\S+\.\S+/i.test(u.trim());
}

// Đảm bảo tối đa 1 ảnh IsThumbnail = true (và nếu có ảnh thì luôn có 1 thumbnail)
export function normalizeImages(images: DishImage[]): DishImage[] {
  let found = false;
  const out = images.map(i => {
    if (i.BIT240160_IsThumbnail && !found) {
      found = true;
      return { ...i, BIT240160_IsThumbnail: true };
    }
    return { ...i, BIT240160_IsThumbnail: false };
  });
  if (!found && out.length > 0) out[0] = { ...out[0], BIT240160_IsThumbnail: true };
  return out;
}

export function setThumbnail(images: DishImage[], index: number): DishImage[] {
  return images.map((i, idx) => ({ ...i, BIT240160_IsThumbnail: idx === index }));
}

export function getThumbnailUrl(d: Dish): string | null {
  const imgs = d.BIT240160_DishImage ?? [];
  const t = imgs.find(i => i.BIT240160_IsThumbnail) ?? imgs[0];
  return t ? t.BIT240160_ImageUrl : null;
}

// "" hoặc chữ -> NaN
export function parseNumber(text: string): number {
  const s = text.trim().replace(',', '.');
  if (s === '') return NaN;
  return Number(s);
}
