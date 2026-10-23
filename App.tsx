import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LangSwitch from './src/components/LangSwitch';
import SyncBanner from './src/components/SyncBanner';
import { ToastProvider } from './src/components/Toast';
import { FilterProvider } from './src/context/FilterContext';
import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';
import { RootStackParamList } from './src/navigation';
import CategoryListScreen from './src/screens/CategoryListScreen';
import DishDetailScreen from './src/screens/DishDetailScreen';
import DishFormScreen from './src/screens/DishFormScreen';
import DishListScreen from './src/screens/DishListScreen';
import { seedIfEmpty } from './src/storage/seed';
import { SyncProvider } from './src/sync/SyncProvider';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { t } = useLanguage();
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="DishList"
        screenOptions={{
          headerRight: () => <LangSwitch />,
          headerTintColor: colors.primary,
        }}
      >
        <Stack.Screen name="DishList" component={DishListScreen} options={{ title: t('dishes') }} />
        <Stack.Screen name="DishDetail" component={DishDetailScreen} options={{ title: t('dish_detail') }} />
        <Stack.Screen name="DishForm" component={DishFormScreen} options={{ title: t('add_dish') }} />
        <Stack.Screen name="CategoryList" component={CategoryListScreen} options={{ title: t('categories') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  // Seed dữ liệu mẫu (3 loại, 5 món) trước khi hiển thị / đồng bộ
  useEffect(() => {
    seedIfEmpty().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <FilterProvider>
          <SyncProvider>
            <ToastProvider>
              <View style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                  <Navigation />
                </View>
                <SyncBanner />
              </View>
            </ToastProvider>
            <StatusBar style="dark" />
          </SyncProvider>
        </FilterProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
