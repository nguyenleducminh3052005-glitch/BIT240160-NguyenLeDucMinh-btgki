import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';
import { useSync } from '../sync/SyncProvider';
import { colors } from '../theme';

export default function SyncBanner() {
  const { t } = useLanguage();
  const { isOnline, status, pending } = useSync();
  const insets = useSafeAreaInsets();

  let text = t('sync_synced');
  let bg = colors.green;
  if (!isOnline) {
    text = '⚠ ' + t('sync_offline', { n: pending });
    bg = colors.red;
  } else if (status === 'syncing') {
    text = '⟳ ' + t('sync_syncing');
    bg = colors.blue;
  } else if (status === 'error') {
    text = '⚠ ' + t('sync_error');
    bg = colors.red;
  } else if (status === 'not_configured') {
    text = t('sync_local_mode');
    bg = colors.gray;
  } else if (pending > 0) {
    text = t('sync_pending', { n: pending });
    bg = colors.blue;
  } else if (status === 'synced') {
    text = '✓ ' + t('sync_synced');
  } else {
    return null;
  }

  return (
    <View style={{ backgroundColor: bg, paddingTop: 5, paddingBottom: 5 + insets.bottom }}>
      <Text style={{ color: '#fff', textAlign: 'center', fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}
