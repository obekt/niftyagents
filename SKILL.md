---
name: nifty-agents-protocol
version: "1.1.0"
license: MIT
description: A cryptographic protocol for AI agents to mint, sign, verify, and transfer SVG digital assets without a blockchain.
metadata:
  openclaw:
    requires:
      env: []
    files: ["index.ts", "server.ts", "package.json", "tsconfig.json"]
    homepage: "https://github.com/obekt/niftyagents"
---
# 💎 Nifty Agent SVG Protocol (NASP) - Agent Skill Manual

NASP is a cryptographic protocol for creating, signing, and trading SVGs with verifiable provenance—**without a blockchain.**

## 🎯 Objective
Use this skill to mint "Nifty" digital assets, verify their ownership, and securely transfer them to other agents using `did:key` identities.

## 🛠 Setup & Imports
To use this skill in your environment:
```typescript
import {
  generateIdentity,
  signSVG,
  verifySVG,
  transferSVG,
  endorseSVG,
  computeTrustScore
} from './index.js';
```

## 📋 Data Structures

### `AgentIdentity`
```typescript
{
  did: string;        // e.g. "did:key:z6Mk..."
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}
```

### `VerificationResult`
```typescript
{
  isValid: boolean;        // Cryptographic integrity + not expired
  isExpired: boolean;      // True if past expiresAt TTL
  creator: string;         // DID of the original minter
  currentOwner: string;    // DID of the latest owner in the chain
  chain: string[];         // Array of DIDs representing the full history
  endorsements: Endorsement[]; // Verified endorsements only
}
```

### `Endorsement`
```typescript
{
  endorserDID: string;  // Who is vouching
  targetDID: string;    // Who they vouch for (the creator)
  scope: string;        // Domain: "general", "security", "code", etc.
  timestamp: string;    // ISO 8601
  signature: string;    // Ed25519 signature
}
```

## 🕹 Usage Guide

### 1. Generate an Identity
Call this once to create your agent's cryptographic persona. **Store the `secretKey` securely.**
```typescript
const myIdentity = generateIdentity();
```

### 2. Mint & Sign a New SVG
Takes a raw SVG string and returns a "Nifty" SVG with embedded NASP metadata.
```typescript
const rawSVG = `<svg>...</svg>`;
const signedSVG = await signSVG(rawSVG, myIdentity);
```

### 3. Verify an Asset
Always verify an SVG before accepting a trade or performing an action.
```typescript
const audit = await verifySVG(receivedSVG);
if (audit.isValid) {
  console.log(`Current Owner: ${audit.currentOwner}`);
}
```

### 4. Transfer Ownership
Appends a new signed grant to the metadata. This function **throws an error** if:
- The SVG is invalid/tampered.
- You (the signer) are not the `currentOwner` of the asset.
```typescript
const updatedSVG = await transferSVG(currentSVG, myIdentity, targetAgentDID);
```

### 5. Endorse a Creator (Web of Trust)
Build reputation by endorsing the creator of a certificate you trust.
```typescript
const endorsedSVG = await endorseSVG(certSVG, myIdentity, "security");
```

### 6. Compute Trust Score
Check how trusted a DID is based on endorsements across certificates.
```typescript
const audit = await verifySVG(certSVG);
const score = computeTrustScore(audit.endorsements, audit.creator, "security");
// 0 = no endorsements, approaches 1.0 with more unique endorsers
```

### 7. TTL Expiry
Certificates can have an expiration date. After expiry, `verifySVG()` returns `isValid: false, isExpired: true`. The issuer must re-sign to renew.
```typescript
const tempCert = await signSVG(svg, myIdentity, {
    expiresAt: "2026-12-31T23:59:59Z"
});
```
Certificates without `expiresAt` are permanent.

## 🛡 Security Protocol for Agents
1.  **Canonicalization:** The library automatically handles canonicalization using `svgo`. Do not manually edit the SVG content after signing, or the signature will break.
2.  **Private Keys:** Never log, share, or expose your `secretKey`. Treat it as your agent's "soul."
3.  **Audit First:** Never assume an SVG is valid based on its filename. Always run `verifySVG()`.
4.  **Double Spend Detection:** In decentralized environments, if you are presented with two different valid chains for the same asset, the one with the **longest chain** or the **latest timestamp** is typically preferred.
5.  **Endorsement Verification:** Forged endorsements (wrong DID/signature pair) are silently rejected during verification. Only cryptographically valid endorsements appear in the result.
