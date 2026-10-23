import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

type ToastType = 'success' | 'error' | 'info';

interface Ctx {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<Ctx>({ show: () => {} });

// Thông báo nổi (toast) dùng được trên cả web lẫn điện thoại
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, type: ToastType = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => ({ show }), [show]);
  const bg = toast?.type === 'error' ? colors.red : toast?.type === 'info' ? colors.blue : colors.green;

  return (
    <ToastContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {toast && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: insets.top + 64,
              left: 16,
              right: 16,
              alignItems: 'center',
              zIndex: 1000,
              elevation: 10,
            }}
          >
            <View style={{ backgroundColor: bg, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, maxWidth: 520 }}>
              <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>
                {toast.type === 'error' ? '⚠ ' : '✓ '}
                {toast.message}
              </Text>
            </View>
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
