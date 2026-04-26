import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EmergencyAccessModule = buildModule("EmergencyAccessModule", (m) => {
  const emergencyAccess = m.contract("EmergencyAccess");

  return { emergencyAccess };
});

export default EmergencyAccessModule;