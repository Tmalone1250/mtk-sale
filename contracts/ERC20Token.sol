// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Token is ERC20, AccessControlDefaultAdminRules, Pausable {
    //State Variables
    uint256 public immutable MAX_SUPPLY;

    //Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    //Custom Errors
    error MaxSupplyReached();
    error ZeroAddress();

    //Constructor
    constructor(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        address initalMinter,
        address initialDefaultAdmin,
        uint48 initialDelay
    )
        ERC20(name, symbol)
        AccessControlDefaultAdminRules(initialDelay, initialDefaultAdmin)
    {
        MAX_SUPPLY = maxSupply;

        _grantRole(MINTER_ROLE, initalMinter);
        _grantRole(PAUSER_ROLE, initalMinter);

        _mint(initalMinter, 10000 * (10 ** 18));
    }

    // Override _update function in ERC20
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (from == address(0) && totalSupply() + value > MAX_SUPPLY) {
            revert MaxSupplyReached();
        }

        super._update(from, to, value);
    }

    // Override transfer functions to add pausable functionality
    function transfer(
        address to,
        uint256 value
    ) public override whenNotPaused returns (bool) {
        return super.transfer(to, value);
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, value);
    }

    // Mint Function
    function mint(address to, uint amount) public onlyRole(MINTER_ROLE) {
        require(amount > 0, "Amount must be greater than zero");
        if (to == address(0)) {
            revert ZeroAddress();
        }

        _mint(to, amount);
    }

    // Pause Function
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    // Unpause Function
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Debug function to test pausable
    function testPausable() public view whenNotPaused returns (bool) {
        return true;
    }
}
