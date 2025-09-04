// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Your ERC20 token interface with mint and max supply
interface IToken is IERC20 {
    function mint(address to, uint amount) external;

    function MAX_SUPPLY() external view returns (uint256);
}

contract TokenSale is Ownable2Step, ReentrancyGuard {
    // State variables
    IToken public immutable token;
    uint256 public immutable buyPrice;
    uint256 public immutable sellPrice;

    // Custom errors
    error MaxSupplyReached();
    error ZeroAmount();

    // Events
    event BuyTokens(address indexed buyer, uint256 tokensBought);
    event SellTokens(address indexed seller, uint256 tokensSold);
    event WithdrawEth(address indexed withdrawer, uint256 amount);
    event WithdrawTokens(address indexed withdrawer, uint256 amount);

    // Constructor
    constructor(
        address _tokenAddress,
        uint256 _buyPrice,
        uint256 _sellPrice
    ) Ownable(msg.sender) {
        token = IToken(_tokenAddress);
        buyPrice = _buyPrice;
        sellPrice = _sellPrice;
    }

    // Receive Ether to buy tokens
    receive() external payable {
        buyTokens();
    }

    // Fallback
    fallback() external payable {
        revert("Direct calls not allowed");
    }

    // Token purchase logic
    function buyTokens() public payable {
        if (msg.value == 0) revert ZeroAmount();

        uint256 tokensToBuy = (msg.value / buyPrice) * 1e18;
        if (tokensToBuy == 0) revert ZeroAmount();

        require(tokensToBuy > 0, "Amount must be more than zero");

        if (token.balanceOf(address(this)) >= tokensToBuy) {
            token.transfer(msg.sender, tokensToBuy);
        } else {
            // Only check max supply when minting new tokens
            if (token.totalSupply() + tokensToBuy > token.MAX_SUPPLY()) {
                revert MaxSupplyReached();
            }
            token.mint(msg.sender, tokensToBuy);
        }

        emit BuyTokens(msg.sender, tokensToBuy);
    }

    // Sell tokens for ETH
    function sellTokens(uint256 _amount) public nonReentrant {
        uint256 ethToReceive = (_amount * sellPrice) / 1e18;

        require(
            address(this).balance >= ethToReceive,
            "Insufficient ETH balance"
        );
        require(_amount > 0, "Amount must be more than zero");

        token.transferFrom(msg.sender, address(this), _amount);
        payable(msg.sender).transfer(ethToReceive);

        emit SellTokens(msg.sender, _amount);
    }

    // Withdraw ETH (only owner)
    function withdrawEth() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        payable(owner()).transfer(balance);
        emit WithdrawEth(owner(), balance);
    }

    // Withdraw tokens (only owner)
    function withdrawTokens(uint256 _amount) public onlyOwner {
        require(_amount > 0, "Amount must be more than zero");
        require(
            token.balanceOf(address(this)) >= _amount,
            "Insufficient tokens"
        );

        token.transfer(owner(), _amount);
        emit WithdrawTokens(owner(), _amount);
    }
}
