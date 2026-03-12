import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
const { decodeUTF8, encodeUTF8 } = naclUtil;
import { optimize } from 'svgo';
import * as crypto from 'crypto';
import base64 from 'base64-js';

// --- Types ---

export interface AgentIdentity {
    did: string;
    publicKey: Uint8Array;
    secretKey: Uint8Array;
}

export interface VerificationResult {
    isValid: boolean;
    creator: string;
    currentOwner: string;
    chain: string[];
}

// --- Constants & Helpers ---

const DID_PREFIX = 'did:key:z6Mk'; // Roughly Ed25519 prefix

const SVGO_CONFIG = {
    plugins: [
        'preset-default',
        'sortAttrs',
        {
            name: 'convertPathData',
            params: {
                noSpaceAfterFlags: true,
                floatPrecision: 2
            }
        }
    ]
};

function toBase64(arr: Uint8Array): string {
    return base64.fromByteArray(arr);
}

function fromBase64(str: string): Uint8Array {
    const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
    return base64.toByteArray(padded);
}

// --- Core Logic ---

export function generateIdentity(): AgentIdentity {
    const keyPair = nacl.sign.keyPair();
    // In a real did:key implementation, we would use multicodec/multibase.
    // Here we use a simplified version for our platform.
    const did = DID_PREFIX + toBase64(keyPair.publicKey).replace(/=/g, '');
    return {
        did,
        publicKey: keyPair.publicKey,
        secretKey: keyPair.secretKey
    };
}

export async function canonicalizeSVG(svg: string): Promise<string> {
    const result = optimize(svg, SVGO_CONFIG);
    return result.data;
}

export function computeHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

export async function signSVG(svg: string, identity: AgentIdentity): Promise<string> {
    const canonical = await canonicalizeSVG(svg);
    const hash = computeHash(canonical);
    const signature = nacl.sign.detached(decodeUTF8(hash), identity.secretKey);
    
    const metadata = {
        creator: identity.did,
        hash: hash,
        signature: toBase64(signature),
        transfers: []
    };

    const metadataStr = JSON.stringify(metadata);
    const metadataBase64 = base64.fromByteArray(decodeUTF8(metadataStr));

    // Embed in <metadata> tag
    if (svg.includes('<metadata>')) {
        return svg.replace(/<metadata>[\s\S]*?<\/metadata>/, `<metadata>nasp:${metadataBase64}</metadata>`);
    } else {
        return svg.replace(/<svg(.*?)>/, `<svg$1>\n<metadata>nasp:${metadataBase64}</metadata>`);
    }
}

export async function verifySVG(svg: string): Promise<VerificationResult> {
    const metadataMatch = svg.match(/<metadata>nasp:(.*?)<\/metadata>/);
    if (!metadataMatch) {
        throw new Error('No NASP metadata found');
    }

    const metadataStr = encodeUTF8(fromBase64(metadataMatch[1]));
    const metadata = JSON.parse(metadataStr);

    const canonical = await canonicalizeSVG(svg.replace(/<metadata>[\s\S]*?<\/metadata>/, ''));
    const hash = computeHash(canonical);

    if (hash !== metadata.hash) {
        return { isValid: false, creator: metadata.creator, currentOwner: '', chain: [] };
    }

    // Verify creator signature
    // Extract public key from DID (simplified)
    const creatorPubKeyStr = metadata.creator.replace(DID_PREFIX, '');
    const creatorPubKey = fromBase64(creatorPubKeyStr);
    
    const isValidCreator = nacl.sign.detached.verify(
        decodeUTF8(hash),
        fromBase64(metadata.signature),
        creatorPubKey
    );

    if (!isValidCreator) {
        return { isValid: false, creator: metadata.creator, currentOwner: '', chain: [] };
    }

    // Verify transfer chain (if any)
    let currentOwner = metadata.creator;
    const chain = [metadata.creator];

    for (const transfer of metadata.transfers) {
        const ownerPubKeyStr = currentOwner.replace(DID_PREFIX, '');
        const ownerPubKey = fromBase64(ownerPubKeyStr);
        
        const transferPayload = `${hash}:${transfer.to}:${transfer.timestamp}`;
        const isValidTransfer = nacl.sign.detached.verify(
            decodeUTF8(transferPayload),
            fromBase64(transfer.signature),
            ownerPubKey
        );

        if (!isValidTransfer) {
            return { isValid: false, creator: metadata.creator, currentOwner, chain };
        }
        currentOwner = transfer.to;
        chain.push(currentOwner);
    }

    return {
        isValid: true,
        creator: metadata.creator,
        currentOwner: currentOwner,
        chain: chain
    };
}

export async function transferSVG(svg: string, fromIdentity: AgentIdentity, toDID: string): Promise<string> {
    const verification = await verifySVG(svg);
    if (!verification.isValid) {
        throw new Error('Cannot transfer an invalid or tampered SVG');
    }
    if (verification.currentOwner !== fromIdentity.did) {
        throw new Error(`Ownership mismatch: ${fromIdentity.did} is not the current owner (${verification.currentOwner})`);
    }

    const metadataMatch = svg.match(/<metadata>nasp:(.*?)<\/metadata>/);
    if (!metadataMatch) throw new Error('No NASP metadata found');

    const metadataStr = encodeUTF8(fromBase64(metadataMatch[1]));
    const metadata = JSON.parse(metadataStr);

    const timestamp = new Date().toISOString();
    const transferPayload = `${metadata.hash}:${toDID}:${timestamp}`;
    const signature = nacl.sign.detached(decodeUTF8(transferPayload), fromIdentity.secretKey);

    metadata.transfers.push({
        to: toDID,
        timestamp,
        signature: toBase64(signature)
    });

    const newMetadataStr = JSON.stringify(metadata);
    const newMetadataBase64 = base64.fromByteArray(decodeUTF8(newMetadataStr));

    return svg.replace(/<metadata>nasp:(.*?)<\/metadata>/, `<metadata>nasp:${newMetadataBase64}</metadata>`);
}
