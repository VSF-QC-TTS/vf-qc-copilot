import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import viAuth from '@/locales/vi/auth.json'
import viCommon from '@/locales/vi/common.json'
import viValidation from '@/locales/vi/validation.json'
import enAuth from '@/locales/en/auth.json'
import enCommon from '@/locales/en/common.json'
import enValidation from '@/locales/en/validation.json'

i18n.use(initReactI18next).init({
  resources: {
    vi: {
      auth: viAuth,
      common: viCommon,
      validation: viValidation,
    },
    en: {
      auth: enAuth,
      common: enCommon,
      validation: enValidation,
    },
  },
  lng: 'vi',
  fallbackLng: 'en',
  ns: ['auth', 'common', 'validation'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React already escapes
  },
})

export default i18n
