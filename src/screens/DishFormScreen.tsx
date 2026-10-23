import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Chip from '../components/Chip';
import SafeImage from '../components/SafeImage';
import { useLanguage } from '../i18n/LanguageContext';
import { TKey } from '../i18n/translations';
import { RootStackParamList } from '../navigation';
import { getCategories } from '../storage/categoryRepo';
import { getDishById, getDishes, upsertDish } from '../storage/dishRepo';
import { colors, common } from '../theme';
import { Dish, DishCategory, DishImage } from '../types';
import { isValidUrl, normalizeImages, parseNumber, setThumbnail, uid } from '../utils';
import { validateDish } from '../validation';

type Props = NativeStackScreenProps<RootStackParamList, 'DishForm'>;

export default function DishFormScreen({ navigation, route }: Props) {
  const dishId = route.params?.dishId;
  const isEdit = !!dishId;
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cats, setCats] = useState<DishCategory[]>([]);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [prep, setPrep] = useState('');
  const [desc, setDesc] = useState('');
  const [available, setAvailable] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<DishImage[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState(false);
  const [errors, setErrors] = useState<TKey[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? t('edit_dish') : t('add_dish') });
  }, [navigation, isEdit, t]);

  useEffect(() => {
    (async () => {
      try {
        const c = await getCategories();
        setCats(c);
        if (isEdit) {
          const d = await getDishById(dishId!);
          if (!d) {
            setNotFound(true);
          } else {
            setName(d.BIT240160_Name);
            setPrice(String(d.BIT240160_Price));
            setPrep(String(d.BIT240160_PreparationTime));
            setDesc(d.BIT240160_Description);
            setAvailable(d.BIT240160_IsAvailable);
            setCategoryId(d.BIT240160_DishCategoryId);
            setImages(d.BIT240160_DishImage ?? []);
          }
        } else if (c.length > 0) {
          setCategoryId(c[0].BIT240160_Id);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [dishId, isEdit]);

  const addImage = () => {
    const u = urlInput.trim();
    if (!isValidUrl(u)) {
      setUrlError(true);
      return;
    }
    setUrlError(false);
    // ảnh đầu tiên tự động là ảnh đại diện
    setImages(prev => normalizeImages([...prev, { BIT240160_ImageUrl: u, BIT240160_IsThumbnail: false }]));
    setUrlInput('');
  };

  const removeImage = (index: number) => setImages(prev => normalizeImages(prev.filter((_, i) => i !== index)));

  const save = async () => {
    if (saving) return;
    try {
      const all = await getDishes();
      const dish: Dish = {
        BIT240160_Id: dishId ?? uid(),
        BIT240160_Name: name.trim(),
        BIT240160_Price: parseNumber(price),
        BIT240160_PreparationTime: parseNumber(prep),
        BIT240160_IsAvailable: available,
        BIT240160_Description: desc.trim(),
        BIT240160_DishCategoryId: categoryId,
        BIT240160_DishImage: normalizeImages(images),
      };
      const errs = validateDish(dish, all, cats);
      setErrors(errs);
      if (errs.length > 0) return;
      setSaving(true);
      await upsertDish(dish);
      navigation.goBack();
    } catch {
      Alert.alert(t('err_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={common.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={common.center}>
        <Text style={{ fontSize: 16, marginBottom: 16 }}>{t('not_found')}</Text>
        <TouchableOpacity style={common.btn} onPress={() => navigation.goBack()}>
          <Text style={common.btnText}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cats.length === 0) {
    return (
      <View style={common.center}>
        <Text style={{ fontSize: 16, marginBottom: 16, textAlign: 'center' }}>{t('no_categories')}</Text>
        <TouchableOpacity style={common.btn} onPress={() => navigation.replace('CategoryList')}>
          <Text style={common.btnText}>{t('go_categories')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {errors.length > 0 && (
        <View style={[common.card, { borderColor: colors.red, backgroundColor: '#fff5f5' }]}>
          <Text style={{ fontWeight: '700', color: colors.red }}>{t('please_fix')}</Text>
          {errors.map(e => (
            <Text key={e} style={common.error}>
              • {t(e)}
            </Text>
          ))}
        </View>
      )}

      <Text style={common.label}>{t('name')}</Text>
      <TextInput style={common.input} value={name} onChangeText={setName} />

      <Text style={common.label}>{t('price')}</Text>
      <TextInput style={common.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

      <Text style={common.label}>{t('prep_time')}</Text>
      <TextInput style={common.input} value={prep} onChangeText={setPrep} keyboardType="numeric" />

      <Text style={common.label}>{t('category')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cats.map(c => (
          <Chip key={c.BIT240160_Id} label={c.BIT240160_Name} active={categoryId === c.BIT240160_Id} onPress={() => setCategoryId(c.BIT240160_Id)} />
        ))}
      </View>

      <View style={[common.row, { justifyContent: 'space-between', marginTop: 12 }]}>
        <Text style={{ fontWeight: '600', color: colors.text }}>{available ? t('available') : t('unavailable')}</Text>
        <Switch value={available} onValueChange={setAvailable} />
      </View>

      <Text style={common.label}>{t('description')}</Text>
      <TextInput style={[common.input, { height: 80, textAlignVertical: 'top' }]} value={desc} onChangeText={setDesc} multiline />

      <Text style={common.label}>{t('images')}</Text>
      <View style={common.row}>
        <TextInput
          style={[common.input, { flex: 1, marginRight: 8 }]}
          placeholder={t('image_url')}
          autoCapitalize="none"
          autoCorrect={false}
          value={urlInput}
          onChangeText={v => {
            setUrlInput(v);
            setUrlError(false);
          }}
        />
        <TouchableOpacity style={common.btn} onPress={addImage}>
          <Text style={common.btnText}>{t('add')}</Text>
        </TouchableOpacity>
      </View>
      {urlError && <Text style={common.error}>{t('err_url_invalid')}</Text>}

      {images.length === 0 ? (
        <Text style={[common.muted, { marginTop: 8 }]}>{t('no_images')}</Text>
      ) : (
        images.map((img, i) => (
          <View key={`${img.BIT240160_ImageUrl}-${i}`} style={[common.card, common.row, { marginTop: 8 }]}>
            <SafeImage uri={img.BIT240160_ImageUrl} style={{ width: 64, height: 64, borderRadius: 8 }} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              {img.BIT240160_IsThumbnail ? (
                <Text style={{ color: colors.green, fontWeight: '700' }}>★ {t('thumbnail')}</Text>
              ) : (
                <TouchableOpacity onPress={() => setImages(prev => setThumbnail(prev, i))}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>☆ {t('set_thumbnail')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => removeImage(i)} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.red }}>{t('remove')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <View style={[common.row, { marginTop: 24 }]}>
        <TouchableOpacity style={[common.btnOutline, { flex: 1, marginRight: 8 }]} onPress={() => navigation.goBack()}>
          <Text style={common.btnOutlineText}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[common.btn, { flex: 1 }]} onPress={save} disabled={saving}>
          <Text style={common.btnText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
