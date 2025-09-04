# MyToken (MTK) - Token Sale dApp

A decentralized application (dApp) for buying and selling MTK tokens on the Sepolia testnet. This project includes smart contracts, comprehensive tests, and a React frontend interface.

## 🚀 Features

### Smart Contracts
- **ERC20 Token Contract**: Custom token with access control, pausable functionality, and minting capabilities
- **TokenSale Contract**: Handles buying and selling of tokens with configurable prices
- **Security Features**: ReentrancyGuard, AccessControl, and comprehensive error handling

### Frontend dApp
- **Wallet Integration**: Connect with MetaMask
- **Real-time Data**: Live token balances, prices, and contract information
- **Token Trading**: Buy and sell MTK tokens directly from the interface
- **Responsive Design**: Built with React, TypeScript, and Tailwind CSS

## 📋 Contract Details

### Token Contract (MTK)
- **Address**: `0x4B5C2436289EdDd6Dc621462Ed16a2FC216E0Cf3`
- **Name**: MyToken
- **Symbol**: MTK
- **Max Supply**: 1,000,000 MTK
- **Features**: Mintable, Pausable, Access Controlled

### TokenSale Contract
- **Address**: `0x0d1dac61b846bCF7010FEEcDBD6eae5a37E8a0be`
- **Buy Price**: 0.001 ETH per MTK
- **Sell Price**: 0.0005 ETH per MTK
- **Features**: Automatic minting, ETH/Token exchange

## 🛠 Technology Stack

### Smart Contracts
- **Solidity**: ^0.8.20
- **Hardhat**: Development environment
- **OpenZeppelin**: Security and standard implementations
- **Ethers.js**: Blockchain interaction

### Frontend
- **React**: ^19.1.1
- **TypeScript**: Type safety
- **Vite**: Fast build tool
- **Tailwind CSS**: Styling
- **Ethers.js**: Web3 integration

### Testing
- **Hardhat**: Smart contract testing
- **Chai**: Assertion library
- **Comprehensive test coverage**: Unit and integration tests

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MetaMask browser extension
- Sepolia testnet ETH

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assignment_5
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with:
   ```env
   ETHERSCAN_KEY=your_etherscan_api_key
   DEPLOYER_PRIVATE_KEY=your_private_key
   SEPOLIA_RPC_URL=your_sepolia_rpc_url
   TOKEN_CONTRACT_ADDRESS=0x4B5C2436289EdDd6Dc621462Ed16a2FC216E0Cf3
   TOKEN_SALE_CONTRACT_ADDRESS=0x0d1dac61b846bCF7010FEEcDBD6eae5a37E8a0be
   ```

### Running the dApp

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:5173`

3. **Connect MetaMask**
   - Ensure you're on Sepolia testnet
   - Connect your wallet
   - Get Sepolia ETH from faucets if needed

## 🧪 Testing

### Run Smart Contract Tests
```bash
# Run all tests
npx hardhat test

# Run specific test files
npx hardhat test test/ERC20Token.test.js
npx hardhat test test/TokenSale.test.js
npx hardhat test test/Integration.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### Test Coverage
- **Token Contract**: Comprehensive testing of minting, transfers, access control, and pausable functionality
- **TokenSale Contract**: Testing of buy/sell operations, price calculations, and owner functions
- **Integration Tests**: End-to-end testing of contract interactions

## 📦 Deployment

### Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Verify Contracts
```bash
npx hardhat run scripts/verify.js --network sepolia
```

## 🔗 Live Contracts

### Sepolia Testnet
- **Token Contract**: [0x4B5C2436289EdDd6Dc621462Ed16a2FC216E0Cf3](https://sepolia.etherscan.io/address/0x4B5C2436289EdDd6Dc621462Ed16a2FC216E0Cf3)
- **TokenSale Contract**: [0x0d1dac61b846bCF7010FEEcDBD6eae5a37E8a0be](https://sepolia.etherscan.io/address/0x0d1dac61b846bCF7010FEEcDBD6eae5a37E8a0be)

## 💡 How to Use the dApp

### Buying Tokens
1. Connect your MetaMask wallet
2. Ensure you have Sepolia ETH
3. Enter the amount of MTK tokens you want to buy
4. Click "Buy Tokens" and confirm the transaction
5. Tokens will be minted directly to your wallet

### Selling Tokens
1. Ensure you have MTK tokens in your wallet
2. Enter the amount you want to sell
3. Click "Sell Tokens" 
4. Approve the token spending (first transaction)
5. Confirm the sell transaction
6. Receive ETH in your wallet

## 🔒 Security Features

### Smart Contract Security
- **ReentrancyGuard**: Prevents reentrancy attacks
- **AccessControl**: Role-based permissions
- **Pausable**: Emergency stop functionality
- **Input Validation**: Comprehensive checks and custom errors
- **Max Supply Control**: Prevents unlimited minting

### Frontend Security
- **Type Safety**: TypeScript for compile-time error checking
- **Input Validation**: User input sanitization
- **Error Handling**: Comprehensive error messages
- **Network Validation**: Ensures correct network connection

## 📁 Project Structure

```
├── contracts/              # Smart contracts
│   ├── ERC20Token.sol     # Main token contract
│   └── TokenSale.sol      # Token sale contract
├── scripts/               # Deployment scripts
│   ├── deploy.js          # Contract deployment
│   └── verify.js          # Contract verification
├── test/                  # Test files
│   ├── ERC20Token.test.js # Token contract tests
│   ├── TokenSale.test.js  # TokenSale contract tests
│   └── Integration.test.js # Integration tests
├── src/                   # Frontend source
│   ├── abis/              # Contract ABIs
│   ├── App.tsx            # Main React component
│   └── contract_address.ts # Contract addresses
├── hardhat.config.js      # Hardhat configuration
└── package.json           # Dependencies
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**MetaMask Connection Issues**
- Ensure MetaMask is installed and unlocked
- Switch to Sepolia testnet
- Refresh the page and try reconnecting

**Transaction Failures**
- Check you have sufficient Sepolia ETH for gas
- Ensure you're on the correct network
- Try increasing gas limit in MetaMask

**Token Balance Not Updating**
- Wait for transaction confirmation
- Refresh the page
- Check transaction on Etherscan

### Getting Sepolia ETH
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [QuickNode Sepolia Faucet](https://faucet.quicknode.com/ethereum/sepolia)

## 📞 Support

For questions or issues, please:
1. Check the troubleshooting section
2. Review the test files for usage examples
3. Check contract verification on Etherscan
4. Open an issue in the repository

---

**Built with ❤️ for Web3 Development**