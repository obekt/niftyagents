#!/usr/bin/env npx tsx
/**
 * Re-mint broken certificates that have metadata but no cryptographic signature.
 * Generates a persistent ObekT signing identity, then signs each broken SVG properly.
 */
import { generateIdentity, signSVG, verifySVG, AgentIdentity } from './index.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, chmodSync } from 'fs';
import { join } from 'path';

const VAULT_PATH = join(import.meta.dirname, 'vault', 'obekt_identity.json');
const CERTS_DIR = '/tmp/nasp-certificates/certificates';

function loadOrCreateIdentity(): AgentIdentity {
    if (existsSync(VAULT_PATH)) {
        const data = JSON.parse(readFileSync(VAULT_PATH, 'utf8'));
        return {
            did: data.did,
            publicKey: new Uint8Array(Buffer.from(data.publicKey, 'base64')),
            secretKey: new Uint8Array(Buffer.from(data.secretKey, 'base64')),
        };
    }

    const identity = generateIdentity();
    mkdirSync(join(import.meta.dirname, 'vault'), { recursive: true });
    writeFileSync(VAULT_PATH, JSON.stringify({
        did: identity.did,
        publicKey: Buffer.from(identity.publicKey).toString('base64'),
        secretKey: Buffer.from(identity.secretKey).toString('base64'),
    }, null, 2));
    chmodSync(VAULT_PATH, 0o600);
    console.log(`🔑 New identity created: ${identity.did}`);
    return identity;
}

function extractExistingMetadata(svg: string): Record<string, any> | null {
    const match = svg.match(/<metadata>nasp:(.*?)<\/metadata>/);
    if (!match) return null;
    try {
        return JSON.parse(Buffer.from(match[1], 'base64').toString());
    } catch {
        return null;
    }
}

async function main() {
    const identity = loadOrCreateIdentity();
    console.log(`🔑 Using identity: ${identity.did}\n`);

    const files = readdirSync(CERTS_DIR).filter(f => f.endsWith('.svg'));
    let fixed = 0, skipped = 0, failed = 0;

    for (const file of files) {
        const path = join(CERTS_DIR, file);
        const svg = readFileSync(path, 'utf8');

        // Check if already valid
        try {
            const result = await verifySVG(svg);
            if (result.isValid) {
                console.log(`⏭️  ${file} — already valid, skipping`);
                skipped++;
                continue;
            }
        } catch {
            // Not valid, continue to re-mint
        }

        // Extract existing metadata to preserve it
        const existingMeta = extractExistingMetadata(svg);
        if (!existingMeta) {
            console.log(`⚠️  ${file} — no NASP metadata found, skipping`);
            skipped++;
            continue;
        }

        // Remove version/creator fields that signSVG will set
        const { version, creator, hash, signature, transfers, ...preservedMeta } = existingMeta;

        try {
            const signed = await signSVG(svg, identity, preservedMeta);
            // Verify it actually works
            const verify = await verifySVG(signed);
            if (verify.isValid) {
                writeFileSync(path, signed);
                console.log(`✅ ${file} — re-minted and verified`);
                fixed++;
            } else {
                console.log(`❌ ${file} — re-mint produced invalid cert`);
                failed++;
            }
        } catch (e) {
            console.log(`❌ ${file} — ${(e as Error).message}`);
            failed++;
        }
    }

    console.log(`\n📊 Results: ${fixed} fixed / ${skipped} skipped / ${failed} failed / ${files.length} total`);
}

main().catch(console.error);
