import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;
let manager: any;
let compiledContracts: any;

const VITE = 'tti_5649544520544f4b454e6e40';

describe('test JointAccount', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0, provider);

    // compile
    compiledContracts = await vite.compile('JointAccount.solpp');
    expect(compiledContracts).to.have.property('JointAccountManager');
    expect(compiledContracts).to.have.property('JointAccount');

    // deploy manager only
    manager = compiledContracts.JointAccountManager;
    manager.setDeployer(deployer).setProvider(provider);
    await manager.deploy({});
    expect(manager.address).to.be.a('string');
  });

  it('creates a joint account', async () => {
    // create user accounts
    let alice = vite.newAccount(config.networks.local.mnemonic, 1, provider);
    let bob = vite.newAccount(config.networks.local.mnemonic, 2, provider);
    let charlie = vite.newAccount(config.networks.local.mnemonic, 3, provider);
    let dave = vite.newAccount(config.networks.local.mnemonic, 4, provider);

    await deployer.sendToken(alice.address, '10000000');
    await deployer.sendToken(bob.address, '10000000');
    await deployer.sendToken(charlie.address, '10000000');
    await alice.receiveAll();
    await bob.receiveAll();
    await charlie.receiveAll();

    // create a joint account
    const members = [alice.address, bob.address, charlie.address];
    let account = compiledContracts.JointAccount;

    account.setDeployer(deployer).setProvider(provider);
    await account.deploy({
      tokenId: VITE,
      amount: '1234',
      params: [manager.address, members, '2']
    });
    expect(account.address).to.be.a('string');
    expect(await manager.query('accounts', ['0'])).to.be.deep.equal([account.address]);

    // member can submit proposal
    let destination = dave.address;
    const proposalAmount = '1234';
    await account.call('newProposal', [destination, VITE, proposalAmount], {caller: alice});
    expect(await account.query('proposal', [])).to.be.deep.equal([
      '1',
      alice.address,
      destination,
      VITE,
      proposalAmount,
      '0'
    ]);

    // non-member cannot submit proposal
    await account.call('newProposal', [deployer.address, VITE, proposalAmount], {caller: deployer});
    expect(await account.query('proposal', [])).to.be.deep.equal([
      '1',
      alice.address,
      destination,
      VITE,
      proposalAmount,
      '0'
    ]);

    // member can vote
    await account.call('voteOnProposal', [], {caller: alice});
    expect(await account.query('proposal', [])).to.be.deep.equal([
      '1',
      alice.address,
      destination,
      VITE,
      proposalAmount,
      '1'
    ]);

    // ...but only once
    await account.call('voteOnProposal', [], {caller: alice});
    expect(await account.query('proposal', [])).to.be.deep.equal([
      '1',
      alice.address,
      destination,
      VITE,
      proposalAmount,
      '1'
    ]);

    // non-member cannot vote
    await account.call('voteOnProposal', [], {caller: deployer});
    expect(await account.query('proposal', [])).to.be.deep.equal([
      '1',
      alice.address,
      destination,
      VITE,
      proposalAmount,
      '1'
    ]);

    // Final approval vote
    await account.call('voteOnProposal', [], {caller: bob});
    expect(await account.query('proposal', [])).to.be.deep.equal([
      '1',
      alice.address,
      destination,
      VITE,
      proposalAmount,
      '2',
    ]);

    // Now Dave has his money
    await dave.receiveAll();
    expect(await dave.balance()).to.be.equal(proposalAmount);
    expect(await account.balance()).to.be.equal('0');

    // Try a new proposal, but there are no funds, so it should revert
    await account.call('newProposal', [destination, VITE, "5678"], {caller: alice});
    expect(await account.query('proposal', [])).to.be.deep.equal([
      '1',
      alice.address,
      destination,
      VITE,
      proposalAmount,
      '2'
    ]);
  });
});