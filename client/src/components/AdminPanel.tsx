import React, { useState } from 'react';
import { ethers } from 'ethers';

interface AdminPanelProps {
  contract: ethers.Contract;
  account: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ contract, account }) => {
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalName, setHospitalName] = useState('');

  const registerHospital = async () => {
    try {
      const tx = await contract.registerHospital(hospitalAddress, hospitalName);
      await tx.wait();
      alert('Hospital registered successfully!');
      setHospitalAddress('');
      setHospitalName('');
    } catch (error) {
      console.error('Error registering hospital:', error);
      alert('Error registering hospital');
    }
  };

  return (
    <div className="panel">
      <h2>Admin Dashboard</h2>
      <div className="admin-info">
        <p><strong>Admin Address:</strong> {account}</p>
      </div>

      <div className="section">
        <h3>Register Hospital</h3>
        <div className="form-group">
          <label>Hospital Address:</label>
          <input
            type="text"
            value={hospitalAddress}
            onChange={(e) => setHospitalAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>Hospital Name:</label>
          <input
            type="text"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            placeholder="Hospital Name"
          />
        </div>
        <button onClick={registerHospital} className="action-button">
          Register Hospital
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;