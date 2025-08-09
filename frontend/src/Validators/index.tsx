import React from 'react';
import { useTranslation } from 'react-i18next';
import { AllValidators } from './AllValidators';

export const Validators = () => {
  const { t } = useTranslation('pages');

  return (
    <div>
      <AllValidators />
    </div>
  );
}; 