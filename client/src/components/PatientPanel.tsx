import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface PatientPanelProps {
  contract: ethers.Contract;
  account: string;
}

const PatientPanel: React.FC<PatientPanelProps> = ({ contract, account }) => {
  const [patientData, setPatientData] = useState<any>(null);
  const [emergencyDEK, setEmergencyDEK] = useState('');
  const [surrogate, setSurrogate] = useState('');
  const [allowedTypes, setAllowedTypes] = useState('');
  const [allowedRoles, setAllowedRoles] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [contract, account]);

  const loadPatientData = async () => {
    try {
      const patient = await contract.patients(account);
      setPatientData(patient);
      setIsRegistered(patient.registered);
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

  const generateDEK = () => {
    // Generate a random 32-byte emergency decryption key
    const keyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      keyBytes[i] = Math.floor(Math.random() * 256);
    }
    const hexKey = '0x' + Array.from(keyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setEmergencyDEK(hexKey);
  };

  const registerPatient = async () => {
    try {
      const typesArray = allowedTypes.split(',').map((t: string) => t.trim());
      const rolesArray = allowedRoles.split(',').map((r: string) => r.trim());

      // Use the DEK directly as bytes32
      const tx = await contract.registerPatient(
        emergencyDEK || ethers.ZeroHash, // Use generated DEK or zero hash
        surrogate || ethers.ZeroAddress,
        typesArray,
        rolesArray
      );
      await tx.wait();
      alert('Patient registered successfully!');
      loadPatientData();
    } catch (error) {
      console.error('Error registering patient:', error);
      alert('Error registering patient');
    }
  };

  const disableEmergencyAccess = async () => {
    try {
      const tx = await contract.disableEmergencyAccess();
      await tx.wait();
      alert('Emergency access disabled!');
      loadPatientData();
    } catch (error) {
      console.error('Error disabling access:', error);
      alert('Error disabling access');
    }
  };

  if (!isRegistered) {
    return (
      <div className="panel">
        <h2>Patient Registration</h2>
        <div className="form-group">
          <label>Emergency DEK (Decryption Key):</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={emergencyDEK}
              onChange={(e) => setEmergencyDEK(e.target.value)}
              placeholder="Enter your emergency decryption key"
              style={{ flex: 1 }}
            />
            <button onClick={generateDEK} className="secondary-button" style={{ whiteSpace: 'nowrap' }}>
              Generate DEK
            </button>
          </div>
          <small style={{ color: '#666', fontSize: '12px' }}>
            This key enables emergency access to your medical records. Keep it secure!
          </small>
        </div>
        <div className="form-group">
          <label>Surrogate Contact (optional):</label>
          <input
            type="text"
            value={surrogate}
            onChange={(e) => setSurrogate(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>Allowed Emergency Types (comma-separated):</label>
          <input
            type="text"
            value={allowedTypes}
            onChange={(e) => setAllowedTypes(e.target.value)}
            placeholder="cardiac, accident, stroke"
          />
        </div>
        <div className="form-group">
          <label>Allowed Medical Roles (comma-separated):</label>
          <input
            type="text"
            value={allowedRoles}
            onChange={(e) => setAllowedRoles(e.target.value)}
            placeholder="ER_DOCTOR, PARAMEDIC, NURSE"
          />
        </div>
        <button onClick={registerPatient} className="action-button">
          Register as Patient
        </button>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Patient Dashboard</h2>
      <div className="patient-info">
        <p><strong>Emergency Access Enabled:</strong> {patientData?.emergencyAccessEnabled ? 'Yes' : 'No'}</p>
        <p><strong>Surrogate Contact:</strong> {patientData?.surrogateContact !== ethers.ZeroAddress ? patientData?.surrogateContact : 'None'}</p>
        <p><strong>Allowed Types:</strong> {patientData?.allowedEmergencyTypes?.join(', ')}</p>
        <p><strong>Allowed Roles:</strong> {patientData?.allowedRoles?.join(', ')}</p>
      </div>
      {patientData?.emergencyAccessEnabled && (
        <button onClick={disableEmergencyAccess} className="danger-button">
          Disable Emergency Access
        </button>
      )}
    </div>
  );
};

export default PatientPanel;