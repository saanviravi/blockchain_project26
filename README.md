# Emergency Healthcare Access Control System

A blockchain-based emergency healthcare access control system using Attribute-Based Access Control (ABAC) and Break-Glass protocols.

## 🏥 System Overview

This system enables secure, controlled access to patient medical records during emergencies while maintaining privacy and auditability through blockchain technology.

### Key Features
- **ABAC (Attribute-Based Access Control)**: 5-layer permission checking
- **Break-Glass Protocol**: Emergency access with automatic audit trails
- **Cryptographic DEK Escrow**: Secure key management for data decryption
- **Immutable Audit Logs**: All access attempts logged on blockchain
- **Time-Limited Access**: Emergency access expires after 4 hours
- **Ethics Review**: Suspicious access can be flagged for review

## 🚀 Quick Start (Recommended for Demo)

### Option 1: Full Setup (If Hardhat Works)
```bash
# 1. Install dependencies
npm install

# 2. Start local blockchain
npm run node

# 3. Deploy contracts (in new terminal)
npm run deploy

# 4. Start frontend
npm run client
```

### Option 2: Demo Mode (Bypasses Hardhat Issues)
```bash
# 1. Run demo script
npm run demo

# 2. Start frontend directly
npm run client
```

## 🔧 Manual Setup Steps

### Step 1: Environment Setup
```bash
# Check Node.js version (should be 18+)
node --version

# If Node.js 20+ causes issues, consider using Node.js 18 LTS
# or proceed with demo mode
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure MetaMask
1. Install MetaMask browser extension
2. Create/import test accounts
3. Add local network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

### Step 4: Start Local Blockchain
```bash
npx hardhat node
```
Keep this running in a terminal.

### Step 5: Deploy Contracts
```bash
npx hardhat ignition deploy ignition/modules/EmergencyAccess.ts --network localhost
```
Copy the deployed contract address.

### Step 6: Update Frontend
Edit `client/src/App.tsx`:
```typescript
const CONTRACT_ADDRESS = '0x...'; // Paste deployed address here
```

### Step 7: Start Frontend
```bash
cd client
npm install
npm start
```

## 🎯 Demo Script

### 1. Admin Setup
- Connect wallet as admin
- Register hospitals
- View admin panel

### 2. Hospital Management
- Switch to hospital account
- Register as hospital admin
- Attest doctors with roles (ER_DOCTOR, PARAMEDIC, CARDIOLOGIST)

### 3. Doctor Registration
- Switch to doctor account
- Register through hospital attestation
- Configure emergency response capabilities

### 4. Patient Registration
- Switch to patient account
- Register with emergency preferences
- Pre-approve emergency types and medical roles
- Set surrogate contact

### 5. Emergency Simulation
- Create emergency scenario (cardiac arrest, accident, etc.)
- Doctor requests emergency access
- System performs ABAC validation
- Access granted/denied with explanations

### 6. Audit & Compliance
- Review access logs
- Submit justifications within 24 hours
- Trigger ethics reviews for suspicious activity

## 🔐 Security Features Demonstrated

1. **Admin-Controlled Registration**: Prevents unauthorized hospital registration
2. **Multi-Layer ABAC**: Patient preferences + Doctor credentials + Emergency validation
3. **Cryptographic Security**: DEK escrow for data protection
4. **Audit Trails**: Every access attempt is logged immutably
5. **Time Bounds**: Emergency access automatically expires
6. **Ethics Oversight**: Suspicious access can be flagged

## 🛠️ Troubleshooting

### Hardhat Issues
- **Node.js Version**: Use Node.js 18 LTS if 20+ causes problems
- **Compilation Errors**: Check contract syntax in `contracts/contracts/EmergencyAccess.sol`
- **Network Issues**: Ensure localhost:8545 is accessible

### Frontend Issues
- **Contract Address**: Verify the address in `App.tsx` matches deployed contract
- **MetaMask Connection**: Check network configuration
- **Dependencies**: Run `npm install` in client directory

### Alternative: Use Pre-deployed Contract
If deployment fails, use the demo address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

## 📁 Project Structure
```
├── contracts/           # Smart contracts
├── ignition/           # Deployment scripts
├── test/              # Contract tests
├── client/            # React frontend
├── scripts/           # Utility scripts
└── README.md          # This file
```

## 🎓 Learning Outcomes

This demo showcases:
- Smart contract development with Solidity
- Decentralized application (dApp) architecture
- Attribute-Based Access Control implementation
- Break-glass security protocols
- Blockchain for healthcare compliance
- React integration with Web3

## 📞 Support

For demo questions or technical issues, refer to the contract code and test files for implementation details.
