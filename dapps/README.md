# 🚀 Full Stack dApp - Avalanche Fuji Testnet

Full stack dApp yang terintegrasi dengan smart contract SimpleStorage di Avalanche Fuji Testnet.

## 📁 Struktur Project

```
dapps/
├── frontend/my-app/    # Next.js Frontend
├── backend/            # NestJS Backend
└── contracts/          # Smart Contracts
```

## 🔧 Teknologi

| Layer          | Teknologi          |
| -------------- | ------------------ |
| Smart Contract | Solidity, Hardhat  |
| Frontend       | Next.js 16, wagmi  |
| Backend        | NestJS, viem       |
| Blockchain     | Avalanche Fuji     |

## 🏃 Quick Start

### 1. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan contract address yang benar
npm run start:dev
```

Backend berjalan di http://localhost:3001

### 2. Setup Frontend

```bash
cd frontend/my-app
npm install
cp .env.example .env.local
# Edit .env.local dengan URL backend
npm run dev
```

Frontend berjalan di http://localhost:3000

## 📡 API Endpoints

| Method | Endpoint             | Deskripsi                     |
| ------ | -------------------- | ----------------------------- |
| GET    | /blockchain/value    | Read stored value dari contract |
| GET    | /blockchain/block    | Get current block number      |
| POST   | /blockchain/events   | Fetch ValueUpdated events     |

## 🔗 Contract Address

```
0x5776Db2269ec485a1C4f7988f92c9fE215bFBE1F
```

Deployed on Avalanche Fuji Testnet (Chain ID: 43113)

## 📋 Environment Variables

### Backend (.env)

```env
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
CONTRACT_ADDRESS=0x5776Db2269ec485a1C4f7988f92c9fE215bFBE1F
PORT=3001
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5776Db2269ec485a1C4f7988f92c9fE215bFBE1F
```

## 🏗️ Arsitektur

```
User
 ↓
Frontend (Next.js)
 ├── READ via Backend API
 │   ↓
 │   Backend (NestJS) → Blockchain RPC
 │
 └── WRITE via Wallet
     ↓
     Wallet (MetaMask/Core) → Blockchain
```

- **Read**: Frontend → Backend → Blockchain
- **Write**: Frontend → Wallet → Blockchain

📌 **Smart Contract = Single Source of Truth**
📌 **Backend = Read-only, UX improvement layer**

## 📖 Swagger Documentation

Akses Swagger docs di:
```
http://localhost:3001/documentation
```

## 🧪 Testing

### Test Backend API

```bash
# Get value
curl http://localhost:3001/blockchain/value

# Get block number
curl http://localhost:3001/blockchain/block

# Get events (dengan block range)
curl -X POST http://localhost:3001/blockchain/events \
  -H "Content-Type: application/json" \
  -d '{"fromBlock": 50600000, "toBlock": 50650000}'
```

### Test Frontend

1. Buka http://localhost:3000
2. Connect wallet (MetaMask/Core)
3. Switch ke Avalanche Fuji Testnet
4. Read value (via backend)
5. Set new value (via wallet transaction)
