import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Import components
import AdminPanel from './components/AdminPanel';
import HospitalPanel from './components/HospitalPanel';
import DoctorPanel from './components/DoctorPanel';
import PatientPanel from './components/PatientPanel';
import RegistrationPanel from './components/RegistrationPanel';

// Import contract ABI and address
import EmergencyAccessABI from './contracts/contracts/EmergencyAccess.sol/EmergencyAccess.json';

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Update with deployed address

function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | 'hospital' | 'admin' | null>(null);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const account = await signer.getAddress();

        const contract = new ethers.Contract(CONTRACT_ADDRESS, EmergencyAccessABI.abi, signer);

        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        setAccount(account);
        setIsConnected(true);

        // Determine user role
        await determineUserRole(contract, account);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const determineUserRole = async (contract: ethers.Contract, account: string) => {
    try {
      const admin = await contract.admin();
      if (account.toLowerCase() === admin.toLowerCase()) {
        setUserRole('admin');
        return;
      }

      const hospital = await contract.hospitals(account);
      if (hospital.verified) {
        setUserRole('hospital');
        return;
      }

      const doctor = await contract.doctors(account);
      if (doctor.registered) {
        setUserRole('doctor');
        return;
      }

      const patient = await contract.patients(account);
      if (patient.registered) {
        setUserRole('patient');
        return;
      }

      setUserRole(null);
    } catch (error) {
      console.error('Error determining user role:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Emergency Healthcare Access Control</h1>
        {!isConnected ? (
          <button onClick={connectWallet} className="connect-button">
            Connect Wallet
          </button>
        ) : (
          <div className="user-info">
            <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
            <p>Role: {userRole || 'Unregistered'}</p>
          </div>
        )}
      </header>

      <main className="App-main">
        {isConnected && contract && (
          <>
            {userRole === 'admin' && <AdminPanel contract={contract} account={account} />}
            {userRole === 'hospital' && <HospitalPanel contract={contract} account={account} />}
            {userRole === 'doctor' && <DoctorPanel contract={contract} account={account} />}
            {userRole === 'patient' && <PatientPanel contract={contract} account={account} />}
            {!userRole && <RegistrationPanel contract={contract} account={account} onRoleChange={setUserRole} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;