import { BigInt, BigDecimal, Address, ethereum } from "@graphprotocol/graph-ts"
import {
  Initialize,
  ModifyLiquidity,
  Swap,
  Donate,
  Collect,
  Flash
} from "../../generated/PoolManager/PoolManager"
import {
  Pool,
  Token,
  Factory,
  Mint,
  Burn,
  Swap as SwapEntity,
  Collect as CollectEntity,
  Flash as FlashEntity,
  Transaction,
  PoolDayData,
  PoolHourData,
  TokenDayData,
  UniswapDayData
} from "../../generated/schema"
import {
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  BI_18,
  FACTORY_ADDRESS,
  createToken,
  getOrCreateFactory,
  convertTokenToDecimal,
  loadTransaction,
  safeDiv,
  sqrtPriceX96ToTokenPrices,
  getEthPriceInUSD,
  findEthPerToken,
  getTrackedVolumeUSD,
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateUniswapDayData
} from "../utils/helpers"

// Handle pool initialization
export function handleInitialize(event: Initialize): void {
  let poolId = event.params.poolId.toHexString()
  let pool = Pool.load(poolId)
  
  if (pool === null) {
    pool = new Pool(poolId)
    
    // Load or create tokens
    let token0 = createToken(event.params.currency0)
    let token1 = createToken(event.params.currency1)
    
    pool.token0 = token0.id
    pool.token1 = token1.id
    pool.fee = BigInt.fromI32(event.params.fee)
    pool.tickSpacing = event.params.tickSpacing
    pool.hooks = event.params.currency0 // TODO: Extract hooks from pool key
    pool.sqrtPriceX96 = event.params.sqrtPriceX96
    pool.tick = 0 // Will be updated on first swap
    pool.observationIndex = 0
    pool.observationCardinality = 1
    pool.observationCardinalityNext = 1
    pool.feeProtocol = 0
    pool.unlocked = true
    pool.liquidity = ZERO_BI
    
    // Initialize derived fields
    pool.token0Price = ZERO_BD
    pool.token1Price = ZERO_BD
    pool.volumeToken0 = ZERO_BD
    pool.volumeToken1 = ZERO_BD
    pool.volumeUSD = ZERO_BD
    pool.untrackedVolumeUSD = ZERO_BD
    pool.feesUSD = ZERO_BD
    pool.txCount = ZERO_BI
    
    // Set creation data
    pool.createdAtTimestamp = event.block.timestamp
    pool.createdAtBlockNumber = event.block.number
    
    // Calculate initial prices
    let prices = sqrtPriceX96ToTokenPrices(pool.sqrtPriceX96, token0, token1)
    pool.token0Price = prices[0]
    pool.token1Price = prices[1]
    
    pool.save()
    
    // Update token pool counts
    token0.poolCount = token0.poolCount.plus(ONE_BI)
    token1.poolCount = token1.poolCount.plus(ONE_BI)
    token0.save()
    token1.save()
    
    // Update factory
    let factory = getOrCreateFactory()
    factory.poolCount = factory.poolCount.plus(ONE_BI)
    factory.save()
  }
}

// Handle liquidity modifications (mints and burns)
export function handleModifyLiquidity(event: ModifyLiquidity): void {
  let poolId = event.params.poolId.toHexString()
  let pool = Pool.load(poolId)
  
  if (pool === null) {
    return
  }
  
  let transaction = loadTransaction(event)
  let liquidityDelta = event.params.liquidityDelta
  
  // Update pool liquidity
  if (liquidityDelta.gt(ZERO_BI)) {
    // This is a mint (add liquidity)
    pool.liquidity = pool.liquidity.plus(liquidityDelta.abs())
    
    let mint = new Mint(transaction.id + "#" + pool.txCount.toString())
    mint.transaction = transaction.id
    mint.timestamp = transaction.timestamp
    mint.pool = pool.id
    mint.token0 = pool.token0
    mint.token1 = pool.token1
    mint.owner = event.params.sender
    mint.sender = event.params.sender
    mint.origin = event.transaction.from
    mint.amount = liquidityDelta.abs()
    mint.amount0 = ZERO_BD // TODO: Calculate from tick ranges
    mint.amount1 = ZERO_BD // TODO: Calculate from tick ranges
    mint.amountUSD = null
    mint.tickLower = BigInt.fromI32(event.params.tickLower)
    mint.tickUpper = BigInt.fromI32(event.params.tickUpper)
    mint.logIndex = event.logIndex
    mint.save()
    
  } else if (liquidityDelta.lt(ZERO_BI)) {
    // This is a burn (remove liquidity)
    pool.liquidity = pool.liquidity.minus(liquidityDelta.abs())
    
    let burn = new Burn(transaction.id + "#" + pool.txCount.toString())
    burn.transaction = transaction.id
    burn.timestamp = transaction.timestamp
    burn.pool = pool.id
    burn.token0 = pool.token0
    burn.token1 = pool.token1
    burn.owner = event.params.sender
    burn.origin = event.transaction.from
    burn.amount = liquidityDelta.abs()
    burn.amount0 = ZERO_BD // TODO: Calculate from tick ranges
    burn.amount1 = ZERO_BD // TODO: Calculate from tick ranges
    burn.amountUSD = null
    burn.tickLower = BigInt.fromI32(event.params.tickLower)
    burn.tickUpper = BigInt.fromI32(event.params.tickUpper)
    burn.logIndex = event.logIndex
    burn.save()
  }
  
  // Update transaction count
  pool.txCount = pool.txCount.plus(ONE_BI)
  pool.save()
  
  // Update day/hour data
  updatePoolDayData(event)
  updatePoolHourData(event)
  updateUniswapDayData(event)
}

// Handle swaps
export function handleSwap(event: Swap): void {
  let poolId = event.params.poolId.toHexString()
  let pool = Pool.load(poolId)
  
  if (pool === null) {
    return
  }
  
  let transaction = loadTransaction(event)
  let token0 = Token.load(pool.token0)!
  let token1 = Token.load(pool.token1)!
  
  // Update pool state
  pool.sqrtPriceX96 = event.params.sqrtPriceX96
  pool.tick = event.params.tick
  pool.liquidity = event.params.liquidity
  
  // Calculate new prices
  let prices = sqrtPriceX96ToTokenPrices(pool.sqrtPriceX96, token0, token1)
  pool.token0Price = prices[0]
  pool.token1Price = prices[1]
  
  // Convert amounts to decimal
  let amount0 = convertTokenToDecimal(event.params.amount0.abs(), token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1.abs(), token1.decimals)
  
  // Calculate volume in USD
  let amountTotalUSDTracked = getTrackedVolumeUSD(amount0, token0, amount1, token1)
  let amountTotalETHTracked = safeDiv(amountTotalUSDTracked, getEthPriceInUSD())
  let amountTotalUSDUntracked = ZERO_BD
  
  // Update pool volume
  pool.volumeToken0 = pool.volumeToken0.plus(amount0)
  pool.volumeToken1 = pool.volumeToken1.plus(amount1)
  pool.volumeUSD = pool.volumeUSD.plus(amountTotalUSDTracked)
  pool.untrackedVolumeUSD = pool.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
  pool.txCount = pool.txCount.plus(ONE_BI)
  
  // Calculate fees (assuming fee is in basis points)
  let feesUSD = amountTotalUSDTracked.times(pool.fee.toBigDecimal()).div(BigDecimal.fromString("1000000"))
  pool.feesUSD = pool.feesUSD.plus(feesUSD)
  
  pool.save()
  
  // Create swap entity
  let swap = new SwapEntity(transaction.id + "#" + pool.txCount.toString())
  swap.transaction = transaction.id
  swap.timestamp = transaction.timestamp
  swap.pool = pool.id
  swap.token0 = pool.token0
  swap.token1 = pool.token1
  swap.sender = event.params.sender
  swap.recipient = event.params.sender // V4 doesn't separate sender/recipient in event
  swap.origin = event.transaction.from
  swap.amount0 = amount0.times(event.params.amount0.lt(ZERO_BI) ? BigDecimal.fromString("-1") : BigDecimal.fromString("1"))
  swap.amount1 = amount1.times(event.params.amount1.lt(ZERO_BI) ? BigDecimal.fromString("-1") : BigDecimal.fromString("1"))
  swap.amountUSD = amountTotalUSDTracked
  swap.sqrtPriceX96 = event.params.sqrtPriceX96
  swap.tick = BigInt.fromI32(event.params.tick)
  swap.logIndex = event.logIndex
  swap.save()
  
  // Update token volumes
  token0.volume = token0.volume.plus(amount0)
  token0.volumeUSD = token0.volumeUSD.plus(amountTotalUSDTracked)
  token0.untrackedVolumeUSD = token0.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
  token0.feesUSD = token0.feesUSD.plus(feesUSD)
  token0.txCount = token0.txCount.plus(ONE_BI)
  
  token1.volume = token1.volume.plus(amount1)
  token1.volumeUSD = token1.volumeUSD.plus(amountTotalUSDTracked)
  token1.untrackedVolumeUSD = token1.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
  token1.feesUSD = token1.feesUSD.plus(feesUSD)
  token1.txCount = token1.txCount.plus(ONE_BI)
  
  token0.save()
  token1.save()
  
  // Update factory
  let factory = getOrCreateFactory()
  factory.txCount = factory.txCount.plus(ONE_BI)
  factory.totalVolumeUSD = factory.totalVolumeUSD.plus(amountTotalUSDTracked)
  factory.totalVolumeETH = factory.totalVolumeETH.plus(amountTotalETHTracked)
  factory.untrackedVolumeUSD = factory.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
  factory.totalFeesUSD = factory.totalFeesUSD.plus(feesUSD)
  factory.save()
  
  // Update day/hour data
  updatePoolDayData(event)
  updatePoolHourData(event)
  updateTokenDayData(token0, event)
  updateTokenDayData(token1, event)
  updateUniswapDayData(event)
}

// Handle donations
export function handleDonate(event: Donate): void {
  let poolId = event.params.poolId.toHexString()
  let pool = Pool.load(poolId)
  
  if (pool === null) {
    return
  }
  
  let transaction = loadTransaction(event)
  let token0 = Token.load(pool.token0)!
  let token1 = Token.load(pool.token1)!
  
  // Convert amounts to decimal
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  
  // Calculate USD value
  let amountUSD = getTrackedVolumeUSD(amount0, token0, amount1, token1)
  
  // Update pool fees (donations go to LPs as fees)
  pool.feesUSD = pool.feesUSD.plus(amountUSD)
  pool.txCount = pool.txCount.plus(ONE_BI)
  pool.save()
  
  // Update token fees
  token0.feesUSD = token0.feesUSD.plus(amountUSD.div(BigDecimal.fromString("2")))
  token1.feesUSD = token1.feesUSD.plus(amountUSD.div(BigDecimal.fromString("2")))
  token0.save()
  token1.save()
}

// Handle fee collection
export function handleCollect(event: Collect): void {
  let poolId = event.params.poolId.toHexString()
  let pool = Pool.load(poolId)
  
  if (pool === null) {
    return
  }
  
  let transaction = loadTransaction(event)
  let token0 = Token.load(pool.token0)!
  let token1 = Token.load(pool.token1)!
  
  // Convert amounts to decimal
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  
  // Calculate USD value
  let amountUSD = getTrackedVolumeUSD(amount0, token0, amount1, token1)
  
  // Create collect entity
  let collect = new CollectEntity(transaction.id + "#" + pool.txCount.toString())
  collect.transaction = transaction.id
  collect.timestamp = transaction.timestamp
  collect.pool = pool.id
  collect.owner = event.params.owner
  collect.amount0 = amount0
  collect.amount1 = amount1
  collect.amountUSD = amountUSD
  collect.tickLower = BigInt.fromI32(event.params.tickLower)
  collect.tickUpper = BigInt.fromI32(event.params.tickUpper)
  collect.logIndex = event.logIndex
  collect.save()
  
  // Update transaction count
  pool.txCount = pool.txCount.plus(ONE_BI)
  pool.save()
}

// Handle flash loans
export function handleFlash(event: Flash): void {
  let poolId = event.params.poolId.toHexString()
  let pool = Pool.load(poolId)
  
  if (pool === null) {
    return
  }
  
  let transaction = loadTransaction(event)
  let token0 = Token.load(pool.token0)!
  let token1 = Token.load(pool.token1)!
  
  // Convert amounts to decimal
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  let paid0 = convertTokenToDecimal(event.params.paid0, token0.decimals)
  let paid1 = convertTokenToDecimal(event.params.paid1, token1.decimals)
  
  // Calculate USD values
  let amountUSD = getTrackedVolumeUSD(amount0, token0, amount1, token1)
  
  // Create flash entity
  let flash = new FlashEntity(transaction.id + "#" + pool.txCount.toString())
  flash.transaction = transaction.id
  flash.timestamp = transaction.timestamp
  flash.pool = pool.id
  flash.sender = event.params.sender
  flash.recipient = event.params.sender
  flash.amount0 = amount0
  flash.amount1 = amount1
  flash.amountUSD = amountUSD
  flash.amount0Paid = paid0
  flash.amount1Paid = paid1
  flash.logIndex = event.logIndex
  flash.save()
  
  // Calculate flash loan fees
  let fees0 = paid0.minus(amount0)
  let fees1 = paid1.minus(amount1)
  let feesUSD = getTrackedVolumeUSD(fees0, token0, fees1, token1)
  
  // Update pool fees
  pool.feesUSD = pool.feesUSD.plus(feesUSD)
  pool.txCount = pool.txCount.plus(ONE_BI)
  pool.save()
  
  // Update token fees
  token0.feesUSD = token0.feesUSD.plus(feesUSD.div(BigDecimal.fromString("2")))
  token1.feesUSD = token1.feesUSD.plus(feesUSD.div(BigDecimal.fromString("2")))
  token0.save()
  token1.save()
  
  // Update factory
  let factory = getOrCreateFactory()
  factory.totalFeesUSD = factory.totalFeesUSD.plus(feesUSD)
  factory.save()
}