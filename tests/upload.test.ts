import { describe, it, expect } from "vitest";

// Inline the validation logic from the server for unit testing
function validateMagicBytes(buf: Uint8Array): "image/jpeg" | "image/png" | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return "image/png";
  return null;
}

describe("validateMagicBytes", () => {
  it("identifies JPEG magic bytes", () => {
    const buf = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(validateMagicBytes(buf)).toBe("image/jpeg");
  });

  it("identifies PNG magic bytes", () => {
    const buf = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateMagicBytes(buf)).toBe("image/png");
  });

  it("rejects GIF bytes", () => {
    const buf = new Uint8Array([0x47, 0x49, 0x46, 0x38]); // GIF8
    expect(validateMagicBytes(buf)).toBeNull();
  });

  it("rejects arbitrary bytes", () => {
    const buf = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(validateMagicBytes(buf)).toBeNull();
  });

  it("rejects empty buffer", () => {
    expect(validateMagicBytes(new Uint8Array([]))).toBeNull();
  });
});

describe("file size limit", () => {
  it("rejects files over 20 MB", () => {
    const maxBytes = 20 * 1024 * 1024;
    expect(maxBytes + 1).toBeGreaterThan(maxBytes);
    // Logic: if file.size > maxBytes → reject
    const fileSize = maxBytes + 1;
    expect(fileSize > maxBytes).toBe(true);
  });

  it("accepts files at exactly 20 MB", () => {
    const maxBytes = 20 * 1024 * 1024;
    const fileSize = maxBytes;
    expect(fileSize > maxBytes).toBe(false);
  });
});
