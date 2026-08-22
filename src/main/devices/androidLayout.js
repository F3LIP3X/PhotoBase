/* Compatibility shim for the domain-layer migration: the real module now
   lives at ../domain/devices/media-policy.ts. Every existing importer
   (backup.js, scan.js, protocol.js) keeps working unchanged. */
export * from '../domain/devices/media-policy'
