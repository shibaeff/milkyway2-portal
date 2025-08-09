import { useApi } from '../contexts/Api';
import { useValidators } from '../contexts/Validators/ValidatorEntries';
import { CardWrapper } from '../library/Card/Wrappers';
import { ValidatorList } from '../library/ValidatorList';
import { ValidatorStatsSummary } from '../components/ValidatorStatsSummary';
import { useTranslation } from 'react-i18next';
import { Page, Stat } from '../ui-core/base';
import { ActiveValidators } from './Stats/ActiveValidators';
import { AverageCommission } from './Stats/AverageCommission';
import { TotalValidators } from './Stats/TotalValidators';

export const AllValidators = () => {
  const { t } = useTranslation('pages');
  const { isReady, error: apiError } = useApi();
  const { getValidators, isLoading, error: validatorsError } = useValidators();
  const validators = getValidators();

  if (apiError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc3545' }}>
        <h3>Connection Error</h3>
        <p>{apiError}</p>
        <p>Please check your internet connection and try again.</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Connecting to Polkadot...</h3>
        <p>Please wait while we connect to the Polkadot relay chain.</p>
      </div>
    );
  }

  return (
    <>
      <Stat.Row>
        <ActiveValidators />
        <TotalValidators />
        <AverageCommission />
      </Stat.Row>
      
      <ValidatorStatsSummary />
      
      <Page.Row>
        <CardWrapper>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3>Loading Validators...</h3>
              <p>Fetching validator data from Polkadot network.</p>
            </div>
          ) : validatorsError ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#dc3545' }}>
              <h3>Error Loading Validators</h3>
              <p>{validatorsError}</p>
            </div>
          ) : validators.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3>No Validators Found</h3>
              <p>No validator data available at the moment.</p>
            </div>
          ) : (
            <ValidatorList
              bondFor="nominator"
              validators={validators}
              title={t('networkValidators')}
              selectable={false}
              defaultFilters={{
                includes: ['active'],
                excludes: [
                  'all_commission',
                  'blocked_nominations',
                  'missing_identity',
                ],
              }}
              defaultOrder="rank"
              allowListFormat={false}
              allowMoreCols
              allowFilters
              allowSearch
              itemsPerPage={50}
            />
          )}
        </CardWrapper>
      </Page.Row>
    </>
  );
}; 