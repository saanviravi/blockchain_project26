import hre from "hardhat";

/**
 * Deployment script for EmergencyAccess contract
 * Network: Polygon Amoy testnet
 * Run: npx hardhat run scripts/deploy.ts --network amoy
 */
async function main() {
  const network = await hre.network.connect();
  const ethers = network.ethers;

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  console.log("\nDeploying EmergencyAccess contract...");
  const Factory = await ethers.getContractFactory("EmergencyAccess");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  console.log("\n========================================");
  console.log("CONTRACT DEPLOYED SUCCESSFULLY");
  console.log("========================================");
  console.log("Contract address:", contractAddress);
  console.log("Transaction hash:", deployTx?.hash);
  console.log("Network:          Polygon Amoy Testnet");
  console.log("Explorer URL:     https://amoy.polygonscan.com/address/" + contractAddress);
  console.log("========================================");
  console.log("\nPaste the contract address and tx hash into Section 7.4 of your paper.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
