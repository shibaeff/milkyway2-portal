import React, { useState, useEffect } from 'react';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  balance: string | null;
  walletType: 'polkadot' | 'talisman' | 'metamask' | null;
}

interface WalletConnectProps {
  onWalletStateChange?: (isConnected: boolean, address: string | null) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onWalletStateChange }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    walletType: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const WESTEND_NETWORK_NAME = 'Testnet';

  useEffect(() => {
    console.log('🔄 useEffect triggered - checking wallet connection on component mount');
    checkWalletConnection();
  }, []);

  // Call the callback whenever wallet state changes
  useEffect(() => {
    console.log('🔄 Wallet state changed:', { 
      isConnected: walletState.isConnected, 
      address: walletState.address,
      walletType: walletState.walletType 
    });
    
    if (onWalletStateChange) {
      console.log('📞 Calling onWalletStateChange callback...');
      onWalletStateChange(walletState.isConnected, walletState.address);
    }
  }, [walletState.isConnected, walletState.address, onWalletStateChange]);

  // EVM RPC + token decimals
  const WESTEND_ASSET_HUB_RPC = 'https://westend-asset-hub-eth-rpc.polkadot.io';
  const WND_DECIMALS = 12;
  // Sepolia (Ethereum testnet) RPC + token decimals
  const SEPOLIA_RPC = 'https://rpc.sepolia.org';
  const SEPOLIA_DECIMALS = 18;
  const SEPOLIA_CHAIN_ID = '0xaa36a7';

  // Fetch balance from an EVM RPC
  const fetchEvmBalance = async (address: string, rpcUrl: string, decimals: number): Promise<string | null> => {
    try {
      const body = {
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      };

      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const hex = json?.result as string | undefined;
      if (!hex) {
        console.warn('eth_getBalance returned no result', json);
        return null;
      }
      // Convert hex to decimal and then to WND with 12 decimals
      const wei = new BigNumber(BigInt(hex).toString());
      const amount = wei.dividedBy(new BigNumber(10).pow(decimals));
      // Format with up to 6 fractional digits, trim trailing zeros
      return amount.toFormat(6);
    } catch (e) {
      console.error('Failed to fetch EVM balance:', e);
      return null;
    }
  };

  const checkWalletConnection = async () => {
    console.log('🔍 Starting wallet connection check...');
    const startTime = Date.now();
    
    // Check MetaMask (EVM)
    if (typeof window.ethereum !== 'undefined') {
      try {
        console.log('📡 Checking MetaMask connection...');
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          console.log('✅ MetaMask connected with chainId:', chainId);
          await updateWalletState(accounts[0], chainId, 'metamask');
        }
      } catch (err) {
        console.error('❌ Error checking MetaMask connection:', err);
      }
    }

    // Check Talisman (EVM mode)
    console.log('🔍 Checking for Talisman wallet...');
    console.log('📋 window.talisman:', typeof window.talisman);
    console.log('📋 window.ethereum (Talisman):', typeof window.ethereum);
    console.log('📋 window.talismanEth:', typeof (window as any).talismanEth);
    
    // Talisman can inject multiple objects
    if (typeof window.talisman !== 'undefined') {
      try {
        console.log('📡 Checking Talisman EVM connection...');
        const accounts = await window.talisman.getAccounts();
        if (accounts.length > 0) {
          console.log('✅ Talisman connected with accounts:', accounts.length);
          await updateWalletState(accounts[0].address, '0x190f1b45', 'talisman');
        }
      } catch (err) {
        console.error('❌ Error checking Talisman connection:', err);
      }
    } else if (typeof window.ethereum !== 'undefined' && window.ethereum.isTalisman) {
      try {
        console.log('📡 Checking Talisman via ethereum object...');
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          console.log('✅ Talisman (via ethereum) connected with accounts:', accounts.length);
          await updateWalletState(accounts[0], '0x190f1b45', 'talisman');
        }
      } catch (err) {
        console.error('❌ Error checking Talisman via ethereum:', err);
      }
    } else if (typeof (window as any).talismanEth !== 'undefined') {
      try {
        console.log('📡 Checking Talisman via talismanEth object...');
        const accounts = await (window as any).talismanEth.send('eth_accounts');
        if (accounts && accounts.length > 0) {
          console.log('✅ Talisman (via talismanEth) connected with accounts:', accounts.length);
          await updateWalletState(accounts[0], '0x190f1b45', 'talisman');
        }
      } catch (err) {
        console.error('❌ Error checking Talisman via talismanEth:', err);
      }
    }

    // Check Polkadot Extension (for native Polkadot)
    try {
      console.log('📡 Attempting to enable Polkadot extensions...');
      const extensions = await web3Enable('Validator Dashboard');
      console.log('✅ Extensions enabled:', extensions.length, 'found');
      console.log('📋 Extension names:', extensions.map(ext => ext.name));
      
      if (extensions.length > 0) {
        console.log('🔍 Loading accounts from extensions...');
        const accounts = await web3Accounts();
        console.log('✅ Accounts loaded:', accounts.length, 'found');
        
        if (accounts.length > 0) {
          console.log('📋 Account addresses:', accounts.map(acc => acc.address));
          console.log('🔗 Updating wallet state with first account...');
          await updateWalletState(accounts[0].address, 'westend', 'polkadot');
        } else {
          console.log('⚠️ No accounts found in extensions');
        }
      } else {
        console.log('⚠️ No Polkadot extensions found');
      }
    } catch (err) {
      console.error('❌ Error checking Polkadot extension connection:', err);
    }
    
    const endTime = Date.now();
    console.log(`⏱️ Wallet connection check completed in ${endTime - startTime}ms`);
  };

  const updateWalletState = async (address: string, chainId: string, walletType: 'polkadot' | 'talisman' | 'metamask') => {
    console.log('🔄 Starting wallet state update...');
    const startTime = Date.now();
    
    try {
      console.log('📋 Updating wallet state with:', { address, chainId, walletType });

      // Immediately set basic state so UI updates without waiting for balance
      setWalletState({
        isConnected: true,
        address,
        chainId,
        balance: null,
        walletType,
      });

      // Fetch balance asynchronously to avoid hanging the UI
      (async () => {
        try {
          let fetchedBalance: string | null = null;
          if ((walletType === 'talisman' || walletType === 'metamask') && address) {
            if (chainId === '0x190f1b45') {
              fetchedBalance = await Promise.race([
                fetchEvmBalance(address, WESTEND_ASSET_HUB_RPC, WND_DECIMALS),
                new Promise<string | null>(resolve => setTimeout(() => resolve(null), 4000)),
              ]);
            } else if (chainId === SEPOLIA_CHAIN_ID) {
              fetchedBalance = await Promise.race([
                fetchEvmBalance(address, SEPOLIA_RPC, SEPOLIA_DECIMALS),
                new Promise<string | null>(resolve => setTimeout(() => resolve(null), 4000)),
              ]);
            }
          }

          // Only update if the address/chainId are still current
          setWalletState(prev => {
            if (!prev.isConnected) return prev;
            if (prev.address !== address || prev.chainId !== chainId || prev.walletType !== walletType) return prev;
            return { ...prev, balance: fetchedBalance };
          });
        } catch (balanceErr) {
          console.warn('Failed to fetch balance (non-fatal):', balanceErr);
        }
      })();

      const endTime = Date.now();
      console.log(`⏱️ Wallet state update completed in ${endTime - startTime}ms`);
    } catch (err) {
      console.error('❌ Error updating wallet state:', err);
      const errorTime = Date.now();
      console.log(`⏱️ Wallet state update failed after ${errorTime - startTime}ms`);
    }
  };

  

  const connectMetaMask = async () => {
    console.log('🚀 Starting MetaMask connection...');
    const startTime = Date.now();
    
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed. Please install MetaMask to use this feature.');
        return;
      }

      console.log('📡 Requesting MetaMask accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      console.log('✅ MetaMask connected with chainId:', chainId);
      
      // Check if we're on Westend Asset Hub
      const WESTEND_ASSET_HUB_CHAIN_ID = '0x190f1b45'; // 420420421 in decimal
      if (chainId !== WESTEND_ASSET_HUB_CHAIN_ID) {
        console.log('🔄 Switching to Westend Asset Hub network...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: WESTEND_ASSET_HUB_CHAIN_ID }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            console.log('➕ Adding Westend Asset Hub network to MetaMask...');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: WESTEND_ASSET_HUB_CHAIN_ID,
                  chainName: 'Westend Asset Hub',
                  nativeCurrency: {
                    name: 'Westend Asset Hub Token',
                    symbol: 'WND',
                    decimals: 12,
                  },
                  rpcUrls: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
                  blockExplorerUrls: ['https://westend-assets.subscan.io'],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      await updateWalletState(accounts[0], WESTEND_ASSET_HUB_CHAIN_ID, 'metamask');
      const endTime = Date.now();
      console.log(`⏱️ MetaMask connection completed in ${endTime - startTime}ms`);
      
    } catch (err: any) {
      console.error('❌ Error connecting MetaMask:', err);
      const errorTime = Date.now();
      console.log(`⏱️ MetaMask connection failed after ${errorTime - startTime}ms`);
      setError(err.message || 'Failed to connect MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectSepolia = async () => {
    console.log('🚀 Starting MetaMask connection (Sepolia)...');
    const startTime = Date.now();
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed. Please install MetaMask to use this feature.');
        return;
      }

      console.log('📡 Requesting MetaMask accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      let currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        console.log('🔄 Switching to Sepolia network...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            console.log('➕ Adding Sepolia to MetaMask...');
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: SEPOLIA_CHAIN_ID,
                  chainName: 'Sepolia',
                  nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: [SEPOLIA_RPC],
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                },
              ],
            });
            // After adding, attempt switch again for reliability
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: SEPOLIA_CHAIN_ID }],
            });
          } else {
            throw switchError;
          }
        }
        // Re-read the chain after switch/add
        currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== SEPOLIA_CHAIN_ID) {
          throw new Error('Failed to switch to Sepolia. Please approve the network switch in your wallet.');
        }
      }

      await updateWalletState(accounts[0], SEPOLIA_CHAIN_ID, 'metamask');
      const endTime = Date.now();
      console.log(`⏱️ MetaMask Sepolia connection completed in ${endTime - startTime}ms`);
    } catch (err: any) {
      console.error('❌ Error connecting MetaMask (Sepolia):', err);
      const errorTime = Date.now();
      console.log(`⏱️ MetaMask Sepolia connection failed after ${errorTime - startTime}ms`);
      setError(err.message || 'Failed to connect MetaMask (Sepolia)');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectTalisman = async () => {
    console.log('🚀 Starting Talisman EVM connection...');
    const startTime = Date.now();
    
    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔍 Checking Talisman availability...');
      console.log('📋 window.talisman:', typeof window.talisman);
      console.log('📋 window.ethereum.isTalisman:', window.ethereum?.isTalisman);
      console.log('📋 window.talismanEth:', typeof (window as any).talismanEth);
      
      // Try Talisman-specific API first
      if (typeof window.talisman !== 'undefined') {
        console.log('📡 Using Talisman-specific API...');
        const accounts = await window.talisman.getAccounts();
        
        if (accounts.length === 0) {
          setError('No accounts found in Talisman. Please add an account to your wallet.');
          return;
        }

        console.log('✅ Talisman connected with accounts:', accounts.length);
        await updateWalletState(accounts[0].address, '0x190f1b45', 'talisman');
        const endTime = Date.now();
        console.log(`⏱️ Talisman connection completed in ${endTime - startTime}ms`);
        return;
      }
      
      // Try via ethereum object if Talisman injects there
      if (typeof window.ethereum !== 'undefined' && window.ethereum.isTalisman) {
        console.log('📡 Using Talisman via ethereum object...');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length === 0) {
          setError('No accounts found in Talisman. Please add an account to your wallet.');
          return;
        }

        console.log('✅ Talisman (via ethereum) connected with accounts:', accounts.length);
        await updateWalletState(accounts[0], '0x190f1b45', 'talisman');
        const endTime = Date.now();
        console.log(`⏱️ Talisman connection completed in ${endTime - startTime}ms`);
        return;
      }
      
      // Try talismanEth object
      if (typeof (window as any).talismanEth !== 'undefined') {
        console.log('📡 Using Talisman via talismanEth object...');
        const accounts = await (window as any).talismanEth.send('eth_requestAccounts');
        
        if (accounts && accounts.length > 0) {
          console.log('✅ Talisman (via talismanEth) connected with accounts:', accounts.length);
          await updateWalletState(accounts[0], '0x190f1b45', 'talisman');
          const endTime = Date.now();
          console.log(`⏱️ Talisman connection completed in ${endTime - startTime}ms`);
          return;
        }
      }
      
      // If neither method works
      setError('Talisman is not installed or not detected. Please install Talisman to use this feature.');
      
    } catch (err: any) {
      console.error('❌ Error connecting Talisman:', err);
      const errorTime = Date.now();
      console.log(`⏱️ Talisman connection failed after ${errorTime - startTime}ms`);
      setError(err.message || 'Failed to connect Talisman');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectPolkadotExtension = async () => {
    console.log('🚀 Starting Polkadot extension connection...');
    const startTime = Date.now();
    
    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔗 Connecting Polkadot extension');
      console.log('📡 Step 1: Enabling extensions...');
      
      // Trigger extension to request permissions
      const extensions = await web3Enable('Validator Dashboard');
      const enableTime = Date.now();
      console.log(`⏱️ Extensions enabled in ${enableTime - startTime}ms`);
      
      if (extensions.length === 0) {
        console.log('❌ No Polkadot extensions found');
        setError('No Polkadot extension found. Please install the Polkadot.js extension.');
        return;
      }

      console.log('✅ Polkadot extension detected:', extensions.map(ext => ext.name));
      console.log('📡 Step 2: Loading accounts...');

      // Load the available accounts injected by the extension
      const accounts = await web3Accounts();
      const accountsTime = Date.now();
      console.log(`⏱️ Accounts loaded in ${accountsTime - enableTime}ms`);
      
      if (accounts.length === 0) {
        console.log('❌ No accounts found in extension');
        setError('No accounts found in Polkadot extension. Please add accounts to your extension.');
        return;
      }

      console.log('📋 Found accounts in Polkadot extension:', accounts.map(acc => acc.address));
      console.log('📡 Step 3: Updating wallet state...');

      // Use the first account
      await updateWalletState(accounts[0].address, 'westend', 'polkadot');
      const updateTime = Date.now();
      console.log(`⏱️ Wallet state updated in ${updateTime - accountsTime}ms`);
      
      console.log('✅ Successfully connected Polkadot extension');
      console.log(`⏱️ Total connection time: ${updateTime - startTime}ms`);
      
    } catch (err: any) {
      console.error('❌ Error connecting Polkadot extension:', err);
      const errorTime = Date.now();
      console.log(`⏱️ Connection failed after ${errorTime - startTime}ms`);
      setError(err.message || 'Failed to connect Polkadot extension');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      walletType: null,
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = () => {
    if (walletState.walletType === 'metamask') {
      if (walletState.chainId === '0x190f1b45') return 'EVM';
      if (walletState.chainId === SEPOLIA_CHAIN_ID) return 'Sepolia (EVM)';
      return 'EVM (Unknown)';
    } else if (walletState.walletType === 'talisman') {
      if (walletState.chainId === '0x190f1b45') return 'EVM';
      if (walletState.chainId === SEPOLIA_CHAIN_ID) return 'Sepolia (EVM)';
      return 'EVM (Unknown)';
    } else if (walletState.walletType === 'polkadot') {
      // Native Polkadot display
      if (walletState.chainId === 'westend' || walletState.address?.startsWith('5')) {
        return 'Polkadot (Native)';
      }
      return 'Polkadot';
    }
    return 'Unknown';
  };

  const getBalanceUnit = () => {
    if (walletState.walletType === 'metamask') {
      if (walletState.chainId === SEPOLIA_CHAIN_ID) return 'ETH';
      return 'WND';
    } else if (walletState.walletType === 'talisman') {
      if (walletState.chainId === SEPOLIA_CHAIN_ID) return 'ETH';
      return 'WND';
    } else if (walletState.walletType === 'polkadot') {
      // Native Polkadot display
      if (walletState.chainId === 'westend' || walletState.address?.startsWith('5')) {
        return 'WND';
      }
      return 'DOT';
    }
    return '';
  };

  const getWalletName = () => {
    switch (walletState.walletType) {
      case 'metamask':
        return 'MetaMask';
      case 'talisman':
        return 'Talisman';
      case 'polkadot':
        return 'Polkadot Extension';
      default:
        return 'Unknown';
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <h3 style={{ marginBottom: '1rem', color: '#333' }}>Wallet Connection</h3>
      
      {error && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {!walletState.isConnected ? (
        <div>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Connect your wallet to submit validator reports.
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '1rem',
            maxWidth: '600px'
          }}>
            <button
              onClick={connectMetaMask}
              disabled={isConnecting}
              style={{
                background: '#f6851b',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                opacity: isConnecting ? 0.6 : 1,
                width: '100%',
                minHeight: '48px',
                transition: 'all 0.2s ease',
              }}
            >
              Connect MetaMask (EVM Westend)
            </button>
            <button
              onClick={connectSepolia}
              disabled={isConnecting}
              style={{
                background: '#29b6f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                opacity: isConnecting ? 0.6 : 1,
                width: '100%',
                minHeight: '48px',
                transition: 'all 0.2s ease',
              }}
            >
              Connect MetaMask (Sepolia)
            </button>
            <button
              onClick={connectTalisman}
              disabled={isConnecting}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                opacity: isConnecting ? 0.6 : 1,
                width: '100%',
                minHeight: '48px',
                transition: 'all 0.2s ease',
              }}
            >
              Connect Talisman (EVM Westend)
            </button>
            <button
              onClick={connectPolkadotExtension}
              disabled={isConnecting}
              style={{
                background: '#e6007a',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: isConnecting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                opacity: isConnecting ? 0.6 : 1,
                width: '100%',
                minHeight: '48px',
                transition: 'all 0.2s ease',
              }}
            >
              Connect Polkadot (Native)
            </button>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
            <p><strong>Note:</strong> MetaMask and Talisman can connect to supported EVM networks for smart contract interactions. Polkadot extension connects to native networks for validator data.</p>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: '0.5rem 0', color: '#666' }}>
              <strong>Connected:</strong> {formatAddress(walletState.address!)}
            </p>
            <p style={{ margin: '0.5rem 0', color: '#666' }}>
              <strong>Wallet:</strong> {getWalletName()}
            </p>
            <p style={{ margin: '0.5rem 0', color: '#666' }}>
              <strong>Network:</strong> {getNetworkName()}
            </p>
            {walletState.balance && (
              <p style={{ margin: '0.5rem 0', color: '#666' }}>
                <strong>Balance:</strong> {walletState.balance} {getBalanceUnit()}
              </p>
            )}
          </div>
          <button
            onClick={disconnectWallet}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}; 