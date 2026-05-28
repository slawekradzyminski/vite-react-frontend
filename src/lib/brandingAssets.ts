const BRANDING_VERSION = '3.6.13';
const BRANDING_ROOT = '/branding/generated';
const FILE_BRANDING_ROOT = './public/branding/generated';

export const brandingAsset = (fileName: string) => {
  const root = window.location.protocol === 'file:' ? FILE_BRANDING_ROOT : BRANDING_ROOT;
  return `${root}/${fileName}?v=${BRANDING_VERSION}`;
};

export const brandMarkSrc = brandingAsset('at-transparent.png');
