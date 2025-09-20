# DeFi-nitely  

## Problem Statement  
DeFi today is fragmented across multiple networks, wallets, and decentralized applications, creating a confusing and intimidating environment for users. Beginners struggle with complex smart contracts and technical barriers, while experienced users face inefficiencies and hidden risks. Pricing and liquidity are often opaque, which erodes trust and limits participation.  

This fragmentation and lack of transparency make it difficult for users to confidently access opportunities in the decentralized finance ecosystem.  

---

## The Solution  
This project tackles the challenges of DeFi by providing an all-in-one platform that unifies fragmented networks, wallets, and decentralized applications.  

- 🔍 Leverages **Subgraphs** to efficiently query blockchain data.  
- 📊 Integrates **DIA Oracles** for reliable, real-time price feeds.  
- 🔄 Users can easily access, swap, and manage digital assets across chains without deep technical knowledge.  
- 💸 Automated yield opportunities and transparent pricing ensure users maximize returns while minimizing risk.  
- 🔐 Simplifies complex smart contract interactions and bridges liquidity gaps.  

Ultimately, the platform builds trust and confidence, making DeFi approachable for both beginners and experienced users.  
It transforms DeFi from a fragmented and intimidating ecosystem into a seamless, efficient, and user-friendly experience.  

---

## Contract Addresses  

- **Executor Vault**: [0xD98f9971773045735C62cD8f1a70047f81b9a468](https://shannon-explorer.somnia.network/address/0xD98f9971773045735C62cD8f1a70047f81b9a468)  
- **DIA Oracle**: [0xbFbA9b0ABBFBc718D05E18Bc954967ac192bF81B](https://shannon-explorer.somnia.network/address/0xbFbA9b0ABBFBc718D05E18Bc954967ac192bF81B)  

**Deployed Subgraph:**  
[https://api.studio.thegraph.com/query/117569/uniswap-v-4-sepolia/version/latest](https://api.studio.thegraph.com/query/117569/uniswap-v-4-sepolia/version/latest)  

**Uniswap v4 Pool:**  
- Initialized pool: **WETH / AOT** (demonstration pair).  

---

## Architecture Overview (DeFi-nitely)  
<img width="1019" height="569" alt="Screenshot 2025-09-19 223505" src="https://github.com/user-attachments/assets/4c23fbc2-62c5-4405-b1dc-30ba3b05049d" />


1. **Frontend Layer (User Interaction)**  
   - Built using **Next.js** for fast, responsive web UI.  
   - Users connect via **Thirdweb Wallet** for seamless wallet integration.  
   - Provides dashboard, swap interface, and arbitrage opportunity display.  

2. **Smart Contract Layer**  
   - **Vault Contract** – Manages user deposits securely, acting as the central hub for funds.  
   - **Swap Executor Contract** – Executes token swaps on behalf of users with optimal routing.  

3. **Arbitrage Aggregation Layer**  
   - Continuously scans DEX pools and liquidity sources.  
   - Identifies arbitrage opportunities across multiple markets.  
   - Works with the **Swap Executor** to carry out profitable trades.  

4. **Data & Intelligence Layer**  
   - **DIA Oracle** provides reliable, real-time price feeds.  
   - **Subgraph integration** tracks market data, liquidity positions, and on-chain activity.  
   - Ensures that execution is based on up-to-date and verifiable data.  

5. **Blockchain Layer**  
   - Underlying execution happens on **Ethereum or Layer 2 networks**.  
   - Smart contracts are deployed here, interacting with liquidity pools and external protocols.  

---

## User Flow (DeFi-nitely)  
<img width="1018" height="577" alt="Screenshot 2025-09-19 223517" src="https://github.com/user-attachments/assets/23fd1337-c3a5-49c8-ba85-59a097323587" />

1. **Connect Wallet**  
   - User opens the **Next.js app**.  
   - Clicks **“Connect Wallet”** (via Thirdweb Wallet).  
   - Wallet is authenticated and ready for transactions.  

2. **Explore Arbitrage Strategies**  
   - User is presented with a list of available **arbitrage strategies** curated by the aggregator.  
   - Strategies are based on data from **DIA Oracle** and **Subgraphs**.  
   - Each strategy shows estimated returns, risk, and execution path.  

3. **Select Strategy & Initiate Swap**  
   - User selects the desired **swap strategy**.  
   - The app prepares a transaction flow using the **Vault + Swap Executor contracts**.  

4. **Escrow Funds**  
   - User deposits tokens into the **Vault smart contract**.  
   - This ensures funds are securely locked before execution.  

5. **Swap Execution**  
   - The **Swap Executor contract** performs the swap or arbitrage trade.  
   - Execution follows the strategy path, interacting with different liquidity pools.  
   - **DIA Oracle price feeds** and **Subgraph data** validate prices before execution.  

6. **Withdraw Tokens**  
   - Once execution is completed, profits (swapped tokens) are credited to the **Vault**.  
   - User can view the updated balance in the **UI dashboard panel**.  
   - Finally, user withdraws tokens back to their wallet.  

---

