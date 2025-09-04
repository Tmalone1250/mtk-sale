const hre = require("hardhat");

async function main() {
  // Contract addresses from deployment
  const tokenAddress = "0x4B5C2436289EdDd6Dc621462Ed16a2FC216E0Cf3";
  const tokenSaleAddress = "0x0d1dac61b846bCF7010FEEcDBD6eae5a37E8a0be";

  console.log("🔍 Starting contract verification...\n");

  try {
    // Verify Token contract
    console.log("=== Verifying Token Contract ===");
    console.log(`Token Address: ${tokenAddress}`);
    
    await hre.run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [
        "MyToken",                           // name
        "MTK",                              // symbol
        hre.ethers.parseEther("1000000"),   // maxSupply (1M tokens)
        "0xd83B5031506039893BF1C827b0A79aDDee71E1fE", // initialMinter (deployer)
        "0xd83B5031506039893BF1C827b0A79aDDee71E1fE", // initialDefaultAdmin (deployer)
        0                                   // initialDelay
      ],
    });
    
    console.log("✅ Token contract verified successfully!\n");

    // Verify TokenSale contract
    console.log("=== Verifying TokenSale Contract ===");
    console.log(`TokenSale Address: ${tokenSaleAddress}`);
    
    // Constructor arguments for TokenSale
    const buyPrice = hre.ethers.parseEther("0.001");  // 0.001 ETH
    const sellPrice = hre.ethers.parseEther("0.0005"); // 0.0005 ETH
    
    await hre.run("verify:verify", {
      address: tokenSaleAddress,
      constructorArguments: [tokenAddress, buyPrice, sellPrice],
    });
    
    console.log("✅ TokenSale contract verified successfully!\n");

    console.log("🎉 All contracts verified successfully!");
    console.log("\n📋 Verification Summary:");
    console.log(`Token: https://sepolia.etherscan.io/address/${tokenAddress}`);
    console.log(`TokenSale: https://sepolia.etherscan.io/address/${tokenSaleAddress}`);

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contracts may already be verified. Check Etherscan links above.");
    } else if (error.message.includes("Invalid API Key")) {
      console.log("⚠️  Please check your ETHERSCAN_KEY in .env file");
    } else {
      console.log("💡 Try verifying manually on Etherscan if this continues to fail");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });