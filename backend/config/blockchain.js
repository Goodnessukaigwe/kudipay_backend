require('dotenv').config();
const { ethers } = require('ethers');

const blockchainConfig = {
  network: {
    name: process.env.NETWORK_NAME || 'base-sepolia',
    rpcUrl: process.env.RPC_URL || 'https://base-sepolia.g.alchemy.com/v2/NFfaf0wMgQUTdsCIvsStq',
    chainId: process.env.CHAIN_ID || 84532,
  },
  
  contracts: {
    walletFactory: {
      address: process.env.WALLET_FACTORY_ADDRESS,
      abi: [] // Will be populated with actual ABI
    },
    phoneWalletMapping: {
      address: process.env.PHONE_WALLET_MAPPING_ADDRESS || '0x6ccDf26970eD11585D089F9112318D9d13745722',
      abi: [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"EnforcedPause","type":"error"},{"inputs":[],"name":"ExpectedPause","type":"error"},{"inputs":[],"name":"InvalidPhoneNumber","type":"error"},{"inputs":[],"name":"InvalidWalletAddress","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"PhoneNumberAlreadyRegistered","type":"error"},{"inputs":[],"name":"PhoneNumberNotRegistered","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[],"name":"UnauthorizedAccess","type":"error"},{"inputs":[],"name":"WalletAlreadyRegistered","type":"error"},{"inputs":[],"name":"WalletNotRegistered","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"phoneNumber","type":"string"},{"indexed":true,"internalType":"address","name":"walletAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"PhoneNumberMapped","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"oldPhoneNumber","type":"string"},{"indexed":true,"internalType":"string","name":"newPhoneNumber","type":"string"},{"indexed":true,"internalType":"address","name":"walletAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"PhoneNumberUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"phoneNumber","type":"string"},{"indexed":true,"internalType":"address","name":"oldWallet","type":"address"},{"indexed":true,"internalType":"address","name":"newWallet","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"WalletUpdated","type":"event"},{"inputs":[{"internalType":"string","name":"phoneNumber","type":"string"},{"internalType":"address","name":"walletAddress","type":"address"}],"name":"adminUpdateMapping","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"walletAddress","type":"address"}],"name":"getPhoneForWallet","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"phoneNumber","type":"string"}],"name":"getWalletForPhone","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"phoneNumber","type":"string"}],"name":"isPhoneNumberRegistered","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"","type":"string"}],"name":"isPhoneRegistered","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"phoneNumber","type":"string"}],"name":"isValidNigerianPhoneNumber","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"walletAddress","type":"address"}],"name":"isWalletAddressRegistered","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"isWalletRegistered","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"phoneNumber","type":"string"},{"internalType":"address","name":"walletAddress","type":"address"}],"name":"mapPhoneToWallet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"","type":"string"}],"name":"phoneToWallet","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"totalRegisteredUsers","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"oldPhoneNumber","type":"string"},{"internalType":"string","name":"newPhoneNumber","type":"string"}],"name":"updatePhoneForWallet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"phoneNumber","type":"string"},{"internalType":"address","name":"newWalletAddress","type":"address"}],"name":"updateWalletForPhone","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"walletToPhone","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]
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
  return null; // Return null instead of throwing, wallet is optional for read-only operations
};

module.exports = {
  blockchainConfig,
  provider,
  getWallet
};
