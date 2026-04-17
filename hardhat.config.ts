import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

// Load environment variables from your .env file
dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
<<<<<<< Updated upstream
    // --> THIS IS YOUR NEW POLYGON AMOY SETUP <--
    amoy: {
      type: "http",
=======
    sepolia: {
 +-----------------------------------------+
|       PRESCRIPTION MANAGEMENT           |
+-----------------------------------------+
1. List All Prescriptions
2. View Prescription Details
3. View Active Prescriptions
4. Create New Prescription
5. Discontinue Prescription
6. Controlled Substances Report
0. Back to Main

Select option: 4

*** New Prescription ***

Patient ID: 1
Provider ID: 1
Medication ID: 1
Date Written (YYYY-MM-DD): 2000-04-01
Dosage: 10
Frequency: 10
Quantity: 1
Refills: 1
controlled substance? (yes/no): yes
DEA Schedule (e.g. Schedule II): 20
must be one of: Schedule I, Schedule II, Schedule III, Schedule IV, Schedule V
Try again: II   	
must be one of: Schedule I, Schedule II, Schedule III, Schedule IV, Schedule V
Try again: Schedule I
Prescriber DEA Number: 10
wrong format, needs to be 2 letters then 7 digits like AB1234563
DEA Number: AB1234563

created, ID: 162

Press Enter...

+-----------------------------------------+
|       PRESCRIPTION MANAGEMENT           |
+-----------------------------------------+
1. List All Prescriptions
2. View Prescription Details
3. View Active Prescriptions
4. Create New Prescription
5. Discontinue Prescription
6. Controlled Substances Report
0. Back to Main

Select option:      type: "http",
>>>>>>> Stashed changes
      chainType: "l1",
      url: process.env.AMOY_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
});
