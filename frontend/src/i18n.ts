import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    pages: {
      validators: 'Validators',
      allValidators: 'All Validators',
      favorites: 'Favorites',
      connecting: 'Connecting',
      fetchingValidators: 'Fetching validators',
      networkValidators: 'Network Validators',
      fetchingFavoriteValidators: 'Fetching favorite validators',
      favoriteValidators: 'Favorite Validators',
      noFavorites: 'No favorites added yet',
      totalValidators: 'Total Validators',
      activeValidators: 'Active Validators',
      averageCommission: 'Average Commission',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 