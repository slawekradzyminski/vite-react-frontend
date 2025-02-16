export interface CreateQrDto {
  text: string;
}

export interface QrCodeResponse {
  type: 'image/png';
  data: Blob;
} 