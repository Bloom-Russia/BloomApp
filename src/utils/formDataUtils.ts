export const extractFileUri = (file: any): string | null => {
  if (!file) {
    return null;
  }
  if (typeof file === 'string') {
    return file;
  }
  if (typeof file === 'object') {
    return file.uri || file.path || file.url || null;
  }
  return null;
};

export const extractFileType = (file: any): string => {
  if (!file) {
    return 'image/jpeg';
  }
  if (typeof file === 'object' && file.type) {
    return file.type;
  }
  if (typeof file === 'string') {
    return getMimeTypeFromUri(file);
  }
  return 'image/jpeg';
};

export const extractFileName = (file: any): string => {
  if (!file) {
    return `file-${Date.now()}.jpg`;
  }
  if (typeof file === 'object' && file.name) {
    return file.name;
  }
  if (typeof file === 'string') {
    const parts = file.split('/');
    return parts[parts.length - 1] || `file-${Date.now()}.jpg`;
  }
  return `file-${Date.now()}.jpg`;
};

export const isLocalFileUri = (uri: string): boolean => {
  if (!uri) {
    return false;
  }
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('/storage/') ||
    uri.startsWith('data:')
  );
};

export const getMimeTypeFromUri = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return mimeTypes[extension] || 'image/jpeg';
};

export const createFormDataFromObject = <T extends Record<string, any>>(
  data: T,
  fileField?: {
    fieldName: string;
    fileUri: string;
    mimeType?: string;
    fileName?: string;
  },
): FormData => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'avatar') {
      return;
    }
    if (value !== undefined && value !== null && value !== '') {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      formData.append(key, stringValue);
    }
  });

  if (fileField) {
    const { fieldName, fileUri, mimeType = 'image/jpeg', fileName } = fileField;
    const extension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
    const finalFileName = fileName || `file-${Date.now()}.${extension}`;

    formData.append(fieldName, {
      uri: fileUri,
      type: mimeType,
      name: finalFileName,
    });
  }

  return formData;
};
