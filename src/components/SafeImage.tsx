import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, Text, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';

// Ảnh có xử lý lỗi: URL hỏng / không có ảnh -> hiện khung thay thế
export default function SafeImage({ uri, style }: { uri: string | null; style: StyleProp<ImageStyle> }) {
  const [failed, setFailed] = useState(false);
  const { t } = useLanguage();
  if (!uri || failed) {
    return (
      <View
        style={[
          style as any,
          { backgroundColor: '#e9ecef', alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center' }}>
          {uri ? t('image_error') : '🍽'}
        </Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} resizeMode="cover" />;
}