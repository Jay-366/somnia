// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/forge-std/src/Test.sol";
import "../contracts/ExecutorVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "lib/v4-core/src/interfaces/IPoolManager.sol";

contract ExecutorVaultTest is Test {
    ExecutorVault public vault;
    
    // Sepolia addresses (matching your deployment)
    address public constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address public constant AOT = 0xD98f9971773045735C62cD8f1a70047f81b9a468;
    address public constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    
    // Test accounts
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    
    // Test amounts
    uint256 public constant INITIAL_AOT_AMOUNT = 1000 ether;
    uint256 public constant INITIAL_WETH_AMOUNT = 100 ether;
    uint256 public constant TEST_SWAP_AMOUNT = 10 ether;

    event SwapExecuted(
        address indexed user,
        uint256 aotAmountIn,
        uint256 wethAmountOut,
        uint256 timestamp
    );
    
    event Withdrawal(
        address indexed user,
        address indexed token,
        uint256 amount,
        bool unwrapped
    );

    function setUp() public {
        // Use Sepolia fork for testing with real contracts
        vm.createSelectFork("sepolia");
        
        // Set up owner
        vm.startPrank(owner);
        
        // Deploy ExecutorVault
        vault = new ExecutorVault();
        
        vm.stopPrank();
        
        // Give test users some tokens for testing
        _dealTokens();
    }

    function _dealTokens() internal {
        // Deal ETH to users for gas
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(address(vault), 10 ether);
        
        // Deal AOT tokens to users
        deal(AOT, user1, INITIAL_AOT_AMOUNT);
        deal(AOT, user2, INITIAL_AOT_AMOUNT);
        
        // Deal WETH tokens to users and vault
        deal(WETH, user1, INITIAL_WETH_AMOUNT);
        deal(WETH, user2, INITIAL_WETH_AMOUNT);
        deal(WETH, address(vault), INITIAL_WETH_AMOUNT);
    }

    function test_Deployment() public {
        // Test deployment parameters
        assertEq(vault.WETH(), WETH);
        assertEq(vault.AOT(), AOT);
        assertEq(vault.POOL_MANAGER(), POOL_MANAGER);
        assertEq(vault.owner(), owner);
        assertEq(vault.POOL_FEE(), 3000);
        assertEq(vault.TICK_SPACING(), 60);
    }

    function test_GetPoolInfo() public {
        (address currency0, address currency1, uint24 fee, int24 tickSpacing) = vault.getPoolInfo();
        
        // Currency0 should be the lower address
        assertTrue(currency0 < currency1);
        assertTrue(currency0 == WETH || currency0 == AOT);
        assertTrue(currency1 == WETH || currency1 == AOT);
        assertEq(fee, 3000);
        assertEq(tickSpacing, 60);
    }

    function test_DirectDeposit() public {
        vm.startPrank(user1);
        
        // Approve vault to spend AOT
        IERC20(AOT).approve(address(vault), TEST_SWAP_AMOUNT);
        
        // Deposit AOT
        vault.deposit(AOT, TEST_SWAP_AMOUNT);
        
        // Check balances
        assertEq(vault.getUserBalance(user1, AOT), TEST_SWAP_AMOUNT);
        assertEq(vault.totalBalances(AOT), TEST_SWAP_AMOUNT);
        
        vm.stopPrank();
    }

    function test_DirectDepositWETH() public {
        vm.startPrank(user1);
        
        // Approve vault to spend WETH
        IERC20(WETH).approve(address(vault), TEST_SWAP_AMOUNT);
        
        // Deposit WETH
        vault.deposit(WETH, TEST_SWAP_AMOUNT);
        
        // Check balances
        assertEq(vault.getUserBalance(user1, WETH), TEST_SWAP_AMOUNT);
        assertEq(vault.totalBalances(WETH), TEST_SWAP_AMOUNT);
        
        vm.stopPrank();
    }

    function test_DirectDepositUnsupportedToken() public {
        address randomToken = address(0x999);
        
        vm.startPrank(user1);
        
        vm.expectRevert("ExecutorVault: Unsupported token");
        vault.deposit(randomToken, TEST_SWAP_AMOUNT);
        
        vm.stopPrank();
    }

    function test_WithdrawWETH() public {
        // First deposit WETH
        vm.startPrank(user1);
        IERC20(WETH).approve(address(vault), TEST_SWAP_AMOUNT);
        vault.deposit(WETH, TEST_SWAP_AMOUNT);
        
        uint256 userWETHBefore = IERC20(WETH).balanceOf(user1);
        
        // Withdraw WETH (no unwrap)
        vault.withdraw(WETH, TEST_SWAP_AMOUNT, false);
        
        // Check balances
        assertEq(vault.getUserBalance(user1, WETH), 0);
        assertEq(IERC20(WETH).balanceOf(user1), userWETHBefore + TEST_SWAP_AMOUNT);
        
        vm.stopPrank();
    }

    function test_WithdrawWETHWithUnwrap() public {
        // First deposit WETH
        vm.startPrank(user1);
        IERC20(WETH).approve(address(vault), TEST_SWAP_AMOUNT);
        vault.deposit(WETH, TEST_SWAP_AMOUNT);
        
        uint256 userETHBefore = user1.balance;
        
        // Withdraw WETH with unwrap to ETH
        vault.withdraw(WETH, TEST_SWAP_AMOUNT, true);
        
        // Check balances
        assertEq(vault.getUserBalance(user1, WETH), 0);
        assertEq(user1.balance, userETHBefore + TEST_SWAP_AMOUNT);
        
        vm.stopPrank();
    }

    function test_WithdrawInsufficientBalance() public {
        vm.startPrank(user1);
        
        vm.expectRevert("ExecutorVault: Insufficient balance");
        vault.withdraw(WETH, TEST_SWAP_AMOUNT, false);
        
        vm.stopPrank();
    }

    function test_GetUserBalances() public {
        vm.startPrank(user1);
        
        // Deposit both tokens
        IERC20(AOT).approve(address(vault), TEST_SWAP_AMOUNT);
        vault.deposit(AOT, TEST_SWAP_AMOUNT);
        
        IERC20(WETH).approve(address(vault), TEST_SWAP_AMOUNT / 2);
        vault.deposit(WETH, TEST_SWAP_AMOUNT / 2);
        
        // Check getUserBalances function
        (uint256 wethBalance, uint256 aotBalance) = vault.getUserBalances(user1);
        assertEq(wethBalance, TEST_SWAP_AMOUNT / 2);
        assertEq(aotBalance, TEST_SWAP_AMOUNT);
        
        vm.stopPrank();
    }

    function test_GetTotalBalances() public {
        vm.startPrank(user1);
        IERC20(AOT).approve(address(vault), TEST_SWAP_AMOUNT);
        vault.deposit(AOT, TEST_SWAP_AMOUNT);
        vm.stopPrank();
        
        vm.startPrank(user2);
        IERC20(WETH).approve(address(vault), TEST_SWAP_AMOUNT * 2);
        vault.deposit(WETH, TEST_SWAP_AMOUNT * 2);
        vm.stopPrank();
        
        // Check total balances
        (uint256 wethTotal, uint256 aotTotal) = vault.getTotalBalances();
        assertEq(wethTotal, TEST_SWAP_AMOUNT * 2);
        assertEq(aotTotal, TEST_SWAP_AMOUNT);
    }

    function test_GetContractBalances() public {
        vm.startPrank(user1);
        IERC20(AOT).approve(address(vault), TEST_SWAP_AMOUNT);
        vault.deposit(AOT, TEST_SWAP_AMOUNT);
        vm.stopPrank();
        
        (uint256 wethActual, uint256 aotActual) = vault.getContractBalances();
        
        // Should include both deposited tokens and initial deal amounts
        assertGe(aotActual, TEST_SWAP_AMOUNT);
        assertGe(wethActual, 0);
    }

    function test_EmergencyWithdrawOnlyOwner() public {
        // Non-owner should fail
        vm.startPrank(user1);
        vm.expectRevert();
        vault.emergencyWithdraw(AOT, 1 ether);
        vm.stopPrank();
        
        // Owner should succeed
        vm.startPrank(owner);
        uint256 ownerBalanceBefore = IERC20(AOT).balanceOf(owner);
        
        // First ensure vault has some AOT
        deal(AOT, address(vault), 1 ether);
        
        vault.emergencyWithdraw(AOT, 1 ether);
        assertEq(IERC20(AOT).balanceOf(owner), ownerBalanceBefore + 1 ether);
        vm.stopPrank();
    }

    function test_EmergencyWithdrawETH() public {
        // Give vault some ETH
        vm.deal(address(vault), 5 ether);
        
        vm.startPrank(owner);
        uint256 ownerETHBefore = owner.balance;
        
        vault.emergencyWithdrawETH();
        assertEq(owner.balance, ownerETHBefore + 5 ether);
        vm.stopPrank();
    }

    function test_ReceiveETH() public {
        uint256 vaultETHBefore = address(vault).balance;
        
        // Send ETH to vault
        vm.deal(user1, 1 ether);
        vm.startPrank(user1);
        (bool success, ) = payable(address(vault)).call{value: 1 ether}("");
        assertTrue(success);
        
        assertEq(address(vault).balance, vaultETHBefore + 1 ether);
        vm.stopPrank();
    }

    // Note: ExecuteSwap test would require the actual Uniswap V4 pool to be properly initialized
    // with liquidity on Sepolia. This test can be added once the pool is active.
    function test_ExecuteSwapRequiresRealPool() public {
        // This test demonstrates the setup for swap testing
        vm.startPrank(user1);
        
        // Approve vault to spend AOT
        IERC20(AOT).approve(address(vault), TEST_SWAP_AMOUNT);
        
        // Note: This will likely revert if the pool doesn't have liquidity
        // or if the pool hasn't been properly initialized on Sepolia
        // vm.expectRevert(); // Uncomment when testing against empty pool
        // vault.executeSwap(TEST_SWAP_AMOUNT);
        
        vm.stopPrank();
    }

    function test_ZeroAmountOperations() public {
        vm.startPrank(user1);
        
        vm.expectRevert("ExecutorVault: Amount must be greater than 0");
        vault.deposit(AOT, 0);
        
        vm.expectRevert("ExecutorVault: Amount must be greater than 0");
        vault.withdraw(WETH, 0, false);
        
        vm.expectRevert("ExecutorVault: Amount must be greater than 0");
        vault.executeSwap(0);
        
        vm.stopPrank();
    }
}