import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { Lang } from '../i18n/translations';
import { colors } from '../theme';

export default function LangSwitch() {
  const { lang, setLang } = useLanguage();
  const btn = (l: Lang, label: string) => (
    <TouchableOpacity
      onPress={() => setLang(l)}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: lang === l ? colors.primary : 'transparent',
      }}
    >
      <Text style={{ color: lang === l ? '#fff' : colors.primary, fontWeight: '700', fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {btn('en', 'EN')}
      {btn('vi', 'VI')}
    </View>
  );
}
