/**
 * NASP Quick Start - Example Usage
 * 
 * Run: npx tsx example_usage.ts
 */

import { generateIdentity, signSVG, verifySVG, transferSVG } from './index.js';
import * as fs from 'fs';

// === 1. Generate Your Identity (do once, save secretKey securely!) ===
console.log('🔑 Generating identity...');
const myIdentity = generateIdentity();
console.log(`DID: ${myIdentity.did}`);
console.log(`⚠️  SAVE THIS SECRET KEY: ${Buffer.from(myIdentity.secretKey).toString('base64')}`);

// === 2. Create a Simple SVG ===
const mySVG = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="#1e293b" rx="20"/>
  <circle cx="200" cy="200" r="80" fill="#22d3ee" opacity="0.8"/>
  <text x="200" y="205" text-anchor="middle" fill="#0f172a" font-size="24" font-weight="bold">
    GENESIS
  </text>
</svg>
`;

// === 3. Mint (Sign) the SVG ===
console.log('\n🎨 Minting SVG...');
const extraMetadata = {
  artifactName: 'My First Nifty Agent Certificate',
  rarity: 'Unique',
  description: 'Proof of achievement',
  mintedAt: new Date().toISOString()
};

const signedSVG = await signSVG(mySVG, myIdentity, extraMetadata);
console.log('✅ SVG minted!');

// Save to file
fs.writeFileSync('my_nifty_asset.svg', signedSVG);
console.log('💾 Saved to: my_nifty_asset.svg');

// === 4. Verify the SVG ===
console.log('\n🔍 Verifying...');
const audit = await verifySVG(signedSVG);
console.log(`Valid: ${audit.isValid}`);
console.log(`Creator: ${audit.creator}`);
console.log(`Current Owner: ${audit.currentOwner}`);
console.log(`Metadata: ${JSON.stringify(audit.metadata, null, 2)}`);

// === 5. Transfer to Another Agent ===
console.log('\n🔄 Creating transfer...');
const recipientDID = 'did:key:z6MkExampleRecipient123456789';

// Generate a second identity to simulate recipient
const recipientIdentity = generateIdentity();
console.log(`Recipient DID: ${recipientIdentity.did}`);

const transferredSVG = await transferSVG(signedSVG, myIdentity, recipientIdentity.did);
console.log('✅ Transfer complete!');

// Verify the transferred SVG
const transferAudit = await verifySVG(transferredSVG);
console.log(`New Owner: ${transferAudit.currentOwner}`);
console.log(`Chain: ${transferAudit.chain.join(' -> ')}`);

fs.writeFileSync('transferred_asset.svg', transferredSVG);
console.log('💾 Saved to: transferred_asset.svg');

console.log('\n🎉 Done! Check the SVG files to see the embedded metadata.');
