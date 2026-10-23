import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { onLocalChange } from './events';
import { getQueue } from './queue';
import { runSync } from './syncEngine';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'not_configured';

interface Ctx {
  isOnline: boolean;
  status: SyncStatus;
  pending: number;
  version: number; // tăng lên khi dữ liệu local đổi do kéo từ MockAPI -> màn hình tự reload
}

const SyncContext = createContext<Ctx>({ isOnline: true, status: 'idle', pending: 0, version: 0 });

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pending, setPending] = useState(0);
  const [version, setVersion] = useState(0);
  const onlineRef = useRef(true);
  const errorRef = useRef(false);

  const refreshPending = useCallback(async () => {
    setPending((await getQueue()).length);
  }, []);

  const doSync = useCallback(async () => {
    if (!onlineRef.current) {
      refreshPending();
      return;
    }
    setStatus('syncing');
    try {
      const r = await runSync();
      if (r.status === 'not_configured') {
        setStatus('not_configured');
      } else {
        errorRef.current = false;
        setStatus('synced');
        if (r.changed) setVersion(v => v + 1);
      }
    } catch {
      errorRef.current = true; // lỗi mạng / MockAPI: giữ hàng đợi, thử lại sau
      setStatus('error');
    } finally {
      refreshPending();
    }
  }, [refreshPending]);

  useEffect(() => {
    refreshPending();

    // Phát hiện có mạng / mất mạng -> có mạng trở lại thì TỰ ĐỘNG đồng bộ
    const unsubNet = NetInfo.addEventListener(s => {
      const online = !!s.isConnected && s.isInternetReachable !== false;
      onlineRef.current = online;
      setIsOnline(online);
      if (online) doSync();
    });

    // Mỗi lần người dùng tạo/sửa/xóa -> cập nhật số thay đổi chờ và thử đồng bộ ngay
    const unsubLocal = onLocalChange(() => {
      refreshPending();
      doSync();
    });

    // Thử lại định kỳ nếu còn thay đổi chưa đồng bộ hoặc lần trước bị lỗi
    const timer = setInterval(async () => {
      if (onlineRef.current && (errorRef.current || (await getQueue()).length > 0)) doSync();
    }, 15000);

    return () => {
      unsubNet();
      unsubLocal();
      clearInterval(timer);
    };
  }, [doSync, refreshPending]);

  return (
    <SyncContext.Provider value={{ isOnline, status, pending, version }}>{children}</SyncContext.Provider>
  );
}

export const useSync = () => useContext(SyncContext);
