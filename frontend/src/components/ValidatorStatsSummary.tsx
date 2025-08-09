import React, { useState, useEffect } from 'react';
import { useValidators } from '../contexts/Validators/ValidatorEntries';
import { useApi } from '../contexts/Api';
import type { ValidatorStatistics } from '../types';
import {
  calculateValidatorStatistics,
  getValidatorPerformanceColor,
} from '../services/validatorStatistics';

// Suggestion logic
const getSuggestions = (validator: ValidatorStatistics) => {
  const suggestions: {
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
  }[] = [];

  if (validator.performance < 50) {
    suggestions.push({
      severity: 'critical',
      title: 'Low Performance',
      description:
        'Performance below 50%. Switch to a more reliable validator for better rewards.',
    });
  } else if (validator.performance < 70) {
    suggestions.push({
      severity: 'warning',
      title: 'Average Performance',
      description: 'Performance below optimal range. Monitor closely.',
    });
  } else {
    suggestions.push({
      severity: 'info',
      title: 'Good Performance',
      description: 'Validator performing well. No immediate action needed.',
    });
  }

  if (validator.commission > 20) {
    suggestions.push({
      severity: 'warning',
      title: 'High Commission',
      description: `Commission is ${validator.commission.toFixed(
        2,
      )}%, above recommended (<10%). Consider switching for better returns.`,
    });
  }

  return suggestions;
};

// Summary card helper
function SummaryCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{title}</h4>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: color || '#000' }}>{value}</div>
      {subtitle && (
        <div style={{ fontSize: '0.9rem', color: '#6c757d', marginTop: 5 }}>{subtitle}</div>
      )}
    </div>
  );
}

export const ValidatorStatsSummary: React.FC = () => {
  const { getValidators } = useValidators();
  const { api, isReady } = useApi();

  const [summaryStats, setSummaryStats] = useState({
    totalValidators: 0,
    activeValidators: 0,
    averageCommission: 0,
    averagePerformance: 0,
    averageEraPoints: 0,
    totalEraPoints: 0,
    topPerformers: [] as ValidatorStatistics[],
    loading: false,
  });

  const [validatorStats, setValidatorStats] = useState<ValidatorStatistics[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [selectedValidator, setSelectedValidator] = useState<ValidatorStatistics | null>(null);

  useEffect(() => {
    const calculateAllStats = async () => {
      if (!api || !isReady) return;

      setSummaryStats((prev) => ({ ...prev, loading: true }));
      setLoading(true);

      try {
        const validators = getValidators();
        const currentEra = await api.query.staking.currentEra();
        const era = currentEra ? (currentEra as any).unwrap().toNumber() : 1892;
        const sampleValidators = validators.slice(0, 30);
        const validatorStatsArr: ValidatorStatistics[] = [];

        // Compute stats for all, with progress
        for (const validator of validators) {
          try {
            const stats = await calculateValidatorStatistics(validator, api, era);
            validatorStatsArr.push(stats);
          } catch {
            /* Ignore */
          }
        }

        setValidatorStats([...validatorStatsArr]);

        // Summary stats calculation
        const activeValidators = validators.filter((v) => v.active).length;
        const totalCommission = validators.reduce((sum, v) => sum + v.commission, 0);
        const averageCommission = validators.length > 0 ? totalCommission / validators.length : 0;

        const totalPerformance = validatorStatsArr.reduce((sum, stats) => sum + stats.performance, 0);
        const averagePerformance =
          validatorStatsArr.length > 0 ? totalPerformance / validatorStatsArr.length : 0;

        const totalEraPoints = validatorStatsArr.reduce((sum, stats) => sum + stats.totalEraPoints, 0);
        const averageEraPoints =
          validatorStatsArr.length > 0 ? totalEraPoints / validatorStatsArr.length : 0;

        const topPerformers = validatorStatsArr
          .sort((a, b) => b.performance - a.performance)
          .slice(0, 5);

        setSummaryStats({
          totalValidators: validators.length,
          activeValidators,
          averageCommission,
          averagePerformance,
          averageEraPoints,
          totalEraPoints,
          topPerformers,
          loading: false,
        });

        setLoading(false);
      } catch (error) {
        setLoading(false);
        setSummaryStats((prev) => ({ ...prev, loading: false }));
      }
    };

    calculateAllStats();
  }, [api, isReady, getValidators]);

  if (summaryStats.loading || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Loading Network Performance Data...</h3>
        <p>Analyzing validator performance data</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#333' }}>Network Performance Summary</h3>

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <SummaryCard
          title="Validator Count"
          value={summaryStats.totalValidators.toLocaleString()}
          subtitle={`${summaryStats.activeValidators} active`}
          color="#007bff"
        />
        <SummaryCard
          title="Average Commission"
          value={`${summaryStats.averageCommission.toFixed(2)}%`}
          color="#28a745"
        />
        <SummaryCard
          title="Network Performance"
          value={`${summaryStats.averagePerformance.toFixed(1)}%`}
          color={getValidatorPerformanceColor(summaryStats.averagePerformance)}
          subtitle="Recent performance average"
        />
        <SummaryCard
          title="Average Block Points"
          value={summaryStats.averageEraPoints.toFixed(0)}
          color="#fd7e14"
          subtitle="Per validator"
        />
      </div>

      {/* Validator table with Quick Actions */}
      <div style={{ background: 'white', padding: '1.5rem 1rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
        <h4 style={{ marginBottom: '1rem', color: '#222' }}>Network Validators</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.98rem' }}>
            <thead>
              <tr style={{ background: '#f7f7fa', color: '#333', fontWeight: 700 }}>
                <th style={{ padding: 8 }}>Rank</th>
                <th style={{ padding: 8 }}>Address</th>
                <th style={{ padding: 8 }}>Commission</th>
                <th style={{ padding: 8 }}>Performance</th>
                <th style={{ padding: 8 }}>Last Block</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {validatorStats.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '1.2rem' }}>No validators available</td>
                </tr>
              ) : (
                validatorStats.slice(0, 30).map((v, i) => (
                  <tr key={v.address} style={{ borderBottom: '1px solid #ededed' }}>
                    <td style={{ padding: 8 }}>{i + 1}</td>
                    <td style={{ fontFamily: 'monospace', padding: 8 }}>{v.address.slice(0, 8)}...{v.address.slice(-6)}</td>
                    <td style={{ padding: 8 }}>{v.commission.toFixed(2)}%</td>
                    <td style={{ padding: 8 }}>
                      <span style={{
                        color: getValidatorPerformanceColor(v.performance),
                        fontWeight: 'bold'
                      }}>
                        {v.performance.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: 8 }}>{v.lastEraPoints}</td>
                    <td style={{ padding: 8 }}>{v.isActive ? 'Active' : 'Inactive'}</td>
                    <td style={{ padding: 8 }}>
                      <button
                        style={{
                          padding: "0.3rem 0.7rem",
                          borderRadius: 4,
                          background: "#007bff",
                          color: "#fff",
                          border: "none",
                          fontSize: "0.93rem",
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedValidator(v)}
                        title="Show Quick Actions">
                        Quick Actions
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions Modal */}
      {selectedValidator && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999
        }}
          onClick={() => setSelectedValidator(null)}
        >
          <div
            style={{
              background: "#fff",
              padding: "1.5rem 1rem",
              borderRadius: 10,
              minWidth: 300,
              maxWidth: 400,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              position: "relative"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h4 style={{marginBottom:12}}>Quick Actions</h4>
            <div style={{fontSize:"0.96rem", marginBottom:"0.6rem"}}>
              <b>Address:</b>{' '}
              <span style={{fontFamily:'monospace'}}>{selectedValidator.address}</span><br/>
              <b>Performance:</b>{' '}
              <span style={{ color: getValidatorPerformanceColor(selectedValidator.performance) }}>
                {selectedValidator.performance.toFixed(1)}%
              </span><br />
              <b>Commission:</b> {selectedValidator.commission.toFixed(2)}%
            </div>
            <div>
              {getSuggestions(selectedValidator).map((s, idx) =>
                <div key={idx} style={{
                  borderLeft: `4px solid ${s.severity === 'critical' ? 'red' : s.severity === 'warning' ? 'orange' : '#007bff'}`,
                  background: "#f9f9fa",
                  padding: "0.5rem 0.6rem",
                  marginBottom: 7,
                  borderRadius: 3
                }}>
                  <b>{s.title}</b> <span style={{fontSize:"0.93rem", color:"#555"}}>{s.description}</span>
                </div>
              )}
            </div>
            <div style={{textAlign:'right'}}>
              <button
                style={{
                  marginTop:'1rem',
                  padding:'0.4rem 1.1rem',
                  borderRadius:4,
                  background:'#007bff',
                  color:'#fff',
                  border:'none',
                  fontWeight:600,
                  fontSize:"1rem",
                  cursor:"pointer"
                }}
                onClick={() => setSelectedValidator(null)}
              >Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
