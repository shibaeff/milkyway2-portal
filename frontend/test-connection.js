const { ApiPromise, WsProvider } = require('@polkadot/api');

// Network endpoints from the configuration
const networks = {
  polkadot: {
    'Automata 1RPC': 'wss://1rpc.io/dot',
    Dwellir: 'wss://polkadot-rpc.dwellir.com',
    'IBP-GeoDNS1': 'wss://rpc.ibp.network/polkadot',
    'IBP-GeoDNS2': 'wss://rpc.dotters.network/polkadot',
    LuckyFriday: 'wss://rpc-polkadot.luckyfriday.io',
    OnFinality: 'wss://polkadot.api.onfinality.io/public-ws',
    Stakeworld: 'wss://dot-rpc.stakeworld.io',
    Parity: 'wss://rpc.polkadot.io',
  },
  kusama: {
    'Automata 1RPC': 'wss://1rpc.io/ksm',
    Dwellir: 'wss://kusama-rpc.dwellir.com',
    'IBP-GeoDNS1': 'wss://rpc.ibp.network/kusama',
    'IBP-GeoDNS2': 'wss://rpc.dotters.network/kusama',
    LuckyFriday: 'wss://rpc-kusama.luckyfriday.io',
    OnFinality: 'wss://kusama.api.onfinality.io/public-ws',
    Stakeworld: 'wss://ksm-rpc.stakeworld.io',
  },
  // westend removed from static messaging context
};

async function testNetworkConnection(networkName, endpointName, endpoint) {
  console.log(`\n🔗 Testing ${networkName} via ${endpointName} (${endpoint})`);
  
  try {
    const wsProvider = new WsProvider(endpoint);
    const api = await ApiPromise.create({ provider: wsProvider });
    
    await api.isReady;
    console.log(`✅ Connected to ${networkName}`);
    
    // Get basic network info
    const [validators, currentEra] = await Promise.all([
      api.query.staking.validators.entries(),
      api.query.staking.currentEra(),
    ]);
    
    const validatorCount = validators.length;
    console.log(`📊 Total validators: ${validatorCount.toLocaleString()}`);
    console.log(`🏛️  Current era: ${currentEra.toString()}`);
    
    // Calculate average commission
    let totalCommission = 0;
    let validCommissions = 0;
    
    for (const [, validatorInfo] of validators.slice(0, 10)) { // Only check first 10 for speed
      try {
        if (validatorInfo && validatorInfo.commission) {
          const commission = validatorInfo.commission.toNumber() / 10000000;
          totalCommission += commission;
          validCommissions++;
        }
      } catch (err) {
        // Skip invalid commissions
      }
    }
    
    const avgCommission = validCommissions > 0 ? totalCommission / validCommissions : 0;
    console.log(`💰 Average commission (sample): ${avgCommission.toFixed(2)}%`);
    
    await api.disconnect();
    return { success: true, validatorCount, avgCommission };
    
  } catch (error) {
    console.log(`❌ Failed to connect: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAllNetworks() {
  console.log('🚀 Testing all network endpoints...\n');
  
  for (const [networkName, endpoints] of Object.entries(networks)) {
    console.log(`\n📡 Testing ${networkName.toUpperCase()} network:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const results = [];
    
    for (const [endpointName, endpoint] of Object.entries(endpoints)) {
      const result = await testNetworkConnection(networkName, endpointName, endpoint);
      results.push({ endpointName, ...result });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary for this network
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n📊 ${networkName.toUpperCase()} Summary:`);
    console.log(`✅ Successful connections: ${successful.length}`);
    console.log(`❌ Failed connections: ${failed.length}`);
    
    if (successful.length > 0) {
      const avgValidators = successful.reduce((sum, r) => sum + r.validatorCount, 0) / successful.length;
      const avgCommission = successful.reduce((sum, r) => sum + r.avgCommission, 0) / successful.length;
      console.log(`📊 Average validators: ${Math.round(avgValidators).toLocaleString()}`);
      console.log(`💰 Average commission: ${avgCommission.toFixed(2)}%`);
    }
  }
  
  console.log('\n🎉 Network testing completed!');
}

// Test a specific network (default to polkadot)
const networkToTest = process.argv[2] || 'polkadot';
const endpointToTest = process.argv[3] || 'Parity';

if (networkToTest && networks[networkToTest] && networks[networkToTest][endpointToTest]) {
  console.log(`🧪 Testing specific endpoint: ${networkToTest} via ${endpointToTest}`);
  testNetworkConnection(networkToTest, endpointToTest, networks[networkToTest][endpointToTest]);
} else {
  testAllNetworks();
} 