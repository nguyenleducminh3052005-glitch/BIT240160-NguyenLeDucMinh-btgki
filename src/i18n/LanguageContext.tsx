import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TABLE } from '../constant';
import { Lang, TKey, translations } from './translations';

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<Ctx>({
  lang: 'en',
  setLang: () => {},
  t: k => k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en'); // mặc định English

  useEffect(() => {
    AsyncStorage.getItem(TABLE.language)
      .then(v => {
        if (v === 'en' || v === 'vi') setLangState(v);
      })
      .catch(() => {});
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(TABLE.language, l).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TKey, params?: Record<string, string | number>) => {
      let s: string = translations[lang][key] ?? key;
      if (params) {
        Object.keys(params).forEach(k => {
          s = s.split(`{${k}}`).join(String(params[k]));
        });
      }
      return s;
    },
    [lang],
  );

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
