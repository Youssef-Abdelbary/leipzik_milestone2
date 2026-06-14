import QRCode from 'qrcode';

export async function generateQRCodeBuffer(text) {
  return await QRCode.toBuffer(text, {
    type: 'png',
    width: 320,
    margin: 2,
    color: { dark: '#0F172A', light: '#FFFFFF' },
  });
}

export async function generateQRCodeDataURL(text) {
  return await QRCode.toDataURL(text, {
    width: 320,
    margin: 2,
    color: { dark: '#0F172A', light: '#FFFFFF' },
  });
}