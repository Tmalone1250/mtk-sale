const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenSale", function () {
  // Fixture to deploy both contracts
  async function deployTokenSaleFixture() {
    const [owner, minter, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy Token contract
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(
      "TestToken",           // name
      "TTK",                // symbol
      ethers.parseEther("1000000"), // maxSupply (1M tokens)
      minter.address,       // initialMinter
      owner.address,        // initialDefaultAdmin
      0                     // initialDelay
    );

    // Deploy TokenSale contract
    const TokenSale = await ethers.getContractFactory("TokenSale");
    const buyPrice = ethers.parseEther("0.001");  // 0.001 ETH per token
    const sellPrice = ethers.parseEther("0.0005"); // 0.0005 ETH per token
    
    const tokenSale = await TokenSale.deploy(
      await token.getAddress(),
      buyPrice,
      sellPrice
    );

    // Grant MINTER_ROLE to TokenSale contract
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.connect(owner).grantRole(MINTER_ROLE, await tokenSale.getAddress());

    return { token, tokenSale, owner, minter, user1, user2, user3, buyPrice, sellPrice };
  }

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      const { token, tokenSale } = await loadFixture(deployTokenSaleFixture);
      
      expect(await tokenSale.token()).to.equal(await token.getAddress());
    });

    it("Should set the correct buy and sell prices", async function () {
      const { tokenSale, buyPrice, sellPrice } = await loadFixture(deployTokenSaleFixture);
      
      expect(await tokenSale.buyPrice()).to.equal(buyPrice);
      expect(await tokenSale.sellPrice()).to.equal(sellPrice);
    });

    it("Should set the deployer as owner", async function () {
      const { tokenSale, owner } = await loadFixture(deployTokenSaleFixture);
      
      expect(await tokenSale.owner()).to.equal(owner.address);
    });

    it("Should have MINTER_ROLE granted to TokenSale contract", async function () {
      const { token, tokenSale } = await loadFixture(deployTokenSaleFixture);
      
      const MINTER_ROLE = await token.MINTER_ROLE();
      expect(await token.hasRole(MINTER_ROLE, await tokenSale.getAddress())).to.be.true;
    });
  });

  describe("Buying Tokens", function () {
    it("Should allow users to buy tokens with buyTokens function", async function () {
      const { tokenSale, user1, buyPrice } = await loadFixture(deployTokenSaleFixture);
      
      const ethAmount = ethers.parseEther("1"); // 1 ETH
      const expectedTokens = ethers.parseEther("1000"); // 1000 tokens in wei
      
      await expect(
        tokenSale.connect(user1).buyTokens({ value: ethAmount })
      ).to.emit(tokenSale, "BuyTokens")
        .withArgs(user1.address, expectedTokens);
    });

    it("Should allow users to buy tokens by sending ETH directly", async function () {
      const { tokenSale, user1, buyPrice } = await loadFixture(deployTokenSaleFixture);
      
      const ethAmount = ethers.parseEther("0.5"); // 0.5 ETH
      const expectedTokens = ethers.parseEther("500"); // 500 tokens in wei
      
      await expect(
        user1.sendTransaction({ to: await tokenSale.getAddress(), value: ethAmount })
      ).to.emit(tokenSale, "BuyTokens")
        .withArgs(user1.address, expectedTokens);
    });

    it("Should mint tokens to buyer when contract has no reserves", async function () {
      const { token, tokenSale, user1, buyPrice } = await loadFixture(deployTokenSaleFixture);
      
      const ethAmount = ethers.parseEther("1");
      const expectedTokens = ethers.parseEther("1000"); // 1000 tokens in wei
      
      const initialBalance = await token.balanceOf(user1.address);
      await tokenSale.connect(user1).buyTokens({ value: ethAmount });
      
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance + expectedTokens);
    });

    it("Should transfer tokens from contract reserves when available", async function () {
      const { token, tokenSale, minter, user1, user2, user3, buyPrice, sellPrice } = await loadFixture(deployTokenSaleFixture);
      
      // Step 1: Add ETH to contract by having user3 buy tokens
      const ethForContract = ethers.parseEther("2");
      await tokenSale.connect(user3).buyTokens({ value: ethForContract });
      
      // Step 2: Give user1 tokens and have them sell to create reserves
      const tokensToSell = ethers.parseEther("500");
      await token.connect(minter).transfer(user1.address, tokensToSell);
      await token.connect(user1).approve(await tokenSale.getAddress(), tokensToSell);
      
      // Make sure contract has enough ETH to buy these tokens
      const ethNeeded = (tokensToSell * sellPrice) / ethers.parseEther("1");
      const contractEthBalance = await ethers.provider.getBalance(await tokenSale.getAddress());
      expect(contractEthBalance).to.be.gte(ethNeeded);
      
      await tokenSale.connect(user1).sellTokens(tokensToSell);
      
      // Check contract has token reserves
      expect(await token.balanceOf(await tokenSale.getAddress())).to.equal(tokensToSell);
      
      // Step 3: Now user2 buys tokens - should get from reserves
      const ethAmount = ethers.parseEther("0.1");
      const expectedTokens = ethers.parseEther("100"); // 100 tokens in wei
      
      const totalSupplyBefore = await token.totalSupply();
      await tokenSale.connect(user2).buyTokens({ value: ethAmount });
      const totalSupplyAfter = await token.totalSupply();
      
      // Total supply should not increase (tokens came from reserves)
      expect(totalSupplyAfter).to.equal(totalSupplyBefore);
      expect(await token.balanceOf(user2.address)).to.equal(expectedTokens);
    });

    it("Should revert when sending zero ETH", async function () {
      const { tokenSale, user1 } = await loadFixture(deployTokenSaleFixture);
      
      await expect(
        tokenSale.connect(user1).buyTokens({ value: 0 })
      ).to.be.revertedWithCustomError(tokenSale, "ZeroAmount");
    });

    it("Should revert when ETH amount results in zero tokens", async function () {
      const { tokenSale, user1 } = await loadFixture(deployTokenSaleFixture);
      
      // Send very small amount that results in 0 tokens
      const tinyAmount = 1; // 1 wei
      
      await expect(
        tokenSale.connect(user1).buyTokens({ value: tinyAmount })
      ).to.be.revertedWithCustomError(tokenSale, "ZeroAmount");
    });

    it("Should revert when purchase would exceed max supply", async function () {
      const { token, tokenSale, minter, user1, buyPrice } = await loadFixture(deployTokenSaleFixture);
      
      const maxSupply = await token.MAX_SUPPLY();
      const currentSupply = await token.totalSupply();
      const remainingSupply = maxSupply - currentSupply;
      
      // First, mint tokens close to max supply
      const tokensToMint = remainingSupply - ethers.parseEther("100"); // Leave only 100 tokens
      await token.connect(minter).mint(user1.address, tokensToMint);
      
      // Now try to buy more than the remaining 100 tokens
      const excessEth = (ethers.parseEther("200") * buyPrice) / ethers.parseEther("1"); // Try to buy 200 tokens
      
      await expect(
        tokenSale.connect(user1).buyTokens({ value: excessEth })
      ).to.be.revertedWithCustomError(tokenSale, "MaxSupplyReached");
    });

    it("Should calculate tokens correctly based on buy price", async function () {
      const { token, tokenSale, user1, buyPrice } = await loadFixture(deployTokenSaleFixture);
      
      const ethAmount = ethers.parseEther("2.5");
      const expectedTokens = ethers.parseEther("2500"); // 2500 tokens in wei
      
      await tokenSale.connect(user1).buyTokens({ value: ethAmount });
      expect(await token.balanceOf(user1.address)).to.equal(expectedTokens);
    });
  });

  describe("Selling Tokens", function () {

    it("Should allow users to sell tokens for ETH", async function () {
      const { token, tokenSale, minter, user1, user2, sellPrice } = await loadFixture(deployTokenSaleFixture);
      
      // Setup: Give user1 tokens
      const tokensToGive = ethers.parseEther("1000");
      await token.connect(minter).transfer(user1.address, tokensToGive);
      
      // Add sufficient ETH to contract by having user2 buy tokens
      const tokensToSell = ethers.parseEther("500");
      const ethNeeded = (tokensToSell * sellPrice) / ethers.parseEther("1"); // 0.25 ETH needed
      const ethToAdd = ethNeeded * 2n; // Add double to be safe
      await tokenSale.connect(user2).buyTokens({ value: ethToAdd });
      
      await token.connect(user1).approve(await tokenSale.getAddress(), tokensToSell);
      
      await expect(
        tokenSale.connect(user1).sellTokens(tokensToSell)
      ).to.emit(tokenSale, "SellTokens")
        .withArgs(user1.address, tokensToSell);
    });

    it("Should transfer correct ETH amount to seller", async function () {
      const { token, tokenSale, minter, user1, user2, sellPrice } = await loadFixture(deployTokenSaleFixture);
      
      // Setup: Give user1 tokens
      const tokensToGive = ethers.parseEther("1000");
      await token.connect(minter).transfer(user1.address, tokensToGive);
      
      const tokensToSell = ethers.parseEther("500");
      const expectedEth = (tokensToSell * sellPrice) / ethers.parseEther("1");
      
      // Add sufficient ETH to contract
      const ethToAdd = expectedEth * 2n; // Add double to be safe
      await tokenSale.connect(user2).buyTokens({ value: ethToAdd });
      
      await token.connect(user1).approve(await tokenSale.getAddress(), tokensToSell);
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      const tx = await tokenSale.connect(user1).sellTokens(tokensToSell);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.equal(initialBalance - gasUsed + expectedEth);
    });

    it("Should transfer tokens from seller to contract", async function () {
      const { token, tokenSale, minter, user1, user2, sellPrice } = await loadFixture(deployTokenSaleFixture);
      
      // Setup: Give user1 tokens
      const tokensToGive = ethers.parseEther("1000");
      await token.connect(minter).transfer(user1.address, tokensToGive);
      
      const tokensToSell = ethers.parseEther("300");
      const ethNeeded = (tokensToSell * sellPrice) / ethers.parseEther("1");
      
      // Add sufficient ETH to contract
      await tokenSale.connect(user2).buyTokens({ value: ethNeeded * 2n });
      
      await token.connect(user1).approve(await tokenSale.getAddress(), tokensToSell);
      
      const initialContractBalance = await token.balanceOf(await tokenSale.getAddress());
      const initialUserBalance = await token.balanceOf(user1.address);
      
      await tokenSale.connect(user1).sellTokens(tokensToSell);
      
      expect(await token.balanceOf(await tokenSale.getAddress())).to.equal(initialContractBalance + tokensToSell);
      expect(await token.balanceOf(user1.address)).to.equal(initialUserBalance - tokensToSell);
    });

    it("Should revert when selling zero tokens", async function () {
      const { tokenSale, user1 } = await loadFixture(deployTokenSaleFixture);
      
      await expect(
        tokenSale.connect(user1).sellTokens(0)
      ).to.be.revertedWith("Amount must be more than zero");
    });

    it("Should revert when contract has insufficient ETH", async function () {
      const { token, tokenSale, minter, user1 } = await loadFixture(deployTokenSaleFixture);
      
      // Give user tokens but don't add ETH to contract
      const tokensToGive = ethers.parseEther("1000");
      await token.connect(minter).transfer(user1.address, tokensToGive);
      
      const tokensToSell = ethers.parseEther("500");
      await token.connect(user1).approve(await tokenSale.getAddress(), tokensToSell);
      
      await expect(
        tokenSale.connect(user1).sellTokens(tokensToSell)
      ).to.be.revertedWith("Insufficient ETH balance");
    });

    it("Should revert when user has insufficient token balance", async function () {
      const { token, tokenSale, user1, user2 } = await loadFixture(deployTokenSaleFixture);
      
      // Add ETH to contract
      await tokenSale.connect(user2).buyTokens({ value: ethers.parseEther("10") });
      
      // Try to sell more tokens than user has (user1 has 0 tokens)
      const tokensToSell = ethers.parseEther("1000");
      
      // First approve the tokens (even though user doesn't have them)
      await token.connect(user1).approve(await tokenSale.getAddress(), tokensToSell);
      
      await expect(
        tokenSale.connect(user1).sellTokens(tokensToSell)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });

  describe("Withdrawal Functions", function () {

    it("Should allow owner to withdraw ETH", async function () {
      const { tokenSale, owner } = await loadFixture(deployTokenSaleFixture);
      
      // Add ETH to contract
      await tokenSale.connect(owner).buyTokens({ value: ethers.parseEther("1") });
      
      const contractBalance = await ethers.provider.getBalance(await tokenSale.getAddress());
      expect(contractBalance).to.be.gt(0);
      
      await expect(
        tokenSale.connect(owner).withdrawEth()
      ).to.emit(tokenSale, "WithdrawEth")
        .withArgs(owner.address, contractBalance);
    });

    it("Should transfer all ETH to owner on withdrawal", async function () {
      const { tokenSale, owner, user1 } = await loadFixture(deployTokenSaleFixture);
      
      // Add ETH to contract
      await tokenSale.connect(user1).buyTokens({ value: ethers.parseEther("1") });
      
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await tokenSale.getAddress());
      
      const tx = await tokenSale.connect(owner).withdrawEth();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - gasUsed + contractBalance);
      
      // Contract should have 0 ETH
      expect(await ethers.provider.getBalance(await tokenSale.getAddress())).to.equal(0);
    });

    it("Should allow owner to withdraw tokens", async function () {
      const { token, tokenSale, owner, minter, user1, user2, sellPrice } = await loadFixture(deployTokenSaleFixture);
      
      // Setup: Add tokens to contract by selling
      const tokensToGive = ethers.parseEther("500");
      await token.connect(minter).transfer(user1.address, tokensToGive);
      
      // Add ETH to contract first
      const ethNeeded = (tokensToGive * sellPrice) / ethers.parseEther("1");
      await tokenSale.connect(user2).buyTokens({ value: ethNeeded * 2n });
      
      // Now sell tokens to add them to contract
      await token.connect(user1).approve(await tokenSale.getAddress(), tokensToGive);
      await tokenSale.connect(user1).sellTokens(tokensToGive);
      
      const withdrawAmount = ethers.parseEther("200");
      
      await expect(
        tokenSale.connect(owner).withdrawTokens(withdrawAmount)
      ).to.emit(tokenSale, "WithdrawTokens")
        .withArgs(owner.address, withdrawAmount);
    });

    it("Should transfer correct token amount to owner", async function () {
      const { token, tokenSale, owner, minter, user1, user2, sellPrice } = await loadFixture(deployTokenSaleFixture);
      
      // Setup: Add tokens to contract
      const tokensToGive = ethers.parseEther("500");
      await token.connect(minter).transfer(user1.address, tokensToGive);
      
      // Add ETH to contract first
      const ethNeeded = (tokensToGive * sellPrice) / ethers.parseEther("1");
      await tokenSale.connect(user2).buyTokens({ value: ethNeeded * 2n });
      
      // Sell tokens to add them to contract
      await token.connect(user1).approve(await tokenSale.getAddress(), tokensToGive);
      await tokenSale.connect(user1).sellTokens(tokensToGive);
      
      const withdrawAmount = ethers.parseEther("200");
      const initialOwnerBalance = await token.balanceOf(owner.address);
      const initialContractBalance = await token.balanceOf(await tokenSale.getAddress());
      
      await tokenSale.connect(owner).withdrawTokens(withdrawAmount);
      
      expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance + withdrawAmount);
      expect(await token.balanceOf(await tokenSale.getAddress())).to.equal(initialContractBalance - withdrawAmount);
    });

    it("Should revert when non-owner tries to withdraw ETH", async function () {
      const { tokenSale, user1 } = await loadFixture(deployTokenSaleFixture);
      
      await expect(
        tokenSale.connect(user1).withdrawEth()
      ).to.be.revertedWithCustomError(tokenSale, "OwnableUnauthorizedAccount");
    });

    it("Should revert when non-owner tries to withdraw tokens", async function () {
      const { tokenSale, user1 } = await loadFixture(deployTokenSaleFixture);
      
      await expect(
        tokenSale.connect(user1).withdrawTokens(ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(tokenSale, "OwnableUnauthorizedAccount");
    });

    it("Should revert when withdrawing ETH with zero balance", async function () {
      const { tokenSale, owner } = await loadFixture(deployTokenSaleFixture);
      
      await expect(
        tokenSale.connect(owner).withdrawEth()
      ).to.be.revertedWith("No ETH to withdraw");
    });

    it("Should revert when withdrawing zero tokens", async function () {
      const { tokenSale, owner } = await loadFixture(deployTokenSaleFixture);
      
      await expect(
        tokenSale.connect(owner).withdrawTokens(0)
      ).to.be.revertedWith("Amount must be more than zero");
    });

    it("Should revert when withdrawing more tokens than available", async function () {
      const { tokenSale, owner } = await loadFixture(deployTokenSaleFixture);
      
      const excessAmount = ethers.parseEther("1000000");
      
      await expect(
        tokenSale.connect(owner).withdrawTokens(excessAmount)
      ).to.be.revertedWith("Insufficient tokens");
    });
  });

  describe("Fallback Function", function () {
    it("Should revert on direct calls to fallback", async function () {
      const { tokenSale, user1 } = await loadFixture(deployTokenSaleFixture);
      
      await expect(
        user1.sendTransaction({ 
          to: await tokenSale.getAddress(), 
          data: "0x1234" // Some random data
        })
      ).to.be.revertedWith("Direct calls not allowed");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple users buying and selling", async function () {
      const { token, tokenSale, minter, user1, user2, user3, buyPrice, sellPrice } = await loadFixture(deployTokenSaleFixture);
      
      // Multiple users buy tokens (this adds ETH to contract)
      await tokenSale.connect(user1).buyTokens({ value: ethers.parseEther("1") });
      await tokenSale.connect(user2).buyTokens({ value: ethers.parseEther("0.5") });
      await tokenSale.connect(user3).buyTokens({ value: ethers.parseEther("2") });
      
      // Give users additional tokens for selling
      await token.connect(minter).transfer(user1.address, ethers.parseEther("500"));
      await token.connect(minter).transfer(user2.address, ethers.parseEther("300"));
      
      // Calculate if contract has enough ETH for selling
      const totalTokensToSell = ethers.parseEther("800"); // 500 + 300
      const ethNeededForSelling = (totalTokensToSell * sellPrice) / ethers.parseEther("1");
      const contractEthBalance = await ethers.provider.getBalance(await tokenSale.getAddress());
      
      // Only sell if contract has enough ETH
      if (contractEthBalance >= ethNeededForSelling) {
        // Users sell tokens
        await token.connect(user1).approve(await tokenSale.getAddress(), ethers.parseEther("500"));
        await tokenSale.connect(user1).sellTokens(ethers.parseEther("500"));
        
        await token.connect(user2).approve(await tokenSale.getAddress(), ethers.parseEther("300"));
        await tokenSale.connect(user2).sellTokens(ethers.parseEther("300"));
        
        // Verify contract has accumulated tokens
        expect(await token.balanceOf(await tokenSale.getAddress())).to.equal(ethers.parseEther("800"));
      }
      
      // Verify contract has ETH from purchases
      expect(await ethers.provider.getBalance(await tokenSale.getAddress())).to.be.gt(0);
    });

    it("Should maintain correct accounting across multiple transactions", async function () {
      const { token, tokenSale, user1, buyPrice } = await loadFixture(deployTokenSaleFixture);
      
      // Buy tokens multiple times
      const ethAmount1 = ethers.parseEther("0.5");
      const ethAmount2 = ethers.parseEther("1.5");
      const ethAmount3 = ethers.parseEther("0.3");
      
      await tokenSale.connect(user1).buyTokens({ value: ethAmount1 });
      await tokenSale.connect(user1).buyTokens({ value: ethAmount2 });
      await tokenSale.connect(user1).buyTokens({ value: ethAmount3 });
      
      const totalEth = ethAmount1 + ethAmount2 + ethAmount3;
      const expectedTokens = ethers.parseEther("2300"); // 2300 tokens in wei
      
      expect(await token.balanceOf(user1.address)).to.equal(expectedTokens);
    });
  });
});