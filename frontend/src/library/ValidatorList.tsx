import React, { useState, useEffect } from 'react';
import { useApi } from '../contexts/Api';
import type { Validator, ValidatorStatistics } from '../types';
import { calculateValidatorStatistics, getValidatorPerformanceColor, formatStake } from '../services/validatorStatistics';
import type { Option } from '@polkadot/types';

// Theme and text constants
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

const uptimeInfoText = `
Uptime = % of recent eras where validator earned > 0 points.
Logic: For each of the last N eras (N = 10), check if points > 0;
Uptime = (active eras / total checked eras) * 100.
Difference from Performance:
- Uptime is binary (active/inactive per era), measuring reliability.
- Performance measures how much work was done.
Why 0.00%? — Validator earned no points in ALL checked eras.
`;

const performanceInfoText = `
Performance = Recent points earned / maximum possible points, in %.
Measured over last 20 eras in calculateValidatorStatistics:
  (sum of points over last 20 eras) / (20 * 1000 max points) * 100
Captures quality of participation, not just activity.
`;

const getSuggestions = (stats: ValidatorStatistics) => {
  const arr: { title: string; description: string; severity: 'critical'|'warning'|'info'}[] = [];
  if (stats.performance < 50) arr.push({ severity: 'critical', title: 'Low Performance', description: 'Performance below 50%. Consider switching validator.' });
  else if (stats.performance < 70) arr.push({ severity: 'warning', title: 'Moderate Performance', description: 'Below optimal. Monitor closely.' });
  else arr.push({ severity: 'info', title: 'Good Performance', description: 'No immediate action required.' });
  if (stats.commission > 20) arr.push({ severity: 'warning', title: 'High Commission', description: `Commission ${stats.commission.toFixed(2)}%, above recommended (<10%).` });
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
  defaultFilters,
  defaultOrder,
  allowListFormat = false,
  allowMoreCols = false,
  allowFilters = false,
  allowSearch = false,
  itemsPerPage = 50,
}) => {
  const { api, isReady } = useApi();
  const [expandedValidators, setExpandedValidators] = useState<Set<string>>(new Set());
  const [addressFilter, setAddressFilter] = useState('');
  const [selectedValidator, setSelectedValidator] = useState<ValidatorStatistics | null>(null);
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);

  const [showUptimeInfo, setShowUptimeInfo] = useState(false);
  const [showPerformanceInfo, setShowPerformanceInfo] = useState(false);

  const [currentEra, setCurrentEra] = useState<number | null>(null);
  const [eraError, setEraError] = useState<string | null>(null);
  const [validatorStats, setValidatorStats] = useState<Record<string, ValidatorStatistics>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [uptimeMap, setUptimeMap] = useState<Record<string, number>>({});
  const [loadingUptime, setLoadingUptime] = useState(false);

  const RECENT_ERAS = 10;

  const filteredValidators = validators.filter(v =>
    v.address.toLowerCase().includes(addressFilter.toLowerCase())
  );

  // Fetch currentEra
  useEffect(() => {
    let cancelled = false;
    const MAX_RETRIES = 6;
    const RETRY_DELAY_MS = 1500;
    const runFetch = async () => {
      if (!api || !isReady) return;
      setCurrentEra(null); setEraError(null);
      let retries = MAX_RETRIES;
      while (retries > 0 && !cancelled) {
        try {
          const res = await api.query.staking.currentEra() as Option<any>;
          if ((res as any).isSome) {
            const val = (res as any).unwrap().toNumber();
            if (val > 0) { setCurrentEra(val); break; }
          }
        } catch {}
        retries--;
        if (retries > 0 && !cancelled) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      }
      if (retries === 0 && !cancelled) setEraError('Failed to fetch currentEra.');
    };
    runFetch();
    return () => { cancelled = true; };
  }, [api, isReady]);

  // Load stats
  useEffect(() => {
    let cancelled = false;
    async function loadStatsChunk() {
      if (!api || !isReady || !currentEra || eraError) return;
      setLoadingStats(true);
      const toFetch = filteredValidators.slice(0, visibleCount).filter(v => !validatorStats[v.address]);
      const concurrency = 8;
      let i = 0;
      while (i < toFetch.length && !cancelled) {
        const batch = toFetch.slice(i, i + concurrency);
        const results = await Promise.all(batch.map(async (v) => {
          try { return { address: v.address, stats: await calculateValidatorStatistics(v, api, currentEra) }; }
          catch { return null; }
        }));
        if (cancelled) break;
        setValidatorStats(prev => {
          const copy = { ...prev };
          results.forEach(r => { if (r) copy[r.address] = r.stats; });
          return copy;
        });
        i += concurrency;
      }
      setLoadingStats(false);
    }
    loadStatsChunk();
  }, [api, isReady, currentEra, eraError, visibleCount, filteredValidators, validatorStats]);

  // Load uptime
  useEffect(() => {
    if (!api || !isReady || !currentEra) return;
    let cancelled = false;
    (async () => {
      setLoadingUptime(true);
      const startEra = Math.max(0, currentEra - RECENT_ERAS);
      const endEra = currentEra;
      const eraPoints: Record<number, Record<string, number>> = {};
      for (let era = startEra; era < endEra; era++) {
        if (cancelled) return;
        try {
          const res: any = await api.query.staking.erasRewardPoints(era);
          const mapped: Record<string, number> = {};
          if (res && res.individual) {
            res.individual.forEach((score: any, stash: any) => {
              mapped[stash.toString()] = score.toNumber();
            });
          }
          eraPoints[era] = mapped;
        } catch { eraPoints[era] = {}; }
        await new Promise(r => setTimeout(r, 50));
      }
      const map: Record<string, number> = {};
      filteredValidators.slice(0, visibleCount).forEach(v => {
        const activeArr: number[] = Array.from({ length: endEra - startEra }, (_, idx) =>
          (eraPoints[startEra + idx]?.[v.address] ?? 0) > 0 ? 1 : 0
        );
        const activeCount = activeArr.reduce((a, b) => a + b, 0);
        const total = endEra - startEra;
        map[v.address] = total > 0 ? (activeCount / total) * 100 : 0;
      });
      if (!cancelled) setUptimeMap(map);
      setLoadingUptime(false);
    })();
    return () => { cancelled = true; };
  }, [api, isReady, currentEra, eraError, visibleCount, filteredValidators]);

  const toggleExpanded = (address: string) => {
    setExpandedValidators(prev => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address); else next.add(address);
      return next;
    });
  };

  if (!isReady || currentEra === null) return <div><h2 style={headingStyle}>{title}</h2><div>Loading Network Era...</div></div>;
  if (eraError) return <div><h2 style={headingStyle}>{title}</h2><div>Error: {eraError}</div></div>;

  const renderBody = () => (
    <tbody>
      {filteredValidators.slice(0, visibleCount).map(v => {
        const stats = validatorStats[v.address];
        const uptime = uptimeMap[v.address];
        const isExpanded = expandedValidators.has(v.address);
        return (
          <React.Fragment key={v.address}>
            <tr
              style={{ borderBottom: `1px solid ${POLKADOT_COLORS.storm200}`, cursor: 'pointer', background: isExpanded ? POLKADOT_COLORS.storm200 : 'transparent' }}
              onClick={() => toggleExpanded(v.address)}
            >
              <td style={tdStyle}>{v.rank}</td>
              <td style={tdStyle}>{v.identity}</td>
              <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.875rem', color: POLKADOT_COLORS.storm700 }}>
                {v.address.slice(0, 8)}...{v.address.slice(-8)}
              </td>
              <td style={tdStyle}>{v.commission.toFixed(2)}%</td>
              <td style={tdStyle}>
                {stats
                  ? <>
                      <span style={{ color: getValidatorPerformanceColor(stats.performance) }}>{stats.performance.toFixed(1)}%</span>
                      <span style={{ marginLeft: 4, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowPerformanceInfo(true); }}>ℹ️</span>
                    </>
                  : loadingStats ? '...' : '-'}
              </td>
              <td style={tdStyle}>{stats ? stats.lastEraPoints.toLocaleString() : loadingStats ? '...' : '-'}</td>
              <td style={tdStyle}>
                {uptime !== undefined ? `${uptime.toFixed(1)}%` : loadingUptime ? '...' : '-'}
                <span style={{ marginLeft: 4, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowUptimeInfo(true); }}>ℹ️</span>
              </td>
              <td style={tdStyle}>
                <span style={{
                  background: v.active ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #dc3545, #fd7e14)',
                  color: POLKADOT_COLORS.white, padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem'
                }}>{v.active ? 'Active' : 'Inactive'}</span>
              </td>
              <td style={tdStyle} onClick={e => e.stopPropagation()}>
                {stats ? <button style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', background: POLKADOT_COLORS.primary, color: 'white' }}
                  onClick={() => setSelectedValidator(stats)}>Actions</button> : '-'}
              </td>
            </tr>
            {isExpanded && stats && (
              <tr>
                <td colSpan={9} style={{ padding: '1.5rem', background: '#fafafa' }}>
                  <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                    <div style={cardStyle}>
                      <h4 style={sectionTitleStyle}>Staking Information</h4>
                      <div>Total Stake: <strong>{formatStake(stats.totalStake)} DOT</strong></div>
                      <div>Self Stake: <strong>{formatStake(stats.selfStake)} DOT</strong></div>
                      <div>Other Stake: <strong>{formatStake(stats.otherStake)} DOT</strong></div>
                      <div>Nominators: <strong>{stats.nominators}</strong></div>
                      <div>Uptime: <strong>{uptime !== undefined ? uptime.toFixed(1) + '%' : '-'}</strong></div>
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
                        {stats.eraPoints.slice(-10).reverse().map((ep: any, i: number) => (
                          <div key={i}>
                            Era {stats.eraPoints.length - 10 + i}: <strong>{String(ep)}</strong> points
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
  );

  return (
    <div>
      <h2 style={headingStyle}>{title}</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input type="text" placeholder="Filter by validator address..."
          value={addressFilter} onChange={e => setAddressFilter(e.target.value)}
          style={{ padding: '0.5rem', border: `1px solid ${POLKADOT_COLORS.storm400}`, borderRadius: '4px', width: '100%', maxWidth: '400px', fontSize: '0.9rem' }} />
      </div>
      <div style={tableWrapperStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: `linear-gradient(135deg, ${POLKADOT_COLORS.storm200}, ${POLKADOT_COLORS.white})` }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Identity</th>
              <th style={thStyle}>Address</th>
              <th style={thStyle}>Commission</th>
              <th style={thStyle}>Performance</th>
              <th style={thStyle}>Last Block</th>
              <th style={thStyle}>Uptime</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Quick Actions</th>
            </tr>
          </thead>
          {renderBody()}
        </table>
      </div>
      {visibleCount < filteredValidators.length && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button onClick={() => setVisibleCount(visibleCount + itemsPerPage)}
            style={{ padding: '0.5rem 1rem', background: POLKADOT_COLORS.primary, color: 'white', border: 'none', borderRadius: '4px'}}>
            Load More
          </button>
        </div>
      )}
      {/* Modals */}
      {selectedValidator && (
        <div style={modalOverlayStyle} onClick={() => setSelectedValidator(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3>Quick Actions</h3>
            <p><strong>Performance:</strong> {selectedValidator.performance.toFixed(1)}%</p>
            <p><strong>Commission:</strong> {selectedValidator.commission.toFixed(2)}%</p>
            {getSuggestions(selectedValidator).map((s, i) => (
              <div key={i}><b>{s.title}</b>: {s.description}</div>
            ))}
            <button onClick={() => setSelectedValidator(null)}>Close</button>
          </div>
        </div>
      )}
      {showUptimeInfo && (
        <div style={modalOverlayStyle} onClick={() => setShowUptimeInfo(false)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3>Uptime Calculation</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{uptimeInfoText}</pre>
            <button onClick={() => setShowUptimeInfo(false)}>Close</button>
          </div>
        </div>
      )}
      {showPerformanceInfo && (
        <div style={modalOverlayStyle} onClick={() => setShowPerformanceInfo(false)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3>Performance Calculation</h3>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{performanceInfoText}</pre>
            <button onClick={() => setShowPerformanceInfo(false)}>Close</button>
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
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
const modalContentStyle: React.CSSProperties = { background: 'white', padding: '1.5rem', borderRadius: '8px', minWidth: '320px', maxWidth: '500px' };
