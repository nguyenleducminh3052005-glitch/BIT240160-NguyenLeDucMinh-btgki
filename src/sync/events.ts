type Listener = () => void;
const listeners = new Set<Listener>();

// Gọi mỗi khi dữ liệu local thay đổi (tạo/sửa/xóa) để SyncProvider tự đồng bộ
export function onLocalChange(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function emitLocalChange() {
  listeners.forEach(cb => cb());
}
