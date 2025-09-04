📑 Assignments M5
Implement a complete ERC20 token with capped supply, a token sale contract that supports buying and selling tokens in exchange for ETH, and a frontend DApp that integrates these smart contracts on a testnet.

Part A (ERC20 Token): Build a capped ERC20 token using OpenZeppelin libraries. The token should enforce a maximum supply via _update(), restrict minting to accounts with MINTER_ROLE, and manage permissions through AccessControlDefaultAdminRules.
Part B (Token Sale Contract): Implement a token sale mechanism with Ownable2Step ownership for secure withdrawals. The contract must allow users to buy tokens with ETH (via explicit function calls or by sending ETH directly) and sell tokens back for ETH at a lower rate. It should handle reserves properly, prevent exceeding MAX_SUPPLY, and allow the owner to withdraw both tokens and ETH. The contract itself is granted the MINTER_ROLE in the ERC20 contract.
Part C (Frontend DApp): Deploy the system to a public testnet and build a web-based DApp. Users can connect their wallet (with automatic network switching), view their native ETH balance and token balance, and interact with the token sale contract to buy or sell tokens. The frontend should disable buying if the max token supply is reached and disable selling if the contract lacks enough ETH liquidity.
Part A : ERC20 token

ID	Behaviour
FE-1	Create an ERC20 token contract using OpenZeppelin libraries, with a name, symbol, and number of decimals of your choice. The constructor should accept a parameter to initialize the MAX_SUPPLY.
FE-2	Implement the supply cap for the ERC20 token contract by overriding the _update() function.
FE-3	An account with the MINTER_ROLE should have the ability to mint tokens. You can use the AccessControlDefaultAdminRules library from OpenZeppelin to implement this.
Part B : Token Sale

ID	Behaviour
FE-4	Inherit from Ownable2Step to designate the token sale contract owner. This account should have the ability to withdraw both ERC20 tokens and ETH.
FE-5	The constructor should include parameters to initialize the ERC20 token, the sell price per token in ETH, and the buy price per token in ETH. This contract should allow users to both buy and sell tokens. For example, users can buy tokens at 0.001 ETH each and sell them back at 0.0005 ETH per token. 
FE-6	The token sale contract should be granted the MINTER_ROLE in the ERC20 token contract.
FE-7	Users should be able to buy tokens with ETH. Handle the edge case where new tokens should not be minted if the contract already holds enough token reserves. Additionally, enable users to purchase tokens by simply sending ETH directly to the contract.
FE-8	Users should be able to sell tokens for ETH. When a token is sold, it should be transferred to the token sale contract, allowing it to be resold to other users.
FE-9	The owner should have the permission to withdraw ERC20 tokens from the contract.
FE-10	The owner should have the permission to withdraw ETH from the contract.
Part C : Build a DApp that integrates with token sale contract

ID	Behaviour
FE-11	Deploy the ERC20 token sale contract suite to a testnet of your choice.
FE-12	Users should be able to connect their wallet to the frontend. During connection, the wallet should automatically switch to the desired network where the smart contracts are deployed.
FE-13	Display the native gas token balance of the selected account from the connected wallet on the frontend. For example, on Ethereum mainnet or testnets, show the user’s ETH balance.
FE-14	Users should be able to buy tokens from the frontend using ETH.
FE-15	Display the token balance of the selected account from the connected wallet.
FE-16	A user’s ability to buy tokens from the frontend should depend on the available supply of the ERC20 token. For example, disable the buy button if the maximum supply cap has been reached.
FE-17	Users should be able to sell tokens for ETH. Allow token sales only if the token sale contract has sufficient ETH balance to pay the user.