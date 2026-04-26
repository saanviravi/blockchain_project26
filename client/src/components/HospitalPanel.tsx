import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface HospitalPanelProps {
  contract: ethers.Contract;
  account: string;
}

const HospitalPanel: React.FC<HospitalPanelProps> = ({ contract, account }) => {
  const [hospitalData, setHospitalData] = useState<any>(null);
  const [doctorAddress, setDoctorAddress] = useState('');
  const [doctorRole, setDoctorRole] = useState('');

  useEffect(() => {
    loadHospitalData();
  }, [contract, account]);

  const loadHospitalData = async () => {
    try {
      const hospital = await contract.hospitals(account);
      setHospitalData(hospital);
    } catch (error) {
      console.error('Error loading hospital data:', error);
    }
  };

  const attestDoctor = async () => {
    try {
      const tx = await contract.attestDoctor(doctorAddress, doctorRole);
      await tx.wait();
      alert('Doctor attested successfully!');
      setDoctorAddress('');
      setDoctorRole('');
    } catch (error) {
      console.error('Error attesting doctor:', error);
      alert('Error attesting doctor');
    }
  };

  if (!hospitalData?.verified) {
    return (
      <div className="panel">
        <h2>Hospital Registration Required</h2>
        <p>Your hospital needs to be registered by the admin to use this system.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Hospital Dashboard</h2>
      <div className="hospital-info">
        <p><strong>Hospital Name:</strong> {hospitalData.name}</p>
        <p><strong>Address:</strong> {account}</p>
      </div>

      <div className="section">
        <h3>Attest Doctor</h3>
        <div className="form-group">
          <label>Doctor Address:</label>
          <input
            type="text"
            value={doctorAddress}
            onChange={(e) => setDoctorAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>Doctor Role:</label>
          <input
            type="text"
            value={doctorRole}
            onChange={(e) => setDoctorRole(e.target.value)}
            placeholder="ER_DOCTOR, PARAMEDIC, etc."
          />
        </div>
        <button onClick={attestDoctor} className="action-button">
          Attest Doctor
        </button>
      </div>
    </div>
  );
};

export default HospitalPanel;