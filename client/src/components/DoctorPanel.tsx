import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface DoctorPanelProps {
  contract: ethers.Contract;
  account: string;
}

interface AccessLog {
  doctor: string;
  patient: string;
  emergencyType: string;
  timestamp: number;
  expiresAt: number;
  justificationSubmitted: boolean;
  flaggedForEthicsReview: boolean;
}

const DoctorPanel: React.FC<DoctorPanelProps> = ({ contract, account }) => {
  const [doctorData, setDoctorData] = useState<any>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [selectedLogIndex, setSelectedLogIndex] = useState<number | null>(null);
  const [justification, setJustification] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [emergencyType, setEmergencyType] = useState('');

  useEffect(() => {
    loadDoctorData();
    loadAccessLogs();
  }, [contract, account]);

  const loadDoctorData = async () => {
    try {
      const doctor = await contract.doctors(account);
      setDoctorData(doctor);
    } catch (error) {
      console.error('Error loading doctor data:', error);
    }
  };

  const loadAccessLogs = async () => {
    try {
      const logCount = await contract.getLogCount();
      const logs: AccessLog[] = [];

      for (let i = 0; i < logCount; i++) {
        const log = await contract.getAccessLog(i);
        logs.push(log);
      }

      // Filter logs for this doctor
      const doctorLogs = logs.filter(log => log.doctor.toLowerCase() === account.toLowerCase());
      setAccessLogs(doctorLogs);
    } catch (error) {
      console.error('Error loading access logs:', error);
    }
  };

  const requestEmergencyAccess = async () => {
    try {
      const tx = await contract.requestEmergencyAccess(patientAddress, emergencyType);
      const receipt = await tx.wait();

      // Check if access was granted or denied
      const grantedEvent = receipt.logs.find((log: any) =>
        log.topics[0] === ethers.id("EmergencyAccessGranted(address,address,string,uint256,uint256)")
      );
      const deniedEvent = receipt.logs.find((log: any) =>
        log.topics[0] === ethers.id("EmergencyAccessDenied(address,address,string,uint256)")
      );

      if (grantedEvent) {
        alert('Emergency access granted! DEK has been released.');
      } else if (deniedEvent) {
        alert('Emergency access denied. Check the reason in transaction logs.');
      }

      loadAccessLogs();
    } catch (error: any) {
      console.error('Error requesting access:', error);
      alert(`Error: ${error.reason || error.message}`);
    }
  };

  const submitJustification = async () => {
    if (selectedLogIndex === null) return;

    try {
      const tx = await contract.submitJustification(selectedLogIndex);
      await tx.wait();
      alert('Justification submitted successfully!');
      setJustification('');
      setSelectedLogIndex(null);
      loadAccessLogs();
    } catch (error) {
      console.error('Error submitting justification:', error);
      alert('Error submitting justification');
    }
  };

  const triggerEthicsReview = async (logIndex: number) => {
    try {
      const tx = await contract.triggerEthicsReview(logIndex);
      await tx.wait();
      alert('Ethics review triggered!');
      loadAccessLogs();
    } catch (error) {
      console.error('Error triggering ethics review:', error);
      alert('Error triggering ethics review');
    }
  };

  if (!doctorData?.registered) {
    return (
      <div className="panel">
        <h2>Doctor Registration Required</h2>
        <p>You need to be attested by a verified hospital to use this system.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Doctor Dashboard</h2>
      <div className="doctor-info">
        <p><strong>Role:</strong> {doctorData.role}</p>
        <p><strong>Hospital:</strong> {doctorData.attestingHospital}</p>
      </div>

      <div className="section">
        <h3>Request Emergency Access</h3>
        <div className="form-group">
          <label>Patient Address:</label>
          <input
            type="text"
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>Emergency Type:</label>
          <input
            type="text"
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value)}
            placeholder="cardiac, accident, etc."
          />
        </div>
        <button onClick={requestEmergencyAccess} className="action-button">
          Request Emergency Access
        </button>
      </div>

      <div className="section">
        <h3>Your Access Logs</h3>
        {accessLogs.length === 0 ? (
          <p>No access logs found.</p>
        ) : (
          <div className="logs-list">
            {accessLogs.map((log, index) => (
              <div key={index} className="log-item">
                <p><strong>Patient:</strong> {log.patient}</p>
                <p><strong>Type:</strong> {log.emergencyType}</p>
                <p><strong>Time:</strong> {new Date(log.timestamp * 1000).toLocaleString()}</p>
                <p><strong>Expires:</strong> {new Date(log.expiresAt * 1000).toLocaleString()}</p>
                <p><strong>Justified:</strong> {log.justificationSubmitted ? 'Yes' : 'No'}</p>
                <p><strong>Flagged:</strong> {log.flaggedForEthicsReview ? 'Yes' : 'No'}</p>

                {!log.justificationSubmitted && Date.now() / 1000 < log.expiresAt + 24 * 60 * 60 && (
                  <div className="justification-section">
                    <button onClick={() => setSelectedLogIndex(index)} className="action-button">
                      Submit Justification
                    </button>
                    {selectedLogIndex === index && (
                      <div className="justification-form">
                        <textarea
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          placeholder="Please provide detailed justification for this emergency access..."
                          rows={4}
                          className="justification-input"
                        />
                        <div className="button-group">
                          <button onClick={submitJustification} className="action-button">
                            Submit
                          </button>
                          <button onClick={() => { setSelectedLogIndex(null); setJustification(''); }} className="cancel-button">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!log.justificationSubmitted && Date.now() / 1000 > log.timestamp + 24 * 60 * 60 && !log.flaggedForEthicsReview && (
                  <button onClick={() => triggerEthicsReview(index)} className="danger-button">
                    Flag for Ethics Review
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPanel;