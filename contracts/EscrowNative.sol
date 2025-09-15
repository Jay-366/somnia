// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EscrowNative
 * @dev Minimal escrow contract for native STT tokens with trusted relayer model
 * Purpose: Only escrow native STT and enable release after verified successful swap
 */
contract EscrowNative is AccessControl, ReentrancyGuard {
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    // User balances
    mapping(address => uint256) private _escrowBalances;
    mapping(address => uint256) private _pendingReturns;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Executed(address indexed user, uint256 returnedAmount, bytes32 indexed txReference);
    event Withdrawn(address indexed user, uint256 amount);
    event Refunded(address indexed user, uint256 amount);

    /**
     * @dev Constructor assigns roles to deployer
     */
    constructor() {
        // Grant admin role to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
    }

    /**
     * @dev Deposit native STT tokens into escrow
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Escrow: Amount must be greater than zero");
        
        _escrowBalances[msg.sender] += msg.value;
        
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Mark swap as executed and set pending return amount
     * @param user Address of the user whose swap was executed
     * @param returnedAmount Amount to be returned to user
     * @param txReference Transaction reference hash
     */
    function markExecuted(
        address user, 
        uint256 returnedAmount, 
        bytes32 txReference
    ) external onlyRole(EXECUTOR_ROLE) nonReentrant {
        require(user != address(0), "Escrow: User address cannot be zero");
        require(_escrowBalances[user] >= returnedAmount, "Escrow: Insufficient escrow balance");
        
        _escrowBalances[user] -= returnedAmount;
        _pendingReturns[user] += returnedAmount;
        
        emit Executed(user, returnedAmount, txReference);
    }

    /**
     * @dev User withdraws their pending returns
     */
    function withdraw() external nonReentrant {
        uint256 amount = _pendingReturns[msg.sender];
        require(amount > 0, "Escrow: No pending returns");
        
        _pendingReturns[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Escrow: Transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Emergency refund function for admin
     * @param user Address of user to refund
     */
    function refund(address user) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(user != address(0), "Escrow: User address cannot be zero");
        
        uint256 escrowAmount = _escrowBalances[user];
        uint256 pendingAmount = _pendingReturns[user];
        uint256 totalAmount = escrowAmount + pendingAmount;
        
        require(totalAmount > 0, "Escrow: No funds to refund");
        
        _escrowBalances[user] = 0;
        _pendingReturns[user] = 0;
        
        (bool success, ) = payable(user).call{value: totalAmount}("");
        require(success, "Escrow: Refund transfer failed");
        
        emit Refunded(user, totalAmount);
    }

    /**
     * @dev Get escrow balance for a user
     * @param user Address of the user
     * @return Amount in escrow for the user
     */
    function escrowOf(address user) external view returns (uint256) {
        return _escrowBalances[user];
    }

    /**
     * @dev Get pending return amount for a user
     * @param user Address of the user
     * @return Amount pending withdrawal for the user
     */
    function pendingReturnOf(address user) external view returns (uint256) {
        return _pendingReturns[user];
    }

    /**
     * @dev Get total balance (escrow + pending) for a user
     * @param user Address of the user
     * @return Total balance for the user
     */
    function totalBalanceOf(address user) external view returns (uint256) {
        return _escrowBalances[user] + _pendingReturns[user];
    }

    /**
     * @dev Get contract's total balance
     * @return Total STT held by contract
     */
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Receive function to accept direct STT transfers
     */
    receive() external payable {
        // Allow direct transfers but don't credit to escrow
        // Users should use deposit() function for proper tracking
    }
}