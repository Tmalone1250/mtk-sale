# Test Suite Documentation

This directory contains comprehensive tests for the ERC20 Token and TokenSale contracts.

## Test Files

### 1. ERC20Token.test.js
Tests for the ERC20 Token contract covering:
- **Deployment**: Correct initialization of name, symbol, max supply, roles
- **Minting**: Role-based minting, supply cap enforcement, zero address protection
- **Supply Cap**: Max supply enforcement during minting and transfers
- **Pausable**: Pause/unpause functionality and transfer restrictions
- **Access Control**: Role management (MINTER_ROLE, PAUSER_ROLE, DEFAULT_ADMIN_ROLE)
- **ERC20 Standard**: Standard token functions (transfer, approve, allowance)

### 2. TokenSale.test.js
Tests for the TokenSale contract covering:
- **Deployment**: Correct initialization of token address, prices, ownership
- **Buying Tokens**: ETH to token conversion, direct ETH transfers, reserve management
- **Selling Tokens**: Token to ETH conversion, proper transfers, balance checks
- **Withdrawal Functions**: Owner-only ETH and token withdrawals
- **Access Control**: Owner-only function restrictions
- **Edge Cases**: Zero amounts, insufficient balances, max supply limits

### 3. Integration.test.js
Integration tests covering:
- **Complete Lifecycle**: Full buy-sell-withdraw cycles
- **Reserve System**: Token reserve management and reuse
- **Access Control Integration**: Cross-contract permission testing
- **Economic Model**: Price differential validation and profit mechanisms
- **Stress Testing**: Multiple users and high-volume transactions

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Individual Test Suites
```bash
# ERC20 Token tests only
npm run test:token

# TokenSale tests only
npm run test:sale

# Integration tests only
npm run test:integration
```

### Run with Coverage
```bash
npm run test:coverage
```

## Test Coverage

The test suite aims for comprehensive coverage including:

### ERC20Token Contract
- ✅ All public functions
- ✅ Access control modifiers
- ✅ Custom errors
- ✅ Supply cap enforcement
- ✅ Pausable functionality
- ✅ Role management

### TokenSale Contract
- ✅ All public functions
- ✅ Owner-only functions
- ✅ ETH handling (receive/fallback)
- ✅ Token reserve logic
- ✅ Price calculations
- ✅ Event emissions

### Integration Scenarios
- ✅ Cross-contract interactions
- ✅ Role-based permissions
- ✅ Economic model validation
- ✅ Multi-user scenarios
- ✅ Edge cases and error conditions

## Key Test Scenarios

### Security Tests
- Access control enforcement
- Zero address protection
- Overflow/underflow protection
- Reentrancy protection (where applicable)
- Pausable functionality

### Business Logic Tests
- Correct price calculations
- Reserve management
- Supply cap enforcement
- Profit mechanism validation

### Edge Cases
- Zero amounts
- Maximum values
- Insufficient balances
- Contract state transitions

## Test Data

### Default Test Parameters
- **Token Name**: "TestToken"
- **Token Symbol**: "TTK"
- **Max Supply**: 1,000,000 tokens
- **Buy Price**: 0.001 ETH per token
- **Sell Price**: 0.0005 ETH per token
- **Initial Mint**: 10,000 tokens to minter

### Test Accounts
- `owner`: Contract deployer and admin
- `minter`: Initial minter with MINTER_ROLE and PAUSER_ROLE
- `user1`, `user2`, `user3`: Regular users for testing

## Expected Test Results

All tests should pass with:
- ✅ 100+ test cases
- ✅ Full function coverage
- ✅ All edge cases covered
- ✅ Security scenarios validated
- ✅ Integration scenarios working

## Troubleshooting

### Common Issues
1. **Gas Limit Errors**: Increase gas limit in hardhat config
2. **Timing Issues**: Use proper async/await patterns
3. **Balance Calculations**: Account for gas costs in ETH balance checks
4. **Role Permissions**: Ensure proper role setup in fixtures

### Debug Tips
- Use `console.log()` for debugging values
- Check contract addresses with `await contract.getAddress()`
- Verify role assignments before testing restricted functions
- Use `ethers.formatEther()` for readable ETH amounts