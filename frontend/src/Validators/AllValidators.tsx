import { useApi } from '../contexts/Api';
import { useValidators } from '../contexts/Validators/ValidatorEntries';
import { CardWrapper } from '../library/Card/Wrappers';
import { ValidatorList } from '../library/ValidatorList';
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
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
        borderRadius: '12px',
        border: '1px solid #f5c6cb',
        margin: '1rem 0'
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '1rem'
        }}>
          ❌
        </div>
        <h3 style={{ color: '#721c24', marginBottom: '1rem' }}>Connection Error</h3>
        <p style={{ color: '#721c24', marginBottom: '1rem' }}>{apiError}</p>
        <p style={{ color: '#721c24' }}>Please check your internet connection and try again.</p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="loading-container" style={{
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '12px',
        border: '1px solid #dee2e6',
        margin: '1rem 0'
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          animation: 'pulse 2s infinite'
        }}>
          🔗
        </div>
        <h3 style={{ color: '#495057', marginBottom: '1rem' }}>Connecting to Polkadot Network...</h3>
        <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
          Please wait while we establish a secure connection to the Polkadot relay chain.
        </p>
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <p style={{
            color: '#856404',
            margin: 0,
            fontSize: '0.9rem',
            fontWeight: '500'
          }}>
            ⏱️ <strong>First-time loading may take 30-60 seconds</strong> - Please be patient while we fetch the latest validator data from the blockchain.
          </p>
        </div>
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

      <Page.Row>
        <CardWrapper>
          {isLoading ? (
            <div className="loading-container" style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '12px',
              border: '1px solid #dee2e6',
              margin: '1rem 0'
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '1rem',
                animation: 'pulse 2s infinite'
              }}>
                📊
              </div>
              <h3 style={{ color: '#495057', marginBottom: '1rem' }}>Loading Validator Data...</h3>
              <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                Fetching comprehensive validator information from the network.
              </p>
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem'
              }}>
                <p style={{
                  color: '#856404',
                  margin: 0,
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  ⏱️ <strong>Please be patient</strong> - Loading validator data for the first time may take 30-60 seconds as we fetch data from multiple blockchain sources.
                </p>
              </div>
            </div>
          ) : validatorsError ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
              borderRadius: '12px',
              border: '1px solid #f5c6cb',
              margin: '1rem 0'
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '1rem'
              }}>
                ❌
              </div>
              <h3 style={{ color: '#721c24', marginBottom: '1rem' }}>Error Loading Validators</h3>
              <p style={{ color: '#721c24' }}>{validatorsError}</p>
            </div>
          ) : validators.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '12px',
              border: '1px solid #dee2e6',
              margin: '1rem 0'
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '1rem'
              }}>
                🔍
              </div>
              <h3 style={{ color: '#495057', marginBottom: '1rem' }}>No Validators Found</h3>
              <p style={{ color: '#6c757d' }}>No validator data available at the moment. Please try refreshing the page.</p>
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
              itemsPerPage={50} // show 50 initially
            />
          )}
        </CardWrapper>
      </Page.Row>
    </>
  );
};
