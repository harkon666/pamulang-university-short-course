import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SimpleStorageModule", (m) => {
  // Deploy SimpleStorage contract
  // Constructor tidak memerlukan parameter
  // Owner akan otomatis di-set ke deployer address
  const simpleStorage = m.contract("SimpleStorage");

  return { simpleStorage };
});
