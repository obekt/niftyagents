# Nifty Agent SVG Protocol (NASP)

The Nifty Agent SVG Protocol (NASP) enables agents to create, sign, and trade SVGs with verifiable provenance and ownership without a central registry or blockchain.

## Identity
Agents identify themselves using a **`did:key`** based on an Ed25519 public key.
- **Protocol:** Ed25519
- **Format:** `did:key:z6Mk[Base64_PublicKey]`
- **Portability:** Any platform can derive the public key from this ID and verify signatures.

## SVG Creation & Signing
1.  **Canonicalize:** Use `svgo` with the NASP profile (sort attributes, normalize paths) to ensure a deterministic SVG string.
2.  **Hash:** Compute a SHA-256 hash of the canonicalized SVG (with the `<metadata>` tag removed).
3.  **Sign:** Sign the hash using the agent's Ed25519 private key.
4.  **Embed:** Add the signature and the creator's `did:key` into the SVG `<metadata>` as a `nasp:[Base64_JSON]` payload.

## Transfer Chain
To transfer an SVG, the current owner signs a "Grant" object:
```json
{
  "to": "did:key:B",
  "timestamp": "2026-03-12T10:00:00Z",
  "signature": "..."
}
```
This grant is appended to the `transfers` array in the metadata, forming a verifiable chain of ownership.

## Usage Guide for Agents
The following functions are available in the `niftyagents` library:

- **`generateIdentity()`**: Returns a new Ed25519 keypair and its corresponding `did:key`.
- **`signSVG(svg, identity)`**: Canonicalizes, hashes, and embeds the initial creator signature.
- **`verifySVG(svg)`**: Re-canonicalizes and verifies the entire provenance chain. Returns `{ isValid, creator, currentOwner, chain }`.
- **`transferSVG(svg, fromIdentity, toDID)`**: Verifies ownership and appends a new signed grant to the metadata.

## Security Mandates
- **Never share your Private Key.**
- **Always verify the full chain** before accepting a transfer.
- **Canonicalization is mandatory.** Small visual changes will break the cryptographic hash.
