export const JOHN_GBA_STATE_SIZE = 740238;

export class SnapshotMemory {
  private readonly view: DataView;

  constructor(bytes: Uint8Array) {
    if (bytes.byteLength !== JOHN_GBA_STATE_SIZE) {
      throw new Error(`Unsupported John GBA state layout (${bytes.byteLength} bytes).`);
    }
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (this.view.getUint32(0, true) !== 10) {
      throw new Error('Unsupported John GBA state format; expected format 10.');
    }
  }

  private offset(address: number, length: number): number {
    if (!Number.isInteger(address) || !Number.isInteger(length) || length < 0) {
      throw new Error('Invalid memory address or length.');
    }
    if (address >= 0x02000000 && address + length <= 0x02040000) {
      return 0x85DF + address - 0x02000000;
    }
    if (address >= 0x03000000 && address + length <= 0x03008000) {
      return 0x01DF + address - 0x03000000;
    }
    throw new Error(`Invalid RAM range at 0x${address.toString(16)} (${length} bytes).`);
  }

  u8(address: number): number { return this.view.getUint8(this.offset(address, 1)); }
  u16(address: number): number { return this.view.getUint16(this.offset(address, 2), true); }
  u32(address: number): number { return this.view.getUint32(this.offset(address, 4), true); }

  bytes(address: number, length: number): Uint8Array {
    const offset = this.offset(address, length);
    return new Uint8Array(this.view.buffer, this.view.byteOffset + offset, length);
  }

  pointer(address: number, length: number): number {
    const pointer = this.u32(address);
    this.offset(pointer, length);
    return pointer;
  }
}

export async function decompressJohnGbaState(input: Uint8Array): Promise<Uint8Array> {
  if (input[0] !== 0x1F || input[1] !== 0x8B) {
    throw new Error('Expected a gzip-compressed John GBA .jg snapshot, not a .sav or .js preview.');
  }
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser does not support gzip decompression. Use a current browser.');
  }
  const stream = new Blob([new Uint8Array(input)]).stream().pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const result = new Uint8Array(JOHN_GBA_STATE_SIZE);
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.length > result.length) {
        await reader.cancel();
        throw new Error('Decompressed snapshot exceeds the supported John GBA layout.');
      }
      result.set(value, length);
      length += value.length;
    }
  } catch (error) {
    throw new Error(`Could not decompress snapshot: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    reader.releaseLock();
  }
  if (length !== result.length) throw new Error(`Truncated or unsupported snapshot (${length} bytes).`);
  return result;
}
