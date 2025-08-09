import { useValidators } from '../../contexts/Validators/ValidatorEntries';
import { Text } from '../../library/StatCards/Text';
import { useTranslation } from 'react-i18next';

export const AverageCommission = () => {
  const { t } = useTranslation('pages');
  const { avgCommission } = useValidators();

  const params = {
    label: t('averageCommission'),
    value: `${String(avgCommission)}%`,
    helpKey: 'Average Commission',
  };
  return <Text {...params} />;
}; 