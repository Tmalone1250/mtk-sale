const { ethers } = require("hardhat");

async function main() {
  try {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    // Check if we have enough balance (need at least 0.01 ETH for deployment)
    if (balance < ethers.parseEther("0.01")) {
      throw new Error("Insufficient balance for deployment. Need at least 0.01 ETH.");
    }

    console.log("Getting network info...");
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
    
    console.log("Getting gas price...");
    const gasPrice = await ethers.provider.getFeeData();
    console.log("Gas price:", ethers.formatUnits(gasPrice.gasPrice || 0n, "gwei"), "gwei");

    // Deploy Token contract
    console.log("\n=== Deploying Token Contract ===");
    const Token = await ethers.getContractFactory("Token");
    
    console.log("Estimating gas for Token deployment...");
    const tokenDeployTx = await Token.getDeployTransaction(
      "MyToken",                    // name
      "MTK",                       // symbol
      ethers.parseEther("1000000"), // maxSupply (1M tokens)
      deployer.address,            // initialMinter
      deployer.address,            // initialDefaultAdmin
      0                            // initialDelay
    );
    
    const estimatedGas = await ethers.provider.estimateGas(tokenDeployTx);
    console.log("Estimated gas for Token:", estimatedGas.toString());
    
    console.log("Deploying Token contract...");
    const token = await Token.deploy(
      "MyToken",                    // name
      "MTK",                       // symbol
      ethers.parseEther("1000000"), // maxSupply (1M tokens)
      deployer.address,            // initialMinter
      deployer.address,            // initialDefaultAdmin
      0,                           // initialDelay
      {
        gasLimit: estimatedGas * 120n / 100n // Add 20% buffer
      }
    );

    console.log("Waiting for Token deployment confirmation...");
    await token.waitForDeployment();
    console.log("✅ Token deployed to:", await token.getAddress());

    // Deploy TokenSale contract
    console.log("\n=== Deploying TokenSale Contract ===");
    const TokenSale = await ethers.getContractFactory("TokenSale");
    const buyPrice = ethers.parseEther("0.001");   // 0.001 ETH per token
    const sellPrice = ethers.parseEther("0.0005"); // 0.0005 ETH per token
    
    console.log("Estimating gas for TokenSale deployment...");
    const tokenSaleDeployTx = await TokenSale.getDeployTransaction(
      await token.getAddress(),
      buyPrice,
      sellPrice
    );
    
    const estimatedGasTokenSale = await ethers.provider.estimateGas(tokenSaleDeployTx);
    console.log("Estimated gas for TokenSale:", estimatedGasTokenSale.toString());
    
    console.log("Deploying TokenSale contract...");
    const tokenSale = await TokenSale.deploy(
      await token.getAddress(),
      buyPrice,
      sellPrice,
      {
        gasLimit: estimatedGasTokenSale * 120n / 100n // Add 20% buffer
      }
    );

    console.log("Waiting for TokenSale deployment confirmation...");
    await tokenSale.waitForDeployment();
    console.log("✅ TokenSale deployed to:", await tokenSale.getAddress());

    // Grant MINTER_ROLE to TokenSale contract
    console.log("\n=== Setting up Permissions ===");
    const MINTER_ROLE = await token.MINTER_ROLE();
    console.log("Granting MINTER_ROLE to TokenSale contract...");
    
    const tx = await token.grantRole(MINTER_ROLE, await tokenSale.getAddress(), {
      gasLimit: 100000n // Explicit gas limit for role grant
    });
    
    console.log("Waiting for role grant confirmation...");
    await tx.wait();
    console.log("✅ MINTER_ROLE granted to TokenSale contract");

    // Verify deployment
    console.log("\n=== Deployment Summary ===");
    console.log("Token Name:", await token.name());
    console.log("Token Symbol:", await token.symbol());
    console.log("Max Supply:", ethers.formatEther(await token.MAX_SUPPLY()));
    console.log("Buy Price:", ethers.formatEther(await tokenSale.buyPrice()), "ETH per token");
    console.log("Sell Price:", ethers.formatEther(await tokenSale.sellPrice()), "ETH per token");
    console.log("TokenSale has MINTER_ROLE:", await token.hasRole(MINTER_ROLE, await tokenSale.getAddress()));
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log("Token Address:", await token.getAddress());
    console.log("TokenSale Address:", await tokenSale.getAddress());
    
  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.code) {
      console.error("Error code:", error.code);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });