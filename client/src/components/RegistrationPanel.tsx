import React, { useState } from 'react';
import { ethers } from 'ethers';

interface RegistrationPanelProps {
  contract: ethers.Contract;
  account: string;
  onRoleChange: (role: 'patient' | 'doctor' | 'hospital' | 'admin') => void;
}

const RegistrationPanel: React.FC<RegistrationPanelProps> = ({ contract, account, onRoleChange }) => {
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | 'hospital' | null>(null);

  const handleRoleSelection = async (role: 'patient' | 'doctor' | 'hospital') => {
    setSelectedRole(role);
    // For now, just update the role - actual registration happens in individual panels
    onRoleChange(role);
  };

  return (
    <div className="panel">
      <h2>Welcome to Emergency Healthcare Access Control</h2>
      <p>Please select your role to get started:</p>

      <div className="role-selection">
        <div className="role-card" onClick={() => handleRoleSelection('patient')}>
          <h3>Patient</h3>
          <p>Register to control emergency access to your healthcare data</p>
        </div>

        <div className="role-card" onClick={() => handleRoleSelection('doctor')}>
          <h3>Healthcare Professional</h3>
          <p>Request emergency access to patient data when needed</p>
        </div>

        <div className="role-card" onClick={() => handleRoleSelection('hospital')}>
          <h3>Hospital Administrator</h3>
          <p>Register your hospital and attest medical professionals</p>
        </div>
      </div>

      {selectedRole && (
        <div className="registration-note">
          <p>You've selected: <strong>{selectedRole}</strong></p>
          <p>Please complete the registration form above.</p>
        </div>
      )}
    </div>
  );
};

export default RegistrationPanel;