import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;
let jointAccount: any;

describe('test JointAccount', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);

    // compile
    const compiledContracts = await vite.compile('JointAccount.solpp');
    expect(compiledContracts).to.have.property('JointAccount');

    // deploy
    jointAccount = compiledContracts.JointAccount;
    jointAccount.setDeployer(deployer).setProvider(provider);
    await jointAccount.deploy({});
    expect(jointAccount.address).to.be.a('string');
  });

  it('creates a joint account', async () => {
    let alice = vite.newAccount(config.networks.local.mnemonic, 1);
    let bob = vite.newAccount(config.networks.local.mnemonic, 2);
    let charlie = vite.newAccount(config.networks.local.mnemonic, 3);

    // create a joint account
    let members = [alice.address, bob.address, charlie.address];
    await jointAccount.call('create', ['2', members], {caller: deployer});

    // verify the account
    expect(await jointAccount.query('accounts', ['0'])).to.be.deep.equal(['2']);
    expect(await jointAccount.query('getMembers', ['0'])).to.be.deep.equal([members]);
  });
});