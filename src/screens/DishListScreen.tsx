import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Chip from '../components/Chip';
import SafeImage from '../components/SafeImage';
import { MSSV } from '../constant';
import { SortKey, applyFilters, defaultFilters, priceRangeError, useFilters } from '../context/FilterContext';
import { useLanguage } from '../i18n/LanguageContext';
import { TKey } from '../i18n/translations';
import { RootStackParamList } from '../navigation';
import { getCategories } from '../storage/categoryRepo';
import { getDishes } from '../storage/dishRepo';
import { useSync } from '../sync/SyncProvider';
import { colors, common } from '../theme';
import { Dish, DishCategory } from '../types';
import { formatPrice, getThumbnailUrl, isQuick } from '../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'DishList'>;

const SORTS: { key: SortKey; label: TKey }[] = [
  { key: 'none', label: 'sort_none' },
  { key: 'priceAsc', label: 'sort_price_asc' },
  { key: 'priceDesc', label: 'sort_price_desc' },
  { key: 'timeAsc', label: 'sort_time_asc' },
];

export default function DishListScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { version } = useSync();
  const { filters, setFilters, resetFilters } = useFilters();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [cats, setCats] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([getDishes(), getCategories()]);
      setDishes(d);
      setCats(c);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload mỗi khi quay lại màn hình hoặc khi dữ liệu được đồng bộ từ MockAPI
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, version]),
  );

  const rangeErr = priceRangeError(filters);
  const visible = useMemo(() => applyFilters(dishes, filters), [dishes, filters]);
  const catName = useMemo(() => {
    const m: Record<string, string> = {};
    cats.forEach(c => (m[c.BIT240160_Id] = c.BIT240160_Name));
    return m;
  }, [cats]);

  const activeCount =
    (filters.categoryId ? 1 : 0) +
    (filters.onlyAvailable ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.sort !== 'none' ? 1 : 0);
  const isDefault = JSON.stringify(filters) === JSON.stringify(defaultFilters);

  const renderItem = ({ item }: { item: Dish }) => (
    <TouchableOpacity
      style={[common.card, common.row, { marginBottom: 10, opacity: item.BIT240160_IsAvailable ? 1 : 0.6 }]}
      onPress={() => navigation.navigate('DishDetail', { dishId: item.BIT240160_Id })}
    >
      <SafeImage uri={getThumbnailUrl(item)} style={{ width: 72, height: 72, borderRadius: 8 }} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {item.BIT240160_Name}
        </Text>
        <Text style={{ color: colors.primaryDark, fontWeight: '600' }}>{formatPrice(item.BIT240160_Price)}</Text>
        <Text style={common.muted} numberOfLines={1}>
          {catName[item.BIT240160_DishCategoryId] ?? '—'} · {item.BIT240160_PreparationTime} {t('minutes')}
        </Text>
        <View style={[common.row, { marginTop: 4 }]}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#fff',
              backgroundColor: isQuick(item) ? colors.green : colors.blue,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              overflow: 'hidden',
              marginRight: 6,
            }}
          >
            {isQuick(item) ? t('quick') : t('regular')}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: '#fff',
              backgroundColor: item.BIT240160_IsAvailable ? colors.primary : colors.gray,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {item.BIT240160_IsAvailable ? t('available') : t('unavailable')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={common.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={common.screen}>
      <View style={{ padding: 12, paddingBottom: 4 }}>
        <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 6 }}>{MSSV}_FoodManager</Text>
        <TextInput
          style={common.input}
          placeholder={t('search_placeholder')}
          value={filters.search}
          onChangeText={s => setFilters({ search: s })}
        />
        <View style={[common.row, { marginTop: 8 }]}>
          <TouchableOpacity style={[common.btnOutline, { marginRight: 8 }]} onPress={() => setShowFilters(s => !s)}>
            <Text style={common.btnOutlineText}>
              {t('filters')}
              {activeCount > 0 ? ` (${activeCount})` : ''} {showFilters ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[common.btnOutline, { marginRight: 8 }]} onPress={() => navigation.navigate('CategoryList')}>
            <Text style={common.btnOutlineText}>{t('categories')}</Text>
          </TouchableOpacity>
          {!isDefault && (
            <TouchableOpacity onPress={resetFilters}>
              <Text style={{ color: colors.red, fontWeight: '600' }}>{t('reset')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showFilters && (
          <View style={[common.card, { marginTop: 8 }]}>
            <Text style={[common.label, { marginTop: 0 }]}>{t('category')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Chip label={t('all')} active={!filters.categoryId} onPress={() => setFilters({ categoryId: null })} />
              {cats.map(c => (
                <Chip
                  key={c.BIT240160_Id}
                  label={c.BIT240160_Name}
                  active={filters.categoryId === c.BIT240160_Id}
                  onPress={() => setFilters({ categoryId: c.BIT240160_Id })}
                />
              ))}
            </View>

            <View style={[common.row, { justifyContent: 'space-between', marginTop: 8 }]}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{t('only_available')}</Text>
              <Switch value={filters.onlyAvailable} onValueChange={v => setFilters({ onlyAvailable: v })} />
            </View>

            <Text style={common.label}>{t('price_range')}</Text>
            <View style={common.row}>
              <TextInput
                style={[common.input, { flex: 1 }]}
                placeholder={t('min_price')}
                keyboardType="numeric"
                value={filters.minPrice}
                onChangeText={v => setFilters({ minPrice: v })}
              />
              <Text style={{ marginHorizontal: 8 }}>–</Text>
              <TextInput
                style={[common.input, { flex: 1 }]}
                placeholder={t('max_price')}
                keyboardType="numeric"
                value={filters.maxPrice}
                onChangeText={v => setFilters({ maxPrice: v })}
              />
            </View>
            {rangeErr && <Text style={common.error}>{t(rangeErr)}</Text>}

            <Text style={common.label}>{t('sort')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {SORTS.map(s => (
                <Chip key={s.key} label={t(s.label)} active={filters.sort === s.key} onPress={() => setFilters({ sort: s.key })} />
              ))}
            </View>
          </View>
        )}
      </View>

      {loadError ? (
        <View style={common.center}>
          <Text style={common.error}>{t('err_load_failed')}</Text>
          <TouchableOpacity style={[common.btn, { marginTop: 12 }]} onPress={load}>
            <Text style={common.btnText}>{t('ok')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={d => d.BIT240160_Id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
          ListEmptyComponent={
            <Text style={[common.muted, { textAlign: 'center', marginTop: 40 }]}>
              {dishes.length === 0 ? t('no_dishes') : t('no_results')}
            </Text>
          }
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('DishForm', {})}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 30, marginTop: -2 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
