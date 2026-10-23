// ============================================================
// MSSV: TẤT CẢ tên project / table / field đều có tiền tố MSSV_
// ============================================================
export const MSSV = 'BIT240160';

// Tên "bảng" trong AsyncStorage (key) -> BIT240160_Dish, BIT240160_DishCategory ...
export const TABLE = {
  category: `${MSSV}_DishCategory`,
  dish: `${MSSV}_Dish`,
  queue: `${MSSV}_SyncQueue`,
  language: `${MSSV}_Language`,
};

// ---------------- MockAPI ----------------
// TODO: dán Base URL MockAPI của bạn vào đây, ví dụ:
// 'https://6543abcd1234.mockapi.io/api/v1'
export const API_BASE = 'https://6ad71936f71f154ac487c402.mockapi.io/api/v1/:endpoint';

// Tên resource trên MockAPI (cũng có tiền tố MSSV_)
export const RESOURCE = {
  category: `${MSSV}_DishCategory`,
  dish: `${MSSV}_Dish`,
};

export const isApiConfigured = () => !API_BASE.includes('YOUR_PROJECT_ID');

export const QUICK_MAX_MINUTES = 15;
