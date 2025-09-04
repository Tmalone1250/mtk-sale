export const TokenSaleABI = [
  "function token() view returns (address)",
  "function buyPrice() view returns (uint256)",
  "function sellPrice() view returns (uint256)",
  "function owner() view returns (address)",
  "function buyTokens() payable",
  "function sellTokens(uint256 amount)",
  "function withdrawEth()",
  "function withdrawTokens(uint256 amount)",
  "event BuyTokens(address indexed buyer, uint256 tokensBought)",
  "event SellTokens(address indexed seller, uint256 tokensSold)",
  "event WithdrawEth(address indexed withdrawer, uint256 amount)",
  "event WithdrawTokens(address indexed withdrawer, uint256 amount)"
] as const;