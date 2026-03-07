import QRCodeStyling from 'qr-code-styling'

export function useQRCode() {
  function generateQRCode(data, targetElement) {
    const qrCode = new QRCodeStyling({
      width: 280,
      height: 280,
      type: 'svg',
      data: JSON.stringify(data),
      dotsOptions: {
        color: '#22c55e',
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#141414',
      },
      cornersSquareOptions: {
        color: '#22c55e',
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#22c55e',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 8,
      },
    })
    qrCode.append(targetElement)
    return qrCode
  }

  function downloadQRCode(qrCode, filename) {
    qrCode.download({ name: filename, extension: 'png' })
  }

  return { generateQRCode, downloadQRCode }
}
