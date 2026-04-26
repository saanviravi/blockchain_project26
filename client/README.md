# Emergency Healthcare Access Control - Frontend

A React-based frontend for the Emergency Healthcare Access Control blockchain system.

## Features

- **Patient Registration**: Register as a patient with emergency DEK, surrogate contacts, and access preferences
- **Doctor Dashboard**: Request emergency access and submit justifications
- **Hospital Administration**: Register hospitals and attest medical professionals
- **Admin Panel**: Register verified hospitals in the system
- **Justification Input**: Doctors can write detailed justifications for emergency access (the main input section you requested)

## Setup

1. Install dependencies:
```bash
cd client
npm install
```

2. Update the contract address in `src/App.tsx`:
```typescript
const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

3. Start the development server:
```bash
npm start
```

## Usage

1. Connect your MetaMask wallet
2. Select your role (Patient, Doctor, or Hospital Admin)
3. Complete registration if needed
4. Use the appropriate dashboard for your role

### For Doctors - The Input Section

When doctors request emergency access, they must submit a written justification within 24 hours. The interface provides:

- A text area for writing detailed justifications
- Clear submission workflow
- Access log tracking
- Ethics review flagging for unsubmitted justifications

## Contract Integration

The frontend integrates with the EmergencyAccess smart contract using:
- ethers.js for blockchain interaction
- MetaMask for wallet connectivity
- Real-time contract state updates

## Security Features

- Wallet-based authentication
- Contract-based access control
- Immutable audit trails
- Ethics review mechanisms

## File Structure

```
client/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AdminPanel.tsx
│   │   ├── DoctorPanel.tsx
│   │   ├── HospitalPanel.tsx
│   │   ├── PatientPanel.tsx
│   │   └── RegistrationPanel.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── index.tsx
│   └── index.css
├── contracts/ (copied from root contracts/)
├── package.json
├── tsconfig.json
└── README.md
```

## Key Components

### DoctorPanel.tsx
Contains the main input section you requested - a textarea where doctors can write their justification for emergency access requests. The interface includes:
- Form validation
- Character limits
- Clear submit/cancel buttons
- Integration with blockchain for justification submission