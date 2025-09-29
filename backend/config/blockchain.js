const { ethers } = require('ethers');

const blockchainConfig = {
  network: {
    name: process.env.NETWORK_NAME || 'base-sepolia',
    rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
    chainId: process.env.CHAIN_ID || 84532,
  },
  
  contracts: {
    walletFactory: {
      address: process.env.WALLET_FACTORY_ADDRESS,
      abi: [] // Will be populated with actual ABI
    },
    phoneWalletMapping: {
      address: process.env.PHONE_WALLET_MAPPING_ADDRESS,
      abi: [] // Will be populated with actual ABI
    }
  },
  
  wallet: {
    privateKey: process.env.DEPLOYER_PRIVATE_KEY,
    mnemonic: process.env.MNEMONIC,
  },
  
  gasSettings: {
    gasLimit: process.env.GAS_LIMIT || 500000,
    gasPrice: process.env.GAS_PRICE || '20000000000', // 20 gwei
  }
};

// Create provider
const provider = new ethers.JsonRpcProvider(blockchainConfig.network.rpcUrl);

// Create wallet for contract interactions
const getWallet = () => {
  if (blockchainConfig.wallet.privateKey) {
    return new ethers.Wallet(blockchainConfig.wallet.privateKey, provider);
  }
  throw new Error('No wallet configuration found');
};

module.exports = {
  blockchainConfig,
  provider,
  getWallet
};
