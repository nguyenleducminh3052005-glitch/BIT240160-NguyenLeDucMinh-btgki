import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import SafeImage from '../components/SafeImage';
import { useLanguage } from '../i18n/LanguageContext';
import { RootStackParamList } from '../navigation';
import { getCategories } from '../storage/categoryRepo';
import { getDishById, removeDish, upsertDish } from '../storage/dishRepo';
import { useSync } from '../sync/SyncProvider';
import { colors, common } from '../theme';
import { Dish } from '../types';
import { formatPrice, isQuick, setThumbnail } from '../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'DishDetail'>;

export default function DishDetailScreen({ navigation, route }: Props) {
  const { dishId } = route.params;
  const { t } = useLanguage();
  const { version } = useSync();
  const [dish, setDish] = useState<Dish | null>(null);
  const [catName, setCatName] = useState('—');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await getDishById(dishId); // null nếu Id không tồn tại
      setDish(d);
      if (d) {
        const c = (await getCategories()).find(x => x.BIT240160_Id === d.BIT240160_DishCategoryId);
        setCatName(c ? c.BIT240160_Name : '—');
      }
    } catch {
      setDish(null);
    } finally {
      setLoading(false);
    }
  }, [dishId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, version]),
  );

  if (loading) {
    return (
      <View style={common.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!dish) {
    return (
      <View style={common.center}>
        <Text style={{ fontSize: 16, marginBottom: 16 }}>{t('not_found')}</Text>
        <TouchableOpacity style={common.btn} onPress={() => navigation.goBack()}>
          <Text style={common.btnText}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const confirmDelete = () => {
    Alert.alert(t('confirm_delete_title'), t('confirm_delete_msg', { name: dish.BIT240160_Name }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeDish(dish.BIT240160_Id);
            navigation.goBack();
          } catch {
            Alert.alert(t('err_save_failed'));
          }
        },
      },
    ]);
  };

  const changeThumb = async (index: number) => {
    try {
      const updated = { ...dish, BIT240160_DishImage: setThumbnail(dish.BIT240160_DishImage, index) };
      await upsertDish(updated);
      setDish(updated);
    } catch {
      Alert.alert(t('err_save_failed'));
    }
  };

  const images = dish.BIT240160_DishImage ?? [];

  return (
    <ScrollView style={common.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      {images.length === 0 ? (
        <View style={{ height: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9ecef' }}>
          <Text style={common.muted}>{t('no_images')}</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {images.map((img, i) => (
            <View key={`${img.BIT240160_ImageUrl}-${i}`} style={{ marginRight: 12, width: 260 }}>
              <SafeImage uri={img.BIT240160_ImageUrl} style={{ width: 260, height: 190, borderRadius: 12 }} />
              {img.BIT240160_IsThumbnail ? (
                <Text style={{ textAlign: 'center', marginTop: 6, color: colors.green, fontWeight: '700' }}>
                  ★ {t('thumbnail')}
                </Text>
              ) : (
                <TouchableOpacity onPress={() => changeThumb(i)} style={{ marginTop: 6 }}>
                  <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '600' }}>
                    ☆ {t('set_thumbnail')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{dish.BIT240160_Name}</Text>
        <Text style={{ fontSize: 20, color: colors.primaryDark, fontWeight: '700', marginTop: 4 }}>
          {formatPrice(dish.BIT240160_Price)}
        </Text>

        <View style={[common.row, { marginTop: 10, flexWrap: 'wrap' }]}>
          <Text style={{ color: '#fff', fontWeight: '700', backgroundColor: isQuick(dish) ? colors.green : colors.blue, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, overflow: 'hidden', marginRight: 8 }}>
            {isQuick(dish) ? t('quick') : t('regular')}
          </Text>
          <Text style={{ color: '#fff', fontWeight: '700', backgroundColor: dish.BIT240160_IsAvailable ? colors.primary : colors.gray, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' }}>
            {dish.BIT240160_IsAvailable ? t('available') : t('unavailable')}
          </Text>
        </View>

        <Text style={common.label}>{t('category')}</Text>
        <Text style={{ fontSize: 16 }}>{catName}</Text>
        <Text style={common.label}>{t('prep_time')}</Text>
        <Text style={{ fontSize: 16 }}>
          {dish.BIT240160_PreparationTime} {t('minutes')}
        </Text>
        <Text style={common.label}>{t('description')}</Text>
        <Text style={{ fontSize: 16 }}>{dish.BIT240160_Description || '—'}</Text>

        <View style={[common.row, { marginTop: 24 }]}>
          <TouchableOpacity
            style={[common.btn, { flex: 1, marginRight: 8 }]}
            onPress={() => navigation.navigate('DishForm', { dishId: dish.BIT240160_Id })}
          >
            <Text style={common.btnText}>{t('edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[common.btn, { flex: 1, backgroundColor: colors.red }]} onPress={confirmDelete}>
            <Text style={common.btnText}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}