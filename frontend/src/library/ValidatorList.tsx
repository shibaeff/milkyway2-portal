import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/Api';
import type { Validator, ValidatorStatistics } from '../types';
import { calculateValidatorStatistics, getValidatorPerformanceColor, formatStake } from '../services/validatorStatistics';

// Polkadot Brand Colors
const POLKADOT_COLORS = {
  primary: '#E6007A', // Polkadot Pink
  secondary: '#07FFFF', // Cyan
  violet: '#7916F3',
  white: '#FFFFFF',
  black: '#000000',
  storm200: '#DCE2E9', // Light gray
  storm400: '#AEB7CB', // Medium gray
  storm700: '#6E7391', // Dark gray
  pinkLight: '#FF2670', // Lighter pink variation
};

interface ValidatorListProps {
  bondFor: string;
  validators: Validator[];
  title: string;
  selectable: boolean;
  defaultFilters?: {
    includes: string[];
    excludes: string[];
  };
  defaultOrder?: string;
  allowListFormat?: boolean;
  allowMoreCols?: boolean;
  allowFilters?: boolean;
  allowSearch?: boolean;
  itemsPerPage?: number;
}

export const ValidatorList: React.FC<ValidatorListProps> = ({
  validators,
  title,
  selectable,
  allowListFormat = false,
  allowMoreCols = false,
  allowFilters = false,
  allowSearch = false,
  itemsPerPage = 50,
}) => {
  const { api, isReady } = useApi();
  const [validatorStats, setValidatorStats] = useState<Record<string, ValidatorStatistics>>({});
  const [expandedValidators, setExpandedValidators] = useState<Set<string>>(new Set());
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const toggleExpanded = (address: string) => {
    const newExpanded = new Set(expandedValidators);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedValidators(newExpanded);
  };

  // Automatically load stats for all validators when the component mounts
  useEffect(() => {
    const loadAllValidatorStats = async () => {
      if (!api || !isReady || validators.length === 0) return;
      
      setIsLoadingAll(true);
      const currentEra = await api.query.staking.currentEra();
      const era = currentEra ? (currentEra as any).unwrap().toNumber() : 1892;
      
      // Load stats for all validators in parallel (limit to first 20 for performance)
      const validatorsToLoad = validators.slice(0, 20);
      const promises = validatorsToLoad.map(async (validator) => {
        try {
          const stats = await calculateValidatorStatistics(validator, api, era);
          return { address: validator.address, stats };
        } catch (error) {
          console.error('Failed to load stats for', validator.address, error);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      const newStats: Record<string, ValidatorStatistics> = {};
      
      results.forEach(result => {
        if (result) {
          newStats[result.address] = result.stats;
        }
      });
      
      setValidatorStats(newStats);
      setIsLoadingAll(false);
    };

    loadAllValidatorStats();
  }, [api, isReady, validators]);

  const handleRowClick = (address: string) => {
    toggleExpanded(address);
  };

  if (isLoadingAll) {
    return (
      <div>
        <h2 style={{ 
          marginBottom: '1.5rem', 
          color: POLKADOT_COLORS.black,
          fontSize: '1.5rem',
          fontWeight: '700',
          background: `linear-gradient(135deg, ${POLKADOT_COLORS.primary} 0%, ${POLKADOT_COLORS.violet} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {title}
        </h2>
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          background: `linear-gradient(135deg, ${POLKADOT_COLORS.white} 0%, ${POLKADOT_COLORS.storm200} 100%)`,
          borderRadius: '12px',
          border: `1px solid ${POLKADOT_COLORS.storm200}`,
        }}>
          <h3 style={{ color: POLKADOT_COLORS.primary, marginBottom: '0.5rem' }}>Loading Validator Performance Data...</h3>
          <p style={{ color: POLKADOT_COLORS.storm700 }}>Fetching performance statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ 
        marginBottom: '1.5rem', 
        color: POLKADOT_COLORS.black,
        fontSize: '1.5rem',
        fontWeight: '700',
        background: `linear-gradient(135deg, ${POLKADOT_COLORS.primary} 0%, ${POLKADOT_COLORS.violet} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        {title}
      </h2>
      <div style={{ 
        overflowX: 'auto',
        background: POLKADOT_COLORS.white,
        borderRadius: '12px',
        border: `1px solid ${POLKADOT_COLORS.storm200}`,
        boxShadow: `0 4px 16px rgba(230, 0, 122, 0.08)`,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ 
              background: `linear-gradient(135deg, ${POLKADOT_COLORS.storm200} 0%, ${POLKADOT_COLORS.white} 100%)`,
            }}>
              <th style={{ 
                padding: '1rem 0.75rem', 
                textAlign: 'left', 
                borderBottom: `2px solid ${POLKADOT_COLORS.primary}`,
                color: POLKADOT_COLORS.storm700,
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Rank
              </th>
              <th style={{ 
                padding: '1rem 0.75rem', 
                textAlign: 'left', 
                borderBottom: `2px solid ${POLKADOT_COLORS.primary}`,
                color: POLKADOT_COLORS.storm700,
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Identity
              </th>
              <th style={{ 
                padding: '1rem 0.75rem', 
                textAlign: 'left', 
                borderBottom: `2px solid ${POLKADOT_COLORS.primary}`,
                color: POLKADOT_COLORS.storm700,
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Address
              </th>
              <th style={{ 
                padding: '1rem 0.75rem', 
                textAlign: 'left', 
                borderBottom: `2px solid ${POLKADOT_COLORS.primary}`,
                color: POLKADOT_COLORS.storm700,
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Commission
              </th>
              <th style={{ 
                padding: '1rem 0.75rem', 
                textAlign: 'left', 
                borderBottom: `2px solid ${POLKADOT_COLORS.primary}`,
                color: POLKADOT_COLORS.storm700,
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Performance
              </th>
              <th style={{ 
                padding: '1rem 0.75rem', 
                textAlign: 'left', 
                borderBottom: `2px solid ${POLKADOT_COLORS.primary}`,
                color: POLKADOT_COLORS.storm700,
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Last Block
              </th>
              <th style={{ 
                padding: '1rem 0.75rem', 
                textAlign: 'left', 
                borderBottom: `2px solid ${POLKADOT_COLORS.primary}`,
                color: POLKADOT_COLORS.storm700,
                fontWeight: '600',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {validators.slice(0, itemsPerPage).map((validator, index) => {
              const stats = validatorStats[validator.address];
              const isExpanded = expandedValidators.has(validator.address);
              
              return (
                <React.Fragment key={validator.address}>
                  <tr 
                    style={{ 
                      borderBottom: `1px solid ${POLKADOT_COLORS.storm200}`,
                      cursor: 'pointer',
                      background: isExpanded ? POLKADOT_COLORS.storm200 : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => handleRowClick(validator.address)}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.background = POLKADOT_COLORS.storm200;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <td style={{ padding: '1rem 0.75rem', fontWeight: '600', color: POLKADOT_COLORS.black }}>
                      {validator.rank}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: '500', color: POLKADOT_COLORS.black }}>
                      {validator.identity}
                    </td>
                    <td style={{ 
                      padding: '1rem 0.75rem', 
                      fontFamily: 'monospace', 
                      fontSize: '0.875rem',
                      color: POLKADOT_COLORS.storm700,
                    }}>
                      {validator.address.slice(0, 8)}...{validator.address.slice(-8)}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: '500', color: POLKADOT_COLORS.black }}>
                      {validator.commission.toFixed(2)}%
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      {stats ? (
                        <span style={{ 
                          color: getValidatorPerformanceColor(stats.performance),
                          fontWeight: '600',
                          fontSize: '0.875rem',
                        }}>
                          {stats.performance.toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ color: POLKADOT_COLORS.storm700 }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      {stats ? (
                        <span style={{ color: POLKADOT_COLORS.black, fontWeight: '500' }}>
                          {stats.lastEraPoints.toLocaleString()}
                        </span>
                      ) : (
                        <span style={{ color: POLKADOT_COLORS.storm700 }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span
                        style={{
                          background: validator.active 
                            ? `linear-gradient(135deg, #28a745 0%, #20c997 100%)` 
                            : `linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)`,
                          color: POLKADOT_COLORS.white,
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        {validator.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Expanded details row */}
                  {isExpanded && stats && (
                    <tr style={{ 
                      background: `linear-gradient(135deg, ${POLKADOT_COLORS.storm200} 0%, ${POLKADOT_COLORS.white} 100%)`,
                    }}>
                      <td colSpan={7} style={{ padding: '1.5rem' }}>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                          gap: '1.5rem' 
                        }}>
                          <div style={{
                            background: POLKADOT_COLORS.white,
                            padding: '1rem',
                            borderRadius: '8px',
                            border: `1px solid ${POLKADOT_COLORS.storm200}`,
                          }}>
                            <h4 style={{ 
                              margin: '0 0 0.75rem 0', 
                              color: POLKADOT_COLORS.primary,
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Staking Information
                            </h4>
                            <div style={{ fontSize: '0.875rem', color: POLKADOT_COLORS.black }}>
                              <div style={{ marginBottom: '0.25rem' }}>Total Stake: <strong>{formatStake(stats.totalStake)} DOT</strong></div>
                              <div style={{ marginBottom: '0.25rem' }}>Self Stake: <strong>{formatStake(stats.selfStake)} DOT</strong></div>
                              <div style={{ marginBottom: '0.25rem' }}>Other Stake: <strong>{formatStake(stats.otherStake)} DOT</strong></div>
                              <div>Nominators: <strong>{stats.nominators}</strong></div>
                            </div>
                          </div>
                          
                          <div style={{
                            background: POLKADOT_COLORS.white,
                            padding: '1rem',
                            borderRadius: '8px',
                            border: `1px solid ${POLKADOT_COLORS.storm200}`,
                          }}>
                            <h4 style={{ 
                              margin: '0 0 0.75rem 0', 
                              color: POLKADOT_COLORS.primary,
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Performance Metrics
                            </h4>
                            <div style={{ fontSize: '0.875rem', color: POLKADOT_COLORS.black }}>
                              <div style={{ marginBottom: '0.25rem' }}>Total Era Points: <strong>{stats.totalEraPoints.toLocaleString()}</strong></div>
                              <div style={{ marginBottom: '0.25rem' }}>Average Era Points: <strong>{stats.averageEraPoints.toFixed(0)}</strong></div>
                              <div style={{ marginBottom: '0.25rem' }}>Last Block Points: <strong>{stats.lastEraPoints.toLocaleString()}</strong></div>
                              <div>Performance: <strong style={{ color: getValidatorPerformanceColor(stats.performance) }}>{stats.performance.toFixed(1)}%</strong></div>
                            </div>
                          </div>
                          
                          <div style={{
                            background: POLKADOT_COLORS.white,
                            padding: '1rem',
                            borderRadius: '8px',
                            border: `1px solid ${POLKADOT_COLORS.storm200}`,
                          }}>
                            <h4 style={{ 
                              margin: '0 0 0.75rem 0', 
                              color: POLKADOT_COLORS.primary,
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              Recent Block Performance
                            </h4>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              maxHeight: '150px', 
                              overflowY: 'auto',
                              color: POLKADOT_COLORS.black,
                            }}>
                              {stats.eraPoints.slice(-10).reverse().map((ep, i) => (
                                <div key={i} style={{ 
                                  marginBottom: '0.25rem',
                                  padding: '0.25rem 0',
                                  borderBottom: `1px solid ${POLKADOT_COLORS.storm200}`,
                                }}>
                                  Era {stats.eraPoints.length - 10 + i}: <strong>{ep.toLocaleString()}</strong> points
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 