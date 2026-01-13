import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("SimpleStorage", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  it("Should set deployer as owner on deployment", async function () {
    const [deployer] = await viem.getWalletClients();
    const simpleStorage = await viem.deployContract("SimpleStorage");

    const owner = await simpleStorage.read.owner();
    assert.equal(owner.toLowerCase(), deployer.account.address.toLowerCase());
  });

  it("Should emit OwnerSet event on deployment", async function () {
    const [deployer] = await viem.getWalletClients();
    const simpleStorage = await viem.deployContract("SimpleStorage");
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    const events = await publicClient.getContractEvents({
      address: simpleStorage.address,
      abi: simpleStorage.abi,
      eventName: "OwnerSet",
      fromBlock: deploymentBlockNumber - 1n,
      strict: true,
    });

    assert.ok(events.length > 0, "OwnerSet event should be emitted");
    assert.equal(
      events[0].args.newOwner.toLowerCase(),
      deployer.account.address.toLowerCase()
    );
  });

  it("Should have initial value of 0", async function () {
    const simpleStorage = await viem.deployContract("SimpleStorage");

    const value = await simpleStorage.read.getValue();
    assert.equal(value, 0n);
  });

  it("Should emit ValueUpdated event when calling setValue", async function () {
    const simpleStorage = await viem.deployContract("SimpleStorage");

    await viem.assertions.emitWithArgs(
      simpleStorage.write.setValue([42n]),
      simpleStorage,
      "ValueUpdated",
      [0n, 42n]
    );
  });

  it("Should update stored value when calling setValue", async function () {
    const simpleStorage = await viem.deployContract("SimpleStorage");

    await simpleStorage.write.setValue([100n]);
    const value = await simpleStorage.read.getValue();

    assert.equal(value, 100n);
  });

  it("Should allow multiple setValue calls with correct events", async function () {
    const simpleStorage = await viem.deployContract("SimpleStorage");
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    // Set value multiple times
    await simpleStorage.write.setValue([10n]);
    await simpleStorage.write.setValue([20n]);
    await simpleStorage.write.setValue([30n]);

    const events = await publicClient.getContractEvents({
      address: simpleStorage.address,
      abi: simpleStorage.abi,
      eventName: "ValueUpdated",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    assert.equal(events.length, 3, "Should have 3 ValueUpdated events");

    // Check final value
    const finalValue = await simpleStorage.read.getValue();
    assert.equal(finalValue, 30n);
  });

  it("Should allow owner to transfer ownership", async function () {
    const [owner, newOwner] = await viem.getWalletClients();
    const simpleStorage = await viem.deployContract("SimpleStorage");
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    // Transfer ownership
    await simpleStorage.write.transferOwnership([newOwner.account.address]);

    // Check event was emitted
    const events = await publicClient.getContractEvents({
      address: simpleStorage.address,
      abi: simpleStorage.abi,
      eventName: "OwnerSet",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    // Find the transfer event (not the deployment one)
    const transferEvent = events.find(
      (e) =>
        e.args.oldOwner.toLowerCase() === owner.account.address.toLowerCase()
    );

    assert.ok(transferEvent, "OwnerSet event should be emitted on transfer");
    assert.equal(
      transferEvent.args.newOwner.toLowerCase(),
      newOwner.account.address.toLowerCase()
    );

    // Verify ownership changed
    const currentOwner = await simpleStorage.read.owner();
    assert.equal(
      currentOwner.toLowerCase(),
      newOwner.account.address.toLowerCase()
    );
  });

  it("Should revert when non-owner tries to transfer ownership", async function () {
    const [, nonOwner] = await viem.getWalletClients();
    const simpleStorage = await viem.deployContract("SimpleStorage");

    // Get contract instance connected to non-owner
    const simpleStorageAsNonOwner = await viem.getContractAt(
      "SimpleStorage",
      simpleStorage.address,
      { client: { wallet: nonOwner } }
    );

    await assert.rejects(
      simpleStorageAsNonOwner.write.transferOwnership([nonOwner.account.address]),
      /Not owner/
    );
  });

  it("Should revert when transferring ownership to zero address", async function () {
    const simpleStorage = await viem.deployContract("SimpleStorage");

    await assert.rejects(
      simpleStorage.write.transferOwnership([
        "0x0000000000000000000000000000000000000000",
      ]),
      /New owner is zero address/
    );
  });
});
