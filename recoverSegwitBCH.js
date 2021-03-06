/**
 * This script helps a bitgo employee construct a recovery transaction for BCH sent to a BTC segwit address
 */


const utxo = require('bitgo-utxo-lib');
const fs = require('fs');
const _ = require('lodash');
const reverse = require("buffer-reverse")
const fee = 10000;
let txDetails = JSON.parse(fs.readFileSync(process.argv[2]));
let addressDetails = JSON.parse(fs.readFileSync(process.argv[3]));
const destinationAddress = process.argv[4]
const net = process.argv.length >= 6 ? process.argv[5] : 'prod';

const network = net === 'test' ? utxo.networks.bitcoincashTestnet : utxo.networks.bitcoincash;
const chain = addressDetails.chain;
const index = addressDetails.index;
const txid = txDetails.id;

let vin = -1;
let vinAmount = -1;

// now find the correct output
txDetails.outputs.forEach((output, index) => {
  if (output.address === addressDetails.address) {
    vin = index;
    vinAmount = output.valueString;
  }
});

if (vin === -1) {
  throw Error('Address not found in transaction details')
}

const outAmount = vinAmount - fee;
const txb = new utxo.TransactionBuilder(network);
txb.addInput(txid, vin);
const redeemScript = addressDetails.coinSpecific.redeemScript;
const scriptPubKey = utxo.script.scriptHash.output.encode(utxo.crypto.hash160(redeemScript));
const rsHex = redeemScript.toString('hex')
const rsHexLength = rsHex.length/2;
const lengthHex = (rsHexLength).toString('16');
txb.addOutput(destinationAddress, outAmount);
const tx = txb.buildIncomplete();
tx.setInputScript(0, Buffer.from(lengthHex + rsHex, 'hex'));

console.log(tx.toHex());

