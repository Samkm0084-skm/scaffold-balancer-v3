import hre from "hardhat";
import { networkConfig } from "../helper.config";
import { Contract } from "ethers";

/**
 * registerPool function
 * https://github.com/balancer/balancer-v3-monorepo/blob/2ad8501c85e8afb2f25d970344af700a571b1d0b/pkg/vault/contracts/VaultExtension.sol#L130-L149
 *
 * VaultTypes (TokenType, TokenConfig, IRateProvider)
 * https://github.com/balancer/balancer-v3-monorepo/blob/main/pkg/interfaces/contracts/vault/VaultTypes.sol
 *
 */
async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.log("🚫️ Please set a PRIVATE_KEY var at packages/hardhat/.env");
    return;
  }
  if (hre.network.name !== "sepolia") {
    throw new Error("This script is only configured for sepolia network");
  }
  const chainId = Number(await hre.ethers.provider.getNetwork().then(network => network.chainId));

  // grab the VaultExtension contract
  const { vaultExtensionAddr } = networkConfig[chainId].balancer;
  const { abi: vaultExtensionAbi } = await hre.artifacts.readArtifact("IVaultExtension");
  const [signer] = await hre.ethers.getSigners();
  const vaultExtension = await hre.ethers.getContractAt(vaultExtensionAbi, vaultExtensionAddr, signer);

  // args for registerPool
  const { target: poolAddress } = await hre.ethers.getContract<Contract>("ConstantPricePool", signer);
  const tokenConfig = [
    {
      token: "0xB77EB1A70A96fDAAeB31DB1b42F2b8b5846b2613", // sepoliaDAI
      tokenType: 0, // STANDARD
      rateProvider: "0x0000000000000000000000000000000000000000", // https://docs-v3.balancer.fi/reference/contracts/rate-providers.html#none-of-the-assets
      yieldFeeExempt: false,
    },
    {
      token: "0x80D6d3946ed8A1Da4E226aa21CCdDc32bd127d1A", // sepoliaUSDC
      tokenType: 0, // STANDARD
      rateProvider: "0x0000000000000000000000000000000000000000", // https://docs-v3.balancer.fi/reference/contracts/rate-providers.html#none-of-the-assets
      yieldFeeExempt: false,
    },
  ];
  // The timestamp after which it is no longer possible to pause the pool
  const pauseWindowEndTime = 0;
  // Optional contract the Vault will allow to pause the pool
  const pauseManager = hre.ethers.ZeroAddress;
  // Flags indicating which hooks the pool supports
  const hookConfig = {
    shouldCallBeforeInitialize: false,
    shouldCallAfterInitialize: false,
    shouldCallBeforeSwap: false,
    shouldCallAfterSwap: false,
    shouldCallBeforeAddLiquidity: false,
    shouldCallAfterAddLiquidity: false,
    shouldCallBeforeRemoveLiquidity: false,
    shouldCallAfterRemoveLiquidity: false,
  };
  const liquidityManagement = {
    supportsAddLiquidityCustom: false,
    supportsRemoveLiquidityCustom: false,
  };

  console.log("Sending tx to register pool...");
  const txResponse = await vaultExtension.registerPool(
    poolAddress,
    tokenConfig,
    pauseWindowEndTime,
    pauseManager,
    hookConfig,
    liquidityManagement,
  );
  console.log(txResponse);
  console.log("Waiting for tx to be mined...");
  const txReceipt = await txResponse.wait();
  console.log("Pool registered!!!");
  console.log(txReceipt);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});