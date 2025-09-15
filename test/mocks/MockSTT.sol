// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockSTT
 * @dev Simple ERC20 mock token for testing (representing STT token)
 */
contract MockSTT is ERC20 {
    constructor() ERC20("Mock STT Token", "STT") {
        // Mint initial supply to deployer for testing
        _mint(msg.sender, 1000000 * 10**18); // 1M tokens
    }

    /**
     * @dev Mint tokens to specified address (for testing purposes)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from specified address (for testing purposes)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}