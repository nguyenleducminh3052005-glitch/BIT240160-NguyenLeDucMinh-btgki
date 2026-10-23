import { Alert, Platform } from 'react-native';

// Hộp xác nhận chạy được trên cả web (Alert.alert không hoạt động trên web) và điện thoại
export function confirmDialog(title: string, message: string, okText: string, cancelText: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const w = globalThis as any;
    return Promise.resolve(typeof w.confirm === 'function' ? !!w.confirm(`${title}\n\n${message}`) : true);
  }
  return new Promise(resolve => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        { text: okText, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
