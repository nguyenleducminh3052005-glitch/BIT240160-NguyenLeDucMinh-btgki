import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { TKey } from '../i18n/translations';
import { RootStackParamList } from '../navigation';
import { deleteCategory, getCategories, upsertCategory } from '../storage/categoryRepo';
import { getDishes } from '../storage/dishRepo';
import { useSync } from '../sync/SyncProvider';
import { colors, common } from '../theme';
import { DishCategory } from '../types';
import { uid } from '../utils';
import { validateCategory } from '../validation';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryList'>;

export default function CategoryListScreen(_props: Props) {
  const { t } = useLanguage();
  const { version } = useSync();
  const [cats, setCats] = useState<DishCategory[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [errors, setErrors] = useState<TKey[]>([]);

  const load = useCallback(async () => {
    try {
      const [c, d] = await Promise.all([getCategories(), getDishes()]);
      setCats(c);
      const m: Record<string, number> = {};
      d.forEach(x => (m[x.BIT240160_DishCategoryId] = (m[x.BIT240160_DishCategoryId] ?? 0) + 1));
      setCounts(m);
    } catch {
      Alert.alert(t('err_load_failed'));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, version]),
  );

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDesc('');
    setErrors([]);
  };

  const save = async () => {
    const errs = validateCategory(name, editingId, cats);
    setErrors(errs);
    if (errs.length > 0) return;
    try {
      await upsertCategory({
        BIT240160_Id: editingId ?? uid(),
        BIT240160_Name: name.trim(),
        BIT240160_Description: desc.trim(),
      });
      resetForm();
      load();
    } catch {
      Alert.alert(t('err_save_failed'));
    }
  };

  const startEdit = (c: DishCategory) => {
    setEditingId(c.BIT240160_Id);
    setName(c.BIT240160_Name);
    setDesc(c.BIT240160_Description);
    setErrors([]);
  };

  const confirmDelete = (c: DishCategory) => {
    Alert.alert(t('confirm_delete_title'), t('confirm_delete_msg', { name: c.BIT240160_Name }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const r = await deleteCategory(c.BIT240160_Id);
            if (r === 'in_use') Alert.alert(t('err_cat_in_use')); // ràng buộc: loại đang dùng không được xóa
            else {
              if (editingId === c.BIT240160_Id) resetForm();
              load();
            }
          } catch {
            Alert.alert(t('err_save_failed'));
          }
        },
      },
    ]);
  };

  return (
    <View style={common.screen}>
      <View style={[common.card, { margin: 12 }]}>
        <Text style={{ fontWeight: '700', fontSize: 16 }}>{editingId ? t('edit_category') : t('new_category')}</Text>
        <Text style={common.label}>{t('name')}</Text>
        <TextInput style={common.input} value={name} onChangeText={setName} />
        <Text style={common.label}>{t('description')}</Text>
        <TextInput style={common.input} value={desc} onChangeText={setDesc} />
        {errors.map(e => (
          <Text key={e} style={common.error}>
            • {t(e)}
          </Text>
        ))}
        <View style={[common.row, { marginTop: 12 }]}>
          {editingId && (
            <TouchableOpacity style={[common.btnOutline, { marginRight: 8 }]} onPress={resetForm}>
              <Text style={common.btnOutlineText}>{t('cancel')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[common.btn, { flex: 1 }]} onPress={save}>
            <Text style={common.btnText}>{editingId ? t('save') : t('add')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={cats}
        keyExtractor={c => c.BIT240160_Id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        ListEmptyComponent={<Text style={[common.muted, { textAlign: 'center', marginTop: 24 }]}>{t('no_categories_yet')}</Text>}
        renderItem={({ item }) => (
          <View style={[common.card, common.row, { marginBottom: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', fontSize: 16 }}>{item.BIT240160_Name}</Text>
              <Text style={common.muted}>{item.BIT240160_Description || '—'}</Text>
              <Text style={{ color: colors.primaryDark, fontSize: 12, marginTop: 2 }}>
                {t('dishes_count', { n: counts[item.BIT240160_Id] ?? 0 })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => startEdit(item)} style={{ padding: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item)} style={{ padding: 8 }}>
              <Text style={{ color: colors.red, fontWeight: '600' }}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
