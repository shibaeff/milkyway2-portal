import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/Api';
import type { Validator, ValidatorStatistics } from '../types';
import { calculateValidatorStatistics, getValidatorPerformanceColor, formatStake } from '../services/validatorStatistics';
import type { Option } from '@polkadot/types';

// Colors
const POLKADOT_COLORS = {
  primary: '#E6007A',
  secondary: '#07FFFF',
  violet: '#7916F3',
  white: '#FFFFFF',
  black: '#000000',
  storm200: '#DCE2E9',
  storm400: '#AEB7CB',
  storm700: '#6E7391',
  pinkLight: '#FF2670',
};

// Quick Actions suggestions
const getSuggestions = (stats: ValidatorStatistics) => {
  const arr: { title: string; description: string; severity: 'critical' | 'warning' | 'info' }[] = [];
  if (stats.performance < 50) {
    arr.push({ severity: 'critical', title: 'Low Performance', description: 'Performance below 50%. Consider switching validator.' });
  } else if (stats.performance < 70) {
    arr.push({ severity: 'warning', title: 'Moderate Performance', description: 'Below optimal. Monitor closely.' });
  } else {
    arr.push({ severity: 'info', title: 'Good Performance', description: 'No immediate action required.' });
  }
  if (stats.commission > 20) {
    arr.push({ severity: 'warning', title: 'High Commission', description: `Commission is ${stats.commission.toFixed(2)}%, above recommended (<10%).` });
  }
  return arr;
};

interface ValidatorListProps {
  bondFor: string;
  validators: Validator[];
  title: string;
  selectable: boolean;
  defaultFilters?: { includes: string[]; excludes: string[] };
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
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const [addressFilter, setAddressFilter] = useState('');
  const [selectedValidator, setSelectedValidator] = useState<ValidatorStatistics | null>(null);

  const toggleExpanded = (address: string) => {
    const next = new Set(expandedValidators);
    next.has(address) ? next.delete(address) : next.add(address);
    setExpandedValidators(next);
  };

  useEffect(() => {
    const loadAllValidatorStats = async () => {
      if (!api || !isReady || validators.length === 0) return;
      setIsLoadingAll(true);
      let era = 0;
      try {
        const currentEraOption = await api.query.staking.currentEra() as Option<any>;
        if (currentEraOption.isSome) {
          era = currentEraOption.unwrap().toNumber();
        }
      } catch (e) {
        console.error(e);
      }
      if (!era) {
        setIsLoadingAll(false);
        return;
      }

      const promises = validators.map(async (validator) => {
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
      results.forEach((result) => { if (result) newStats[result.address] = result.stats; });
      setValidatorStats(newStats);
      setIsLoadingAll(false);
    };

    loadAllValidatorStats();
  }, [api, isReady, validators]);

  if (isLoadingAll) {
    return (
      <div>
        <h2 style={headingStyle}>{title}</h2>
        <div style={loadingBoxStyle}>
          <h3 style={{ color: POLKADOT_COLORS.primary }}>Loading Validator Performance Data...</h3>
          <p style={{ color: POLKADOT_COLORS.storm700 }}>Fetching performance statistics</p>
        </div>
      </div>
    );
  }

  const filteredValidators = validators.filter(v =>
    v.address.toLowerCase().includes(addressFilter.toLowerCase())
  );

  return (
    <div>
      <h2 style={headingStyle}>{title}</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Filter by validator address..."
          value={addressFilter}
          onChange={(e) => setAddressFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            border: `1px solid ${POLKADOT_COLORS.storm400}`,
            borderRadius: '4px',
            width: '100%',
            maxWidth: '400px',
            fontSize: '0.9rem',
          }}
        />
      </div>
      <div style={tableWrapperStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: `linear-gradient(135deg, ${POLKADOT_COLORS.storm200}, ${POLKADOT_COLORS.white})` }}>
              <th style={thStyle}>Rank</th>
              <th style={thStyle}>Identity</th>
              <th style={thStyle}>Address</th>
              <th style={thStyle}>Commission</th>
              <th style={thStyle}>Performance</th>
              <th style={thStyle}>Last Block</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredValidators.slice(0, visibleCount).map((validator) => {
              const stats = validatorStats[validator.address];
              const isExpanded = expandedValidators.has(validator.address);
              return (
                <React.Fragment key={validator.address}>
                  <tr
                    style={{
                      borderBottom: `1px solid ${POLKADOT_COLORS.storm200}`,
                      cursor: 'pointer',
                      background: isExpanded ? POLKADOT_COLORS.storm200 : 'transparent',
                    }}
                    onClick={() => toggleExpanded(validator.address)}
                  >
                    <td style={tdStyle}>{validator.rank}</td>
                    <td style={tdStyle}>{validator.identity}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.875rem', color: POLKADOT_COLORS.storm700 }}>
                      {validator.address.slice(0, 8)}...{validator.address.slice(-8)}
                    </td>
                    <td style={tdStyle}>{validator.commission.toFixed(2)}%</td>
                    <td style={tdStyle}>
                      {stats ? <span style={{ color: getValidatorPerformanceColor(stats.performance) }}>{stats.performance.toFixed(1)}%</span> : '-'}
                    </td>
                    <td style={tdStyle}>{stats ? stats.lastEraPoints.toLocaleString() : '-'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        background: validator.active ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #dc3545, #fd7e14)',
                        color: POLKADOT_COLORS.white,
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem'
                      }}>
                        {validator.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      {stats ? (
                        <button
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: POLKADOT_COLORS.primary,
                            color: 'white',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedValidator(stats)}
                        >
                          Actions
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                  {isExpanded && stats && (
                    <tr>
                      <td colSpan={8} style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                          <div style={cardStyle}>
                            <h4 style={sectionTitleStyle}>Staking Information</h4>
                            <div>Total Stake: <strong>{formatStake(stats.totalStake)} DOT</strong></div>
                            <div>Self Stake: <strong>{formatStake(stats.selfStake)} DOT</strong></div>
                            <div>Other Stake: <strong>{formatStake(stats.otherStake)} DOT</strong></div>
                            <div>Nominators: <strong>{stats.nominators}</strong></div>
                          </div>
                          <div style={cardStyle}>
                            <h4 style={sectionTitleStyle}>Performance Metrics</h4>
                            <div>Total Era Points: <strong>{stats.totalEraPoints.toLocaleString()}</strong></div>
                            <div>Average Era Points: <strong>{stats.averageEraPoints.toFixed(0)}</strong></div>
                            <div>Last Block Points: <strong>{stats.lastEraPoints.toLocaleString()}</strong></div>
                            <div>Performance: <strong style={{ color: getValidatorPerformanceColor(stats.performance) }}>{stats.performance.toFixed(1)}%</strong></div>
                          </div>
                          <div style={cardStyle}>
                            <h4 style={sectionTitleStyle}>Recent Block Performance</h4>
                            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                              {stats.eraPoints.slice(-10).reverse().map((ep, i) => (
                                <div key={i}>Era {stats.eraPoints.length - 10 + i}: <strong>{ep.toLocaleString()}</strong> points</div>
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
      {visibleCount < filteredValidators.length && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button onClick={() => setVisibleCount(visibleCount + 50)} style={{ padding: '0.5rem 1rem', background: POLKADOT_COLORS.primary, color: 'white', border: 'none', borderRadius: '4px' }}>
            Load More
          </button>
        </div>
      )}

      {selectedValidator && (
        <div style={modalOverlayStyle} onClick={() => setSelectedValidator(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3>Quick Actions</h3>
            <p><strong>Performance:</strong> {selectedValidator.performance.toFixed(1)}%</p>
            <p><strong>Commission:</strong> {selectedValidator.commission.toFixed(2)}%</p>
            {getSuggestions(selectedValidator).map((s, i) => (
              <div key={i} style={{
                borderLeft: `4px solid ${s.severity === 'critical' ? 'red' : s.severity === 'warning' ? 'orange' : '#007bff'}`,
                background: '#f9f9fa',
                padding: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <b>{s.title}</b>: {s.description}
              </div>
            ))}
            <button onClick={() => setSelectedValidator(null)} style={{ marginTop: '1rem', background: '#007bff', color: 'white', padding: '0.4rem 1rem', borderRadius: '4px', border: 'none' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const headingStyle: React.CSSProperties = { marginBottom: '1.5rem', color: POLKADOT_COLORS.black, fontSize: '1.5rem', fontWeight: '700' };
const thStyle: React.CSSProperties = { padding: '1rem', textAlign: 'left', borderBottom: `2px solid ${POLKADOT_COLORS.primary}` };
const tdStyle: React.CSSProperties = { padding: '1rem', fontWeight: '500', color: POLKADOT_COLORS.black };
const sectionTitleStyle: React.CSSProperties = { marginBottom: '0.75rem', fontWeight: '600', color: POLKADOT_COLORS.primary };
const tableWrapperStyle: React.CSSProperties = { overflowX: 'auto', background: POLKADOT_COLORS.white, borderRadius: '12px', border: `1px solid ${POLKADOT_COLORS.storm200}` };
const cardStyle: React.CSSProperties = { background: POLKADOT_COLORS.white, padding: '1rem', borderRadius: '8px', border: `1px solid ${POLKADOT_COLORS.storm200}` };
const loadingBoxStyle: React.CSSProperties = { padding: '2rem', textAlign: 'center', background: `linear-gradient(135deg, ${POLKADOT_COLORS.white}, ${POLKADOT_COLORS.storm200})`, borderRadius: '12px' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
const modalContentStyle: React.CSSProperties = { background: 'white', padding: '1.5rem', borderRadius: '8px', minWidth: '320px', maxWidth: '500px' };
