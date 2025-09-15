// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../contracts/EscrowNative.sol";

contract EscrowNativeTest is Test {
    EscrowNative public escrow;
    
    address public owner;
    address public executor;
    address public user1;
    address public user2;
    
    uint256 constant INITIAL_BALANCE = 10 ether;
    uint256 constant DEPOSIT_AMOUNT = 1 ether;
    
    event Deposited(address indexed user, uint256 amount);
    event Executed(address indexed user, uint256 returnedAmount, bytes32 indexed txReference);
    event Withdrawn(address indexed user, uint256 amount);
    event Refunded(address indexed user, uint256 amount);

    function setUp() public {
        owner = makeAddr("owner");
        executor = makeAddr("executor");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Fund accounts with native tokens
        vm.deal(user1, INITIAL_BALANCE);
        vm.deal(user2, INITIAL_BALANCE);
        vm.deal(owner, INITIAL_BALANCE);
        
        vm.startPrank(owner);
        
        // Deploy EscrowNative
        escrow = new EscrowNative();
        
        // Grant executor role
        escrow.grantRole(escrow.EXECUTOR_ROLE(), executor);
        
        vm.stopPrank();
    }

    function testDeployment() public {
        assertTrue(escrow.hasRole(escrow.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(escrow.hasRole(escrow.EXECUTOR_ROLE(), owner));
        assertTrue(escrow.hasRole(escrow.EXECUTOR_ROLE(), executor));
        assertEq(escrow.contractBalance(), 0);
    }

    function testDeposit() public {
        uint256 balanceBefore = user1.balance;
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit Deposited(user1, DEPOSIT_AMOUNT);
        escrow.deposit{value: DEPOSIT_AMOUNT}();
        
        assertEq(escrow.escrowOf(user1), DEPOSIT_AMOUNT);
        assertEq(user1.balance, balanceBefore - DEPOSIT_AMOUNT);
        assertEq(escrow.contractBalance(), DEPOSIT_AMOUNT);
    }

    function testDepositZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Escrow: Amount must be greater than zero");
        escrow.deposit{value: 0}();
    }

    // Note: Insufficient balance testing is handled by the EVM, not our contract

    function testMarkExecuted() public {
        // First deposit
        vm.prank(user1);
        escrow.deposit{value: DEPOSIT_AMOUNT}();
        
        bytes32 txReference = keccak256("test-reference");
        uint256 returnAmount = DEPOSIT_AMOUNT / 2;
        
        vm.prank(executor);
        vm.expectEmit(true, false, true, true);
        emit Executed(user1, returnAmount, txReference);
        escrow.markExecuted(user1, returnAmount, txReference);
        
        assertEq(escrow.escrowOf(user1), DEPOSIT_AMOUNT - returnAmount);
        assertEq(escrow.pendingReturnOf(user1), returnAmount);
    }

    function testMarkExecutedInsufficientBalance() public {
        vm.prank(user1);
        escrow.deposit{value: DEPOSIT_AMOUNT}();
        
        vm.prank(executor);
        vm.expectRevert("Escrow: Insufficient escrow balance");
        escrow.markExecuted(user1, DEPOSIT_AMOUNT + 1, bytes32(0));
    }

    function testMarkExecutedOnlyExecutor() public {
        vm.prank(user1);
        escrow.deposit{value: DEPOSIT_AMOUNT}();
        
        vm.prank(user1);
        vm.expectRevert();
        escrow.markExecuted(user1, DEPOSIT_AMOUNT, bytes32(0));
    }

    function testWithdraw() public {
        // Deposit and mark executed
        vm.prank(user1);
        escrow.deposit{value: DEPOSIT_AMOUNT}();
        
        uint256 returnAmount = DEPOSIT_AMOUNT / 2;
        vm.prank(executor);
        escrow.markExecuted(user1, returnAmount, bytes32(0));
        
        uint256 balanceBefore = user1.balance;
        
        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit Withdrawn(user1, returnAmount);
        escrow.withdraw();
        
        assertEq(escrow.pendingReturnOf(user1), 0);
        assertEq(user1.balance, balanceBefore + returnAmount);
    }

    function testWithdrawNoPendingReturns() public {
        vm.prank(user1);
        vm.expectRevert("Escrow: No pending returns");
        escrow.withdraw();
    }

    function testRefund() public {
        // Deposit some amount
        vm.prank(user1);
        escrow.deposit{value: DEPOSIT_AMOUNT}();
        
        // Mark some as executed
        uint256 returnAmount = DEPOSIT_AMOUNT / 3;
        vm.prank(executor);
        escrow.markExecuted(user1, returnAmount, bytes32(0));
        
        uint256 balanceBefore = user1.balance;
        uint256 totalToRefund = escrow.escrowOf(user1) + escrow.pendingReturnOf(user1);
        
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit Refunded(user1, totalToRefund);
        escrow.refund(user1);
        
        assertEq(escrow.escrowOf(user1), 0);
        assertEq(escrow.pendingReturnOf(user1), 0);
        assertEq(user1.balance, balanceBefore + totalToRefund);
    }

    function testRefundOnlyAdmin() public {
        vm.prank(user1);
        escrow.deposit{value: DEPOSIT_AMOUNT}();
        
        vm.prank(executor);
        vm.expectRevert();
        escrow.refund(user1);
    }

    function testRefundNoFunds() public {
        vm.prank(owner);
        vm.expectRevert("Escrow: No funds to refund");
        escrow.refund(user1);
    }

    function testViewFunctions() public {
        // Initial state
        assertEq(escrow.escrowOf(user1), 0);
        assertEq(escrow.pendingReturnOf(user1), 0);
        assertEq(escrow.totalBalanceOf(user1), 0);
        assertEq(escrow.contractBalance(), 0);
        
        // After deposit
        vm.prank(user1);
        escrow.deposit{value: DEPOSIT_AMOUNT}();
        
        assertEq(escrow.escrowOf(user1), DEPOSIT_AMOUNT);
        assertEq(escrow.pendingReturnOf(user1), 0);
        assertEq(escrow.totalBalanceOf(user1), DEPOSIT_AMOUNT);
        assertEq(escrow.contractBalance(), DEPOSIT_AMOUNT);
        
        // After execution
        uint256 returnAmount = DEPOSIT_AMOUNT / 2;
        vm.prank(executor);
        escrow.markExecuted(user1, returnAmount, bytes32(0));
        
        assertEq(escrow.escrowOf(user1), DEPOSIT_AMOUNT - returnAmount);
        assertEq(escrow.pendingReturnOf(user1), returnAmount);
        assertEq(escrow.totalBalanceOf(user1), DEPOSIT_AMOUNT);
        assertEq(escrow.contractBalance(), DEPOSIT_AMOUNT);
    }

    function testMultipleUsers() public {
        uint256 amount1 = 0.5 ether;
        uint256 amount2 = 0.75 ether;
        
        // Both users deposit
        vm.prank(user1);
        escrow.deposit{value: amount1}();
        
        vm.prank(user2);
        escrow.deposit{value: amount2}();
        
        assertEq(escrow.contractBalance(), amount1 + amount2);
        
        // Execute for user1
        vm.prank(executor);
        escrow.markExecuted(user1, amount1, bytes32("ref1"));
        
        // Execute for user2
        vm.prank(executor);
        escrow.markExecuted(user2, amount2 / 2, bytes32("ref2"));
        
        // Verify balances
        assertEq(escrow.escrowOf(user1), 0);
        assertEq(escrow.pendingReturnOf(user1), amount1);
        assertEq(escrow.escrowOf(user2), amount2 / 2);
        assertEq(escrow.pendingReturnOf(user2), amount2 / 2);
        
        // Both withdraw
        vm.prank(user1);
        escrow.withdraw();
        
        vm.prank(user2);
        escrow.withdraw();
        
        // Verify final state
        assertEq(escrow.pendingReturnOf(user1), 0);
        assertEq(escrow.pendingReturnOf(user2), 0);
        assertEq(escrow.contractBalance(), amount2 / 2); // Remaining escrowed amount
    }

    function testReceiveFunction() public {
        uint256 sendAmount = 0.1 ether;
        
        // Send STT directly to contract
        vm.prank(user1);
        (bool success, ) = address(escrow).call{value: sendAmount}("");
        assertTrue(success);
        
        // Contract should receive the funds but not credit to user's escrow
        assertEq(escrow.contractBalance(), sendAmount);
        assertEq(escrow.escrowOf(user1), 0);
    }
}