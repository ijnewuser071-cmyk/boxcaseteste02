const PIX_KEY = "+5584998183970";
const MERCHANT_NAME = "JOAO PAULO ROCHA SOUSA SANTOS";
const MERCHANT_CITY = "MOSSORO";

function normalize(value: string, maxLength: number) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 $%*+\-./:]/g, "").toUpperCase().slice(0, maxLength);
}

function tlv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

export function createPixPayload({ amount, txid }: { amount: number; txid: string }) {
  const merchantAccount = tlv("00", "br.gov.bcb.pix") + tlv("01", PIX_KEY);
  const additionalData = tlv("05", normalize(txid || "***", 25));
  const withoutCrc = [
    tlv("00", "01"),
    tlv("26", merchantAccount),
    tlv("52", "0000"),
    tlv("53", "986"),
    tlv("54", amount.toFixed(2)),
    tlv("58", "BR"),
    tlv("59", normalize(MERCHANT_NAME, 25)),
    tlv("60", normalize(MERCHANT_CITY, 15)),
    tlv("62", additionalData),
    "6304",
  ].join("");
  return `${withoutCrc}${crc16(withoutCrc)}`;
}

export const pixRecipient = {
  key: PIX_KEY,
  displayKey: "+55 84 99818-3970",
  name: "João Paulo Rocha Sousa Santos",
  city: "Mossoró — RN",
};
