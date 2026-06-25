import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import viAuth from '@/locales/vi/auth.json'
import viCommon from '@/locales/vi/common.json'
import viValidation from '@/locales/vi/validation.json'
import viProject from '@/locales/vi/project.json'
import enAuth from '@/locales/en/auth.json'
import enCommon from '@/locales/en/common.json'
import enValidation from '@/locales/en/validation.json'
import enProject from '@/locales/en/project.json'

i18n.use(initReactI18next).init({
  resources: {
    vi: {
      auth: viAuth,
      common: viCommon,
      validation: viValidation,
      project: viProject,
    },
    en: {
      auth: enAuth,
      common: enCommon,
      validation: enValidation,
      project: enProject,
    },
  },
  lng: 'vi',
  fallbackLng: 'en',
  ns: ['auth', 'common', 'validation', 'project'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React already escapes
  },
})

export default i18n
