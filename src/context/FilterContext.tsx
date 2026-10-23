import React, { createContext, useCallback, useContext, useState } from 'react';
import { TKey } from '../i18n/translations';
import { Dish } from '../types';
import { parseNumber } from '../utils';

export type SortKey = 'none' | 'priceAsc' | 'priceDesc' | 'timeAsc';

export interface Filters {
  search: string;
  categoryId: string | null;
  onlyAvailable: boolean;
  minPrice: string;
  maxPrice: string;
  sort: SortKey;
}

export const defaultFilters: Filters = {
  search: '',
  categoryId: null,
  onlyAvailable: false,
  minPrice: '',
  maxPrice: '',
  sort: 'none',
};

export function priceRangeError(f: Filters): TKey | null {
  const hasMin = f.minPrice.trim() !== '';
  const hasMax = f.maxPrice.trim() !== '';
  const min = parseNumber(f.minPrice);
  const max = parseNumber(f.maxPrice);
  if ((hasMin && !(min >= 0)) || (hasMax && !(max >= 0))) return 'err_price_number';
  if (hasMin && hasMax && min > max) return 'err_price_range';
  return null;
}

export function applyFilters(list: Dish[], f: Filters): Dish[] {
  const usePrice = priceRangeError(f) === null; // khoảng giá sai -> bỏ qua lọc giá
  const hasMin = f.minPrice.trim() !== '';
  const hasMax = f.maxPrice.trim() !== '';
  const min = parseNumber(f.minPrice);
  const max = parseNumber(f.maxPrice);
  const q = f.search.trim().toLowerCase();

  const r = list.filter(
    d =>
      d.BIT240160_Name.toLowerCase().includes(q) &&
      (!f.categoryId || d.BIT240160_DishCategoryId === f.categoryId) &&
      (!f.onlyAvailable || d.BIT240160_IsAvailable) &&
      (!usePrice || !hasMin || d.BIT240160_Price >= min) &&
      (!usePrice || !hasMax || d.BIT240160_Price <= max),
  );

  switch (f.sort) {
    case 'priceAsc':
      r.sort((a, b) => a.BIT240160_Price - b.BIT240160_Price);
      break;
    case 'priceDesc':
      r.sort((a, b) => b.BIT240160_Price - a.BIT240160_Price);
      break;
    case 'timeAsc':
      r.sort((a, b) => a.BIT240160_PreparationTime - b.BIT240160_PreparationTime);
      break;
  }
  return r;
}

interface Ctx {
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<Ctx>({
  filters: defaultFilters,
  setFilters: () => {},
  resetFilters: () => {},
});

// Đặt ở cấp App nên điều kiện lọc được giữ khi chuyển màn hình / quay lại danh sách
export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setAll] = useState<Filters>(defaultFilters);
  const setFilters = useCallback((patch: Partial<Filters>) => setAll(p => ({ ...p, ...patch })), []);
  const resetFilters = useCallback(() => setAll(defaultFilters), []);
  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>{children}</FilterContext.Provider>
  );
}

export const useFilters = () => useContext(FilterContext);
