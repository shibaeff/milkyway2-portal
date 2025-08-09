import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getValidatorPerformanceColor } from '../services/validatorStatistics'; // NEW

// Suggestion logic (NEW)
function getSuggestions(stats: any) {
  if (!stats) return [];
  const suggestions = [];
  if (stats.performance < 50) {
    suggestions.push({
      severity: 'critical',
      title: 'Low Performance',
      description: 'Performance below 50%. Switch soon.'
    });
  } else if (stats.performance < 70) {
    suggestions.push({
      severity: 'warning',
      title: 'Average Performance',
      description: 'Monitor and consider other options.'
    });
  } else {
    suggestions.push({
      severity: 'info',
      title: 'Good Performance',
      description: 'No immediate action needed.'
    });
  }
  if (stats.commission > 20) {
    suggestions.push({
      severity: 'warning',
      title: 'High Commission',
      description: 'Commission rate is high.'
    });
  }
  return suggestions;
}

interface ValidatorReport {
  validatorAddress: string;
  message: string;
}

interface ValidatorReportProps {
  isWalletConnected: boolean;
  walletAddress: string | null;
  stats?: any; // NEW optional prop
}

interface VerificationResult {
  success: boolean;
  signature?: string;
  message?: string;
  fullResponse?: any;
}

export const ValidatorReport: React.FC<ValidatorReportProps> = ({
  isWalletConnected,
  walletAddress,
  stats
}) => {
  const [report, setReport] = useState<ValidatorReport>({
    validatorAddress: '',
    message: '',
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmittingOnChain, setIsSubmittingOnChain] = useState(false);
  const [isSimpleSubmitting, setIsSimpleSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (field: keyof ValidatorReport, value: string) => {
    setReport(prev => ({ ...prev, [field]: value }));
  };

  const validateReport = (): boolean => {
    if (!report.validatorAddress.trim()) {
      setErrorMessage('Validator address is required');
      return false;
    }
    if (!report.message.trim()) {
      setErrorMessage('Message is required');
      return false;
    }
    return true;
  };

  const verifyReport = async () => {
    if (!isWalletConnected || !walletAddress) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    if (!validateReport()) {
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const response = await fetch('http://localhost:4001/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validator_address: report.validatorAddress,
          nominator_address: walletAddress,
          msg: report.message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setVerificationResult({
          success: true,
          signature: result.signature,
          message: 'Report verified successfully!',
          fullResponse: result
        });
        setSubmitStatus('success');
      } else {
        setVerificationResult({
          success: false,
          message: result.error || 'Verification failed',
          fullResponse: result
        });
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error verifying report:', error);
      setVerificationResult({
        success: false,
        message: 'Failed to connect to verification service'
      });
      setSubmitStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const submitOnChain = async () => {
    if (!verificationResult?.success) {
      setErrorMessage('Please verify the report first');
      return;
    }

    setIsSubmittingOnChain(true);
    setErrorMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('Submitting verified report on-chain:', {
        validatorAddress: report.validatorAddress,
        nominatorAddress: walletAddress,
        message: report.message,
        signature: verificationResult.signature,
        timestamp: new Date().toISOString(),
      });

      setSubmitStatus('success');
      setVerificationResult(null);
      setReport({
        validatorAddress: '',
        message: '',
      });
    } catch (error) {
      console.error('Error submitting on-chain:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit on-chain. Please try again.');
    } finally {
      setIsSubmittingOnChain(false);
    }
  };

  const simpleSubmit = async () => {
    if (!isWalletConnected || !walletAddress) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    if (!validateReport()) {
      return;
    }

    setIsSimpleSubmitting(true);
    setErrorMessage(null);
    let nativeSymbol = 'ETH';

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
      }

      const contractABI = [
        { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
        {
          "anonymous": false,
          "inputs": [
            { "indexed": false, "internalType": "string", "name": "validator", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "nominator", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "msgText", "type": "string" }
          ],
          "name": "MessageStored",
          "type": "event"
        },
        {
          "inputs": [ { "internalType": "uint256", "name": "index", "type": "uint256" } ],
          "name": "getMessage",
          "outputs": [
            {
              "components": [
                { "internalType": "string", "name": "validator_address", "type": "string" },
                { "internalType": "string", "name": "nominator_address", "type": "string" },
                { "internalType": "string", "name": "msgText", "type": "string" }
              ],
              "internalType": "struct OracleVerifiedDelegation.Message",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getMessageCount",
          "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
          "name": "messages",
          "outputs": [
            { "internalType": "string", "name": "validator_address", "type": "string" },
            { "internalType": "string", "name": "nominator_address", "type": "string" },
            { "internalType": "string", "name": "msgText", "type": "string" }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "oracleAddress",
          "outputs": [ { "internalType": "address", "name": "", "type": "address" } ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            { "internalType": "string", "name": "validator_address", "type": "string" },
            { "internalType": "string", "name": "nominator_address", "type": "string" },
            { "internalType": "string", "name": "msgText", "type": "string" },
            { "internalType": "bytes", "name": "signature", "type": "bytes" }
          ],
          "name": "submitMessage",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            { "internalType": "string", "name": "validator_address", "type": "string" },
            { "internalType": "string", "name": "nominator_address", "type": "string" },
            { "internalType": "string", "name": "msgText", "type": "string" }
          ],
          "name": "submitMessageUnverified",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];

      const injectedEthereum: any = (window as any).ethereum;
      const talismanEth: any = (window as any).talismanEth;
      const candidates = [injectedEthereum, talismanEth].filter(Boolean);
      let rawProvider: any = null;
      let accounts: string[] = [];
      for (const c of candidates) {
        try {
          const req = c.request
            ? (method: string, params?: any[]) => c.request({ method, params })
            : (method: string, params?: any[]) => c.send(method, params ?? []);
          const accs = await req('eth_requestAccounts');
          if (Array.isArray(accs) && accs.length > 0) {
            rawProvider = c;
            accounts = accs;
            break;
          }
        } catch (_) {}
      }
      if (!rawProvider || accounts.length === 0) {
        throw new Error('No EVM accounts available. Please connect MetaMask/Talisman.');
      }
      const provider = new ethers.providers.Web3Provider(rawProvider, 'any');
      const providerRequest = async (method: string, params?: any[]) => provider.send(method, params ?? []);
      const account = accounts[0];
      const signer = provider.getSigner(account);

      const finalChainId = await providerRequest('eth_chainId');
      const WESTEND_ASSET_HUB_CHAIN_ID = '0x190f1b45';
      const SEPOLIA_CHAIN_ID = '0xaa36a7';
      let contractAddress = '';
      if (finalChainId === WESTEND_ASSET_HUB_CHAIN_ID) {
        contractAddress = '0x42245eAe30399974e89D9DE9602403F23e980993';
        nativeSymbol = 'WND';
      } else if (finalChainId === SEPOLIA_CHAIN_ID) {
        contractAddress = '0x21F440BF2c87FF692F1c9B8eE08300ffb1c8D87A';
        nativeSymbol = 'ETH';
      } else {
        throw new Error('Unsupported EVM network.');
      }

      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const hasVerified = !!verificationResult?.success && !!verificationResult?.signature;
      const methodName = hasVerified ? 'submitMessage' : 'submitMessageUnverified';
      const methodArgs = hasVerified
        ? [report.validatorAddress, walletAddress, report.message, verificationResult!.signature]
        : [report.validatorAddress, walletAddress, report.message];

      try {
        // @ts-ignore
        await contract.callStatic[methodName](...methodArgs);
      } catch (preflightError: any) {
        console.warn('Preflight failed', preflightError);
      }

      let gasLimit;
      let gasPrice;
      try {
        // @ts-ignore
        gasLimit = await contract.estimateGas[methodName](...methodArgs);
      } catch {
        gasLimit = ethers.BigNumber.from('500000');
      }
      try {
        gasPrice = await provider.getGasPrice();
      } catch {
        gasPrice = ethers.BigNumber.from(1);
      }

      // @ts-ignore
      const txResponse = await contract[methodName](...methodArgs, { gasLimit, gasPrice });
      await txResponse.wait();

      setSubmitStatus('success');
      setReport({
        validatorAddress: '',
        message: '',
      });
    } catch (error: any) {
      console.error('Error submitting:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to submit.');
    } finally {
      setIsSimpleSubmitting(false);
    }
  };

  if (!isWalletConnected) {
    return (
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#333' }}>Submit Validator Report</h3>
        <p style={{ color: '#666' }}>
          Please connect your wallet to a supported network to submit validator reports.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginBottom: '1rem', color: '#333' }}>Submit Validator Report</h3>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Report suspicious or problematic validator behavior.
      </p>

      {submitStatus === 'success' && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #c3e6cb'
        }}>
          {verificationResult?.success
            ? 'Report verified and submitted successfully!'
            : 'Report submitted successfully! Your report has been recorded on the blockchain.'}
        </div>
      )}

      {errorMessage && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #f5c6cb'
        }}>
          {errorMessage}
        </div>
      )}

      {verificationResult && (
        <div style={{
          background: verificationResult.success ? '#d4edda' : '#f8d7da',
          color: verificationResult.success ? '#155724' : '#721c24',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: `1px solid ${verificationResult.success ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
            {verificationResult.message}
          </div>
          {verificationResult.fullResponse && (
            <div style={{
              marginTop: '1rem',
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{
                marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.875rem'
              }}>API Response:</div>
              <pre style={{
                background: '#f8f9fa', padding: '0.75rem', borderRadius: '4px',
                border: '1px solid #dee2e6', fontSize: '0.75rem', overflow: 'auto',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'monospace'
              }}>
                {JSON.stringify(verificationResult.fullResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Validator Address *
          </label>
          <input
            type="text"
            value={report.validatorAddress}
            onChange={(e) => handleInputChange('validatorAddress', e.target.value)}
            placeholder="Enter validator address (0x...)"
            style={{
              width: '100%', padding: '0.75rem', border: '1px solid #ddd',
              borderRadius: '4px', fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Message *
          </label>
          <textarea
            value={report.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Enter your report message..."
            rows={6}
            style={{
              width: '100%', padding: '0.75rem', border: '1px solid #ddd',
              borderRadius: '4px', fontSize: '0.875rem', resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={simpleSubmit}
            disabled={isSimpleSubmitting || isVerifying}
            style={{
              background: '#dc3545', color: 'white', border: 'none',
              padding: '0.75rem 1.5rem', borderRadius: '4px',
              cursor: isSimpleSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '1rem', fontWeight: 'bold',
              opacity: isSimpleSubmitting ? 0.6 : 1
            }}
          >
            {isSimpleSubmitting ? 'Submitting...' : 'SimpleSubmit'}
          </button>

          {verificationResult?.success && (
            <button
              type="button"
              onClick={submitOnChain}
              disabled={isSubmittingOnChain}
              style={{
                background: '#28a745', color: 'white', border: 'none',
                padding: '0.75rem 1.5rem', borderRadius: '4px',
                cursor: isSubmittingOnChain ? 'not-allowed' : 'pointer',
                fontSize: '1rem', fontWeight: 'bold',
                opacity: isSubmittingOnChain ? 0.6 : 1
              }}
            >
              {isSubmittingOnChain ? 'Submitting...' : 'Submit On-Chain'}
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#333' }}>Instructions:</h4>
        <div style={{ fontSize: '0.875rem', color: '#666', lineHeight: '1.6' }}>
          <p><strong>1. SimpleSubmit:</strong> Directly submits the report to the contract.</p>
          <p><strong>2. Submit On-Chain:</strong> Submits the verified report to the blockchain.</p>
          <p style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>
            <strong>Note:</strong> Verify Report code exists but its button is hidden in UI.
          </p>
        </div>
      </div>

      {/* --- NEW Quick Actions --- */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3>Performance Metrics</h3>
        <div>
          <strong>Total Era Points:</strong> {stats?.totalEraPoints ?? '-'}<br />
          <strong>Average Era Points:</strong> {stats?.averageEraPoints ?? '-'}<br />
          <strong>Last Block Points:</strong> {stats?.lastEraPoints ?? '-'}<br />
          <strong>Performance:</strong>{' '}
          <span style={{ color: stats ? getValidatorPerformanceColor(stats.performance) : '#333' }}>
            {stats ? stats.performance.toFixed(1) : '-'}%
          </span>
        </div>
        {stats && (
          <div style={{
            marginTop: '1.2rem', padding: '0.9rem',
            background: '#f6faff', borderRadius: '5px',
            border: '1px solid #d0e0ef'
          }}>
            <h4>Quick Actions</h4>
            {getSuggestions(stats).map((s, idx) => (
              <div key={idx} style={{
                borderLeft: `4px solid ${s.severity === 'critical' ? 'red' : s.severity === 'warning' ? 'orange' : '#007bff'}`,
                background: '#f9f9fa', padding: '0.5rem 0.8rem',
                marginBottom: 8, borderRadius: 3
              }}>
                <strong>{s.title}</strong> — <span>{s.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
