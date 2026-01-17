# 🚀 Avalanche Full Stack dApp (Monorepo)

Full stack dApp yang terintegrasi dengan smart contract SimpleStorage di Avalanche Fuji Testnet.

## 📁 Struktur Monorepo

```
dapps/
├── frontend/        # Next.js Frontend
├── backend/         # NestJS Backend
├── contracts/       # Smart Contracts
├── package.json     # Root package (workspaces)
├── render.yaml      # Render deployment
├── fly.*.toml       # Fly.io deployment
└── README.md
```

## 🔧 Teknologi

| Layer          | Teknologi          |
| -------------- | ------------------ |
| Smart Contract | Solidity, Hardhat  |
| Frontend       | Next.js 16, wagmi  |
| Backend        | NestJS, viem       |
| Blockchain     | Avalanche Fuji     |

## 🏃 Quick Start

### Install All Dependencies
```bash
npm install
```

### Run Both Services
```bash
npm run dev
```

### Run Individually
```bash
# Backend only (http://localhost:3001)
npm run dev:backend

# Frontend only (http://localhost:3000)
npm run dev:frontend
```

### Build All
```bash
npm run build
```

## 🚀 Deployment

### Option 1: Render
1. Connect GitHub repo to Render
2. Select "Blueprint" deployment
3. Render akan otomatis detect `render.yaml`
4. Set environment variables

### Option 2: Fly.io

**Deploy Backend:**
```bash
fly launch --config fly.backend.toml
fly secrets set RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
fly secrets set CONTRACT_ADDRESS=0x5776Db2269ec485a1C4f7988f92c9fE215bFBE1F
fly deploy --config fly.backend.toml
```

**Deploy Frontend:**
```bash
fly launch --config fly.frontend.toml
fly secrets set NEXT_PUBLIC_BACKEND_URL=https://your-backend.fly.dev
fly secrets set NEXT_PUBLIC_CONTRACT_ADDRESS=0x5776Db2269ec485a1C4f7988f92c9fE215bFBE1F
fly deploy --config fly.frontend.toml
```

## 📡 API Endpoints

| Method | Endpoint             | Deskripsi                     |
| ------ | -------------------- | ----------------------------- |
| GET    | /blockchain/value    | Read stored value             |
| GET    | /blockchain/block    | Get current block number      |
| POST   | /blockchain/events   | Fetch ValueUpdated events     |

## 🔗 Contract Address

```
0x5776Db2269ec485a1C4f7988f92c9fE215bFBE1F
```

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

📌 **Smart Contract = Single Source of Truth**
📌 **Backend = Read-only, UX improvement layer**
