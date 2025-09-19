import { GraphQLClient, gql } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

export interface UniswapPool {
  id: string;
  token0: {
    id: string;
    symbol: string;
    decimals: string;
  };
  token1: {
    id: string;
    symbol: string;
    decimals: string;
  };
  token0Price: string;
  token1Price: string;
  volumeUSD: string;
  totalValueLockedUSD: string;
  feeTier: string;
}

export interface UniswapPriceData {
  pool: UniswapPool;
  token0Price: number;
  token1Price: number;
  timestamp: string;
  source: string;
}

class UniswapSubgraphFetcher {
  private client: GraphQLClient;

  constructor() {
    const subgraphUrl = process.env.UNISWAP_SUBGRAPH_URL || 
      'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
    
    this.client = new GraphQLClient(subgraphUrl);
  }

  async fetchPoolData(token0Address: string, token1Address: string, feeTier: number = 3000): Promise<UniswapPriceData | null> {
    try {
      // Normalize addresses to lowercase for comparison
      const addr0 = token0Address.toLowerCase();
      const addr1 = token1Address.toLowerCase();

      console.log(`Fetching Uniswap pool data for ${addr0}/${addr1} (fee: ${feeTier})...`);

      const query = gql`
        query GetPool($token0: String!, $token1: String!, $feeTier: String!) {
          pools(
            where: {
              or: [
                { token0: $token0, token1: $token1, feeTier: $feeTier },
                { token0: $token1, token1: $token0, feeTier: $feeTier }
              ]
            }
            orderBy: totalValueLockedUSD
            orderDirection: desc
            first: 1
          ) {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            token0Price
            token1Price
            volumeUSD
            totalValueLockedUSD
            feeTier
          }
        }
      `;

      const variables = {
        token0: addr0,
        token1: addr1,
        feeTier: feeTier.toString()
      };

      const response = await this.client.request<{ pools: UniswapPool[] }>(query, variables);

      if (!response.pools || response.pools.length === 0) {
        console.log(`❌ No Uniswap pool found for ${addr0}/${addr1}`);
        return null;
      }

      const pool = response.pools[0];
      
      const priceData: UniswapPriceData = {
        pool,
        token0Price: parseFloat(pool.token0Price),
        token1Price: parseFloat(pool.token1Price),
        timestamp: new Date().toISOString(),
        source: 'Uniswap-V3'
      };

      console.log(`✅ Uniswap pool found: ${pool.token0.symbol}/${pool.token1.symbol}`);
      console.log(`   Token0 Price: ${priceData.token0Price}`);
      console.log(`   Token1 Price: ${priceData.token1Price}`);
      console.log(`   TVL: $${parseFloat(pool.totalValueLockedUSD).toLocaleString()}`);

      return priceData;

    } catch (error) {
      console.error(`❌ Error fetching Uniswap pool data:`, error);
      return null;
    }
  }

  async fetchPopularPools(): Promise<UniswapPool[]> {
    try {
      console.log('Fetching popular Uniswap pools...');

      const query = gql`
        query GetPopularPools {
          pools(
            orderBy: totalValueLockedUSD
            orderDirection: desc
            first: 10
            where: { totalValueLockedUSD_gt: "1000000" }
          ) {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            token0Price
            token1Price
            volumeUSD
            totalValueLockedUSD
            feeTier
          }
        }
      `;

      const response = await this.client.request<{ pools: UniswapPool[] }>(query);
      
      console.log(`✅ Found ${response.pools.length} popular pools`);
      
      return response.pools;

    } catch (error) {
      console.error('❌ Error fetching popular pools:', error);
      return [];
    }
  }

  async findPoolByTokens(token0Symbol: string, token1Symbol: string): Promise<UniswapPool | null> {
    try {
      console.log(`Searching for pool: ${token0Symbol}/${token1Symbol}...`);

      const query = gql`
        query FindPoolBySymbols($token0Symbol: String!, $token1Symbol: String!) {
          pools(
            where: {
              or: [
                { token0_: { symbol: $token0Symbol }, token1_: { symbol: $token1Symbol } },
                { token0_: { symbol: $token1Symbol }, token1_: { symbol: $token0Symbol } }
              ]
            }
            orderBy: totalValueLockedUSD
            orderDirection: desc
            first: 1
          ) {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            token0Price
            token1Price
            volumeUSD
            totalValueLockedUSD
            feeTier
          }
        }
      `;

      const variables = {
        token0Symbol: token0Symbol.toUpperCase(),
        token1Symbol: token1Symbol.toUpperCase()
      };

      const response = await this.client.request<{ pools: UniswapPool[] }>(query, variables);

      if (response.pools.length > 0) {
        console.log(`✅ Found pool: ${response.pools[0].token0.symbol}/${response.pools[0].token1.symbol}`);
        return response.pools[0];
      }

      console.log(`❌ No pool found for ${token0Symbol}/${token1Symbol}`);
      return null;

    } catch (error) {
      console.error(`❌ Error finding pool by symbols:`, error);
      return null;
    }
  }
}

// CLI execution
async function main() {
  const fetcher = new UniswapSubgraphFetcher();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Default: show popular pools
    console.log('🚀 Fetching popular Uniswap pools...\n');
    const pools = await fetcher.fetchPopularPools();
    
    console.log('\n📊 Top Pools by TVL:');
    pools.forEach((pool, index) => {
      const tvl = parseFloat(pool.totalValueLockedUSD);
      const volume = parseFloat(pool.volumeUSD);
      console.log(`${index + 1}. ${pool.token0.symbol}/${pool.token1.symbol} (${pool.feeTier}bp)`);
      console.log(`   TVL: $${tvl.toLocaleString()} | Volume: $${volume.toLocaleString()}`);
    });
    
  } else if (args.length === 2) {
    // Fetch specific pool by token symbols
    const [token0, token1] = args;
    console.log(`🚀 Searching for ${token0}/${token1} pool...\n`);
    
    const pool = await fetcher.findPoolByTokens(token0, token1);
    if (pool) {
      const priceData = await fetcher.fetchPoolData(pool.token0.id, pool.token1.id, parseInt(pool.feeTier));
      if (priceData) {
        console.log('\n📊 Pool Details:');
        console.log(`Price: 1 ${pool.token0.symbol} = ${priceData.token0Price} ${pool.token1.symbol}`);
        console.log(`Price: 1 ${pool.token1.symbol} = ${priceData.token1Price} ${pool.token0.symbol}`);
      }
    }
    
  } else {
    console.log('Usage:');
    console.log('  npm run price:uniswap                    # Show popular pools');
    console.log('  npm run price:uniswap WETH USDC          # Get specific pool');
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default UniswapSubgraphFetcher;