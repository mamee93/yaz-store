const code128Patterns = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
] as const;

const qrVersion = 4;
const qrSize = 33;
const qrDataCodewords = 80;
const qrEccCodewords = 20;
const qrFormatBitsLevelLMask0 = "111011111000100";

export function getCode128Bars(value: string) {
  const text = value.replace(/[^\x20-\x7e]/g, "?");
  const codes = [104, ...Array.from(text).map((char) => char.charCodeAt(0) - 32)];
  const checksum = codes.reduce((total, code, index) => total + (index === 0 ? code : code * index), 0) % 103;
  const fullCodes = [...codes, checksum, 106];
  const bars: Array<{ x: number; width: number }> = [];
  let x = 0;

  for (const code of fullCodes) {
    const pattern = code128Patterns[code] ?? code128Patterns[0];

    for (let index = 0; index < pattern.length; index += 1) {
      const width = Number(pattern[index]);

      if (index % 2 === 0) {
        bars.push({ x, width });
      }

      x += width;
    }
  }

  return { bars, width: x };
}

export function generateCode128Svg(value: string, height = 64) {
  const quiet = 10;
  const { bars, width } = getCode128Bars(value);
  const viewWidth = width + quiet * 2;
  const rects = bars
    .map((bar) => `<rect x="${bar.x + quiet}" y="0" width="${bar.width}" height="${height}" />`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${height}" role="img" aria-label="Barcode ${escapeXml(
    value
  )}" preserveAspectRatio="none"><rect width="${viewWidth}" height="${height}" fill="#fff"/>${rects}</svg>`;
}

export function createInvoiceQrMatrix(value: string) {
  const text = normalizeQrText(value);
  const data = buildQrDataCodewords(text);
  const ecc = reedSolomon(data, qrEccCodewords);
  const bits = [...data, ...ecc].flatMap((codeword) =>
    codeword.toString(2).padStart(8, "0").split("").map((bit) => bit === "1")
  );
  const modules = Array.from({ length: qrSize }, () => Array<boolean | null>(qrSize).fill(null));
  const reserved = Array.from({ length: qrSize }, () => Array<boolean>(qrSize).fill(false));

  addFinder(modules, reserved, 0, 0);
  addFinder(modules, reserved, qrSize - 7, 0);
  addFinder(modules, reserved, 0, qrSize - 7);
  addTiming(modules, reserved);
  addAlignment(modules, reserved, qrSize - 7, qrSize - 7);
  reserveFormatAreas(reserved);
  setModule(modules, reserved, 8, qrVersion * 4 + 9, true);
  placeQrData(modules, reserved, bits);
  addFormatBits(modules, reserved);

  return modules.map((row) => row.map(Boolean));
}

export function generateQrSvg(value: string, size = 168) {
  const matrix = createInvoiceQrMatrix(value);
  const count = matrix.length;
  const cells = matrix
    .flatMap((row, y) =>
      row.map((isDark, x) => (isDark ? `<rect x="${x}" y="${y}" width="1" height="1" />` : ""))
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${count} ${count}" role="img" aria-label="QR ${escapeXml(
    value
  )}" shape-rendering="crispEdges"><rect width="${count}" height="${count}" fill="#fff"/>${cells}</svg>`;
}

function normalizeQrText(value: string) {
  return value.trim() || "YAZ-INV-000000";
}

function buildQrDataCodewords(value: string) {
  const bits: number[] = [];
  const bytes = Array.from(new TextEncoder().encode(value)).slice(0, 78);

  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);

  for (const byte of bytes) {
    appendBits(bits, byte, 8);
  }

  appendBits(bits, 0, Math.min(4, qrDataCodewords * 8 - bits.length));

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(Number.parseInt(bits.slice(index, index + 8).join(""), 2));
  }

  let pad = 0xec;
  while (codewords.length < qrDataCodewords) {
    codewords.push(pad);
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  return codewords.slice(0, qrDataCodewords);
}

function appendBits(bits: number[], value: number, length: number) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push((value >>> index) & 1);
  }
}

function reedSolomon(data: number[], degree: number) {
  const generator = rsGenerator(degree);
  const result = Array<number>(degree).fill(0);

  for (const byte of data) {
    const factor = byte ^ result.shift()!;
    result.push(0);

    for (let index = 0; index < degree; index += 1) {
      result[index] ^= gfMul(generator[index], factor);
    }
  }

  return result;
}

function rsGenerator(degree: number) {
  let result = [1];

  for (let index = 0; index < degree; index += 1) {
    result = polynomialMultiply(result, [1, gfPow(2, index)]);
  }

  return result.slice(1);
}

function polynomialMultiply(a: number[], b: number[]) {
  const product = Array<number>(a.length + b.length - 1).fill(0);

  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      product[i + j] ^= gfMul(a[i], b[j]);
    }
  }

  return product;
}

function gfPow(value: number, power: number) {
  let result = 1;

  for (let index = 0; index < power; index += 1) {
    result = gfMul(result, value);
  }

  return result;
}

function gfMul(a: number, b: number) {
  let result = 0;

  for (; b > 0; b >>>= 1) {
    if (b & 1) {
      result ^= a;
    }

    a <<= 1;
    if (a & 0x100) {
      a ^= 0x11d;
    }
  }

  return result;
}

function addFinder(modules: Array<Array<boolean | null>>, reserved: boolean[][], x: number, y: number) {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const row = y + dy;
      const col = x + dx;

      if (row < 0 || row >= qrSize || col < 0 || col >= qrSize) {
        continue;
      }

      const isFinder =
        dx >= 0 &&
        dx <= 6 &&
        dy >= 0 &&
        dy <= 6 &&
        (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      modules[row][col] = isFinder;
      reserved[row][col] = true;
    }
  }
}

function addTiming(modules: Array<Array<boolean | null>>, reserved: boolean[][]) {
  for (let index = 8; index < qrSize - 8; index += 1) {
    setModule(modules, reserved, index, 6, index % 2 === 0);
    setModule(modules, reserved, 6, index, index % 2 === 0);
  }
}

function addAlignment(
  modules: Array<Array<boolean | null>>,
  reserved: boolean[][],
  centerX: number,
  centerY: number
) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const x = centerX + dx;
      const y = centerY + dy;
      const isDark = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;

      modules[y][x] = isDark;
      reserved[y][x] = true;
    }
  }
}

function reserveFormatAreas(reserved: boolean[][]) {
  for (let index = 0; index < 9; index += 1) {
    reserved[8][index] = true;
    reserved[index][8] = true;
  }

  for (let index = 0; index < 8; index += 1) {
    reserved[qrSize - 1 - index][8] = true;
    reserved[8][qrSize - 1 - index] = true;
  }
}

function setModule(modules: Array<Array<boolean | null>>, reserved: boolean[][], x: number, y: number, value: boolean) {
  modules[y][x] = value;
  reserved[y][x] = true;
}

function placeQrData(modules: Array<Array<boolean | null>>, reserved: boolean[][], bits: boolean[]) {
  let bitIndex = 0;
  let upward = true;

  for (let col = qrSize - 1; col > 0; col -= 2) {
    if (col === 6) {
      col -= 1;
    }

    for (let offset = 0; offset < qrSize; offset += 1) {
      const row = upward ? qrSize - 1 - offset : offset;

      for (let pair = 0; pair < 2; pair += 1) {
        const x = col - pair;

        if (reserved[row][x]) {
          continue;
        }

        const rawBit = bits[bitIndex] ?? false;
        const maskedBit = rawBit !== ((row + x) % 2 === 0);
        modules[row][x] = maskedBit;
        bitIndex += 1;
      }
    }

    upward = !upward;
  }
}

function addFormatBits(modules: Array<Array<boolean | null>>, reserved: boolean[][]) {
  const bits = qrFormatBitsLevelLMask0.split("").map((bit) => bit === "1");
  const first = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  const second = [
    [qrSize - 1, 8], [qrSize - 2, 8], [qrSize - 3, 8], [qrSize - 4, 8], [qrSize - 5, 8],
    [qrSize - 6, 8], [qrSize - 7, 8], [qrSize - 8, 8], [8, qrSize - 8], [8, qrSize - 7],
    [8, qrSize - 6], [8, qrSize - 5], [8, qrSize - 4], [8, qrSize - 3], [8, qrSize - 2]
  ];

  for (let index = 0; index < bits.length; index += 1) {
    const [x1, y1] = first[index];
    const [x2, y2] = second[index];
    modules[y1][x1] = bits[index];
    modules[y2][x2] = bits[index];
    reserved[y1][x1] = true;
    reserved[y2][x2] = true;
  }
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
