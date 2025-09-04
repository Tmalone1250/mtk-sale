require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/gQxcr8ewPoZ5AXCyIjr2T",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 11155111,
      timeout: 120000, // 2 minutes
      gasPrice: "auto",
      gas: "auto"
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  }
};
