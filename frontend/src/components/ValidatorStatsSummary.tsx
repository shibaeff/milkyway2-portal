import React, { useState, useEffect } from 'react';
import { useValidators } from '../contexts/Validators/ValidatorEntries';
import { useApi } from '../contexts/Api';
import type { ValidatorStatistics } from '../types';
import { calculateValidatorStatistics, getValidatorPerformanceColor } from '../services/validatorStatistics';

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

  useEffect(() => {
    const calculateSummaryStats = async () => {
      if (!api || !isReady) return;

      setSummaryStats(prev => ({ ...prev, loading: true }));
      
      try {
        const validators = getValidators();
        const currentEra = await api.query.staking.currentEra();
        const era = currentEra ? (currentEra as any).unwrap().toNumber() : 1892;
        
        // Calculate stats for a sample of validators (first 30 for comprehensive analysis)
        const sampleValidators = validators.slice(0, 30);
        const validatorStats: ValidatorStatistics[] = [];
        
        for (const validator of sampleValidators) {
          try {
            const stats = await calculateValidatorStatistics(validator, api, era);
            validatorStats.push(stats);
          } catch (error) {
            console.log('Failed to calculate stats for', validator.address);
          }
        }
        
        // Calculate summary statistics
        const activeValidators = validators.filter(v => v.active).length;
        const totalCommission = validators.reduce((sum, v) => sum + v.commission, 0);
        const averageCommission = validators.length > 0 ? totalCommission / validators.length : 0;
        
        const totalPerformance = validatorStats.reduce((sum, stats) => sum + stats.performance, 0);
        const averagePerformance = validatorStats.length > 0 ? totalPerformance / validatorStats.length : 0;
        
        const totalEraPoints = validatorStats.reduce((sum, stats) => sum + stats.totalEraPoints, 0);
        const averageEraPoints = validatorStats.length > 0 ? totalEraPoints / validatorStats.length : 0;
        
        // Get top performers based on recent performance (last 20 blocks)
        const topPerformers = validatorStats
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
        
      } catch (error) {
        console.error('Failed to calculate summary stats:', error);
        setSummaryStats(prev => ({ ...prev, loading: false }));
      }
    };

    calculateSummaryStats();
  }, [api, isReady, getValidators]);

  if (summaryStats.loading) {
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
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Validator Count</h4>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
            {summaryStats.totalValidators.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
            {summaryStats.activeValidators} active
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Average Commission</h4>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
            {summaryStats.averageCommission.toFixed(2)}%
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Network Performance</h4>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: getValidatorPerformanceColor(summaryStats.averagePerformance)
          }}>
            {summaryStats.averagePerformance.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
            Recent performance average
          </div>
        </div>
        
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Average Block Points</h4>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fd7e14' }}>
            {summaryStats.averageEraPoints.toFixed(0)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
            Per validator
          </div>
        </div>
      </div>
      
      {summaryStats.topPerformers.length > 0 && (
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>Top Performers</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {summaryStats.topPerformers.map((performer, index) => (
              <div key={performer.address} style={{
                padding: '0.75rem',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                background: index === 0 ? '#fff3cd' : 'transparent',
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  #{index + 1} {performer.address.slice(0, 8)}...{performer.address.slice(-8)}
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  <div>Performance: <span style={{ 
                    color: getValidatorPerformanceColor(performer.performance),
                    fontWeight: 'bold'
                  }}>{performer.performance.toFixed(1)}%</span></div>
                  <div>Last Block: {performer.lastEraPoints.toLocaleString()} points</div>
                  <div>Commission: {performer.commission.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 