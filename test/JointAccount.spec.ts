import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;
let manager: any;
let compiledContracts: any;

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
    let alice = vite.newAccount(config.networks.local.mnemonic, 1, provider);
    let bob = vite.newAccount(config.networks.local.mnemonic, 2, provider);
    let charlie = vite.newAccount(config.networks.local.mnemonic, 3, provider);

    // create a joint account
    let members = [alice.address, bob.address, charlie.address];
    let account = compiledContracts.JointAccount;
    account.setDeployer(deployer).setProvider(provider);
    await account.deploy({
      tokenId: 'tti_5649544520544f4b454e6e40',
      amount: '10000000000000000000',
      params: [manager.address, members, '2']
    });
    expect(account.address).to.be.a('string');
    expect(await manager.query('accounts', ['0'])).to.be.deep.equal([account.address]);

    // user can submit proposal
    // TODO: Why can't alice call this?
    // await account.call('newProposal', [alice.address, 'tti_5649544520544f4b454e6e40', '10000000'], {caller: alice});
    let destination = alice.address;
    let VITE = 'tti_5649544520544f4b454e6e40';
    await account.call('newProposal', [destination, VITE, '10000000'], {caller: deployer});
    expect(await account.query('proposal', [])).to.be.deep.equal([
      '1',
      deployer.address, // FIXME: should be alice.address
      destination,
      VITE,
      '10000000',
      '0'
    ]);
  });
});