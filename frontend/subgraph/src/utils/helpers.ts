import { BigInt, BigDecimal, Address, ethereum, log } from "@graphprotocol/graph-ts"
import { ERC20 } from "../../generated/PoolManager/ERC20"
import { ERC20SymbolBytes } from "../../generated/PoolManager/ERC20SymbolBytes"
import { ERC20NameBytes } from "../../generated/PoolManager/ERC20NameBytes"
import { Token, Factory, Transaction, PoolDayData, PoolHourData, TokenDayData, UniswapDayData } from "../../generated/schema"

// Constants
export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString("0")
export let ONE_BD = BigDecimal.fromString("1")
export let BI_18 = BigInt.fromI32(18)

// Factory address - this should be the PoolManager address
export let FACTORY_ADDRESS = "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543"

// Stable coins for price tracking
export let USDC_ADDRESS = "0xA0b86a33E6417Efb46Ec1c9B0c7DD7C9F6e0F9E"
export let USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
export let DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

// WETH address
export let WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

// Minimum liquidity threshold for price tracking
export let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString("1000")
export let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString("2")

// Get or create factory entity
export function getOrCreateFactory(): Factory {
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.poolCount = ZERO_BI
    factory.txCount = ZERO_BI
    factory.totalVolumeUSD = ZERO_BD
    factory.totalVolumeETH = ZERO_BD
    factory.totalFeesUSD = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalValueLockedUSD = ZERO_BD
    factory.totalValueLockedETH = ZERO_BD
    factory.totalValueLockedUSDUntracked = ZERO_BD
    factory.owner = FACTORY_ADDRESS
    factory.save()
  }
  return factory as Factory
}

// Create or load token
export function createToken(address: Address): Token {
  let token = Token.load(address.toHexString())
  if (token !== null) {
    return token as Token
  }

  token = new Token(address.toHexString())
  token.symbol = fetchTokenSymbol(address)
  token.name = fetchTokenName(address)
  token.totalSupply = fetchTokenTotalSupply(address)
  let decimals = fetchTokenDecimals(address)
  
  if (decimals === null) {
    log.debug("Token decimals null for address {}", [address.toHexString()])
    return token as Token
  }
  
  token.decimals = decimals
  token.derivedETH = ZERO_BD
  token.volume = ZERO_BD
  token.volumeUSD = ZERO_BD
  token.feesUSD = ZERO_BD
  token.untrackedVolumeUSD = ZERO_BD
  token.totalValueLocked = ZERO_BD
  token.totalValueLockedUSD = ZERO_BD
  token.totalValueLockedUSDUntracked = ZERO_BD
  token.txCount = ZERO_BI
  token.poolCount = ZERO_BI
  token.whitelistPools = []
  
  token.save()
  return token as Token
}

// Fetch token symbol
export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress)
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

  // Try string first
  let symbolResult = contract.try_symbol()
  if (!symbolResult.reverted) {
    return symbolResult.value
  }

  // Try bytes32
  let symbolResultBytes = contractSymbolBytes.try_symbol()
  if (!symbolResultBytes.reverted) {
    return symbolResultBytes.value.toString()
  }

  return "unknown"
}

// Fetch token name
export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress)
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // Try string first
  let nameResult = contract.try_name()
  if (!nameResult.reverted) {
    return nameResult.value
  }

  // Try bytes32
  let nameResultBytes = contractNameBytes.try_name()
  if (!nameResultBytes.reverted) {
    return nameResultBytes.value.toString()
  }

  return "unknown"
}

// Fetch token total supply
export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress)
  let totalSupplyValue = null as BigInt | null
  let totalSupplyResult = contract.try_totalSupply()
  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult.value
  }
  return totalSupplyValue as BigInt
}

// Fetch token decimals
export function fetchTokenDecimals(tokenAddress: Address): BigInt {
  let contract = ERC20.bind(tokenAddress)
  let decimalValue = null as BigInt | null
  let decimalResult = contract.try_decimals()
  if (!decimalResult.reverted) {
    decimalValue = BigInt.fromI32(decimalResult.value)
  }
  return decimalValue as BigInt
}

// Convert token amount to decimal
export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

// Helper for exponents
export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1")
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString("10"))
  }
  return bd
}

// Safe division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD
  } else {
    return amount0.div(amount1)
  }
}

// Convert sqrt price to token prices
export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: Token, token1: Token): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  // Calculate 2^192 manually since pow() is not available
  let denom = BigDecimal.fromString("6277101735386680763835789423207666416102355444464034512896")
  let price1 = num.div(denom).times(exponentToBigDecimal(token0.decimals)).div(exponentToBigDecimal(token1.decimals))
  let price0 = safeDiv(BigDecimal.fromString("1"), price1)
  return [price0, price1]
}

// Get ETH price in USD (placeholder - should be implemented with price oracle)
export function getEthPriceInUSD(): BigDecimal {
  // This should fetch from a price oracle or stable pair
  // For now, return a placeholder
  return BigDecimal.fromString("2000")
}

// Find ETH per token (placeholder)
export function findEthPerToken(token: Token): BigDecimal {
  if (token.id == WETH_ADDRESS) {
    return ONE_BD
  }
  // This should calculate ETH price from available pools
  // For now, return zero
  return ZERO_BD
}

// Get tracked volume in USD
export function getTrackedVolumeUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let price0 = token0.derivedETH.times(getEthPriceInUSD())
  let price1 = token1.derivedETH.times(getEthPriceInUSD())

  // If both tokens have USD prices, return average
  if (price0.notEqual(ZERO_BD) && price1.notEqual(ZERO_BD)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1)).div(BigDecimal.fromString("2"))
  }

  // If only one has USD price, use that
  if (price0.notEqual(ZERO_BD)) {
    return tokenAmount0.times(price0)
  }

  if (price1.notEqual(ZERO_BD)) {
    return tokenAmount1.times(price1)
  }

  return ZERO_BD
}

// Load transaction
export function loadTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.gasUsed = event.transaction.gasLimit // Use gasLimit instead of gasUsed
    transaction.gasPrice = event.transaction.gasPrice
    transaction.save()
  }
  return transaction as Transaction
}

// Update pool day data
export function updatePoolDayData(event: ethereum.Event): PoolDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayPoolID = event.address.toHexString().concat("-").concat(BigInt.fromI32(dayID).toString())
  
  let poolDayData = PoolDayData.load(dayPoolID)
  if (poolDayData === null) {
    poolDayData = new PoolDayData(dayPoolID)
    poolDayData.date = dayStartTimestamp
    poolDayData.pool = event.address.toHexString()
    poolDayData.liquidity = ZERO_BI
    poolDayData.sqrtPrice = ZERO_BI
    poolDayData.token0Price = ZERO_BD
    poolDayData.token1Price = ZERO_BD
    poolDayData.tick = ZERO_BI
    poolDayData.feeGrowthGlobal0X128 = ZERO_BI
    poolDayData.feeGrowthGlobal1X128 = ZERO_BI
    poolDayData.tvlUSD = ZERO_BD
    poolDayData.volumeToken0 = ZERO_BD
    poolDayData.volumeToken1 = ZERO_BD
    poolDayData.volumeUSD = ZERO_BD
    poolDayData.feesUSD = ZERO_BD
    poolDayData.txCount = ZERO_BI
    poolDayData.open = ZERO_BD
    poolDayData.high = ZERO_BD
    poolDayData.low = ZERO_BD
    poolDayData.close = ZERO_BD
  }
  poolDayData.save()
  return poolDayData as PoolDayData
}

// Update pool hour data
export function updatePoolHourData(event: ethereum.Event): PoolHourData {
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600
  let hourStartUnix = hourIndex * 3600
  let hourPoolID = event.address.toHexString().concat("-").concat(BigInt.fromI32(hourIndex).toString())
  
  let poolHourData = PoolHourData.load(hourPoolID)
  if (poolHourData === null) {
    poolHourData = new PoolHourData(hourPoolID)
    poolHourData.periodStartUnix = hourStartUnix
    poolHourData.pool = event.address.toHexString()
    poolHourData.liquidity = ZERO_BI
    poolHourData.sqrtPrice = ZERO_BI
    poolHourData.token0Price = ZERO_BD
    poolHourData.token1Price = ZERO_BD
    poolHourData.tick = ZERO_BI
    poolHourData.feeGrowthGlobal0X128 = ZERO_BI
    poolHourData.feeGrowthGlobal1X128 = ZERO_BI
    poolHourData.tvlUSD = ZERO_BD
    poolHourData.volumeToken0 = ZERO_BD
    poolHourData.volumeToken1 = ZERO_BD
    poolHourData.volumeUSD = ZERO_BD
    poolHourData.feesUSD = ZERO_BD
    poolHourData.txCount = ZERO_BI
    poolHourData.open = ZERO_BD
    poolHourData.high = ZERO_BD
    poolHourData.low = ZERO_BD
    poolHourData.close = ZERO_BD
  }
  poolHourData.save()
  return poolHourData as PoolHourData
}

// Update token day data
export function updateTokenDayData(token: Token, event: ethereum.Event): TokenDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tokenDayID = token.id.concat("-").concat(BigInt.fromI32(dayID).toString())
  
  let tokenDayData = TokenDayData.load(tokenDayID)
  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.token = token.id
    tokenDayData.volume = ZERO_BD
    tokenDayData.volumeUSD = ZERO_BD
    tokenDayData.untrackedVolumeUSD = ZERO_BD
    tokenDayData.totalValueLocked = ZERO_BD
    tokenDayData.totalValueLockedUSD = ZERO_BD
    tokenDayData.priceUSD = ZERO_BD
    tokenDayData.feesUSD = ZERO_BD
    tokenDayData.open = ZERO_BD
    tokenDayData.high = ZERO_BD
    tokenDayData.low = ZERO_BD
    tokenDayData.close = ZERO_BD
  }
  tokenDayData.save()
  return tokenDayData as TokenDayData
}

// Update Uniswap day data
export function updateUniswapDayData(event: ethereum.Event): UniswapDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  
  let uniswapDayData = UniswapDayData.load(BigInt.fromI32(dayID).toString())
  if (uniswapDayData === null) {
    uniswapDayData = new UniswapDayData(BigInt.fromI32(dayID).toString())
    uniswapDayData.date = dayStartTimestamp
    uniswapDayData.volumeETH = ZERO_BD
    uniswapDayData.volumeUSD = ZERO_BD
    uniswapDayData.volumeUSDUntracked = ZERO_BD
    uniswapDayData.feesUSD = ZERO_BD
    uniswapDayData.txCount = ZERO_BI
    uniswapDayData.tvlUSD = ZERO_BD
  }
  uniswapDayData.save()
  return uniswapDayData as UniswapDayData
}