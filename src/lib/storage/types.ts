export type StoredObject = {
  key: string;
  url: string;
  mimeType: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
};

export type StoredObjectBody = {
  body: Buffer;
  mimeType: string;
};

export type ObjectStorage = {
  put(input: {
    key: string;
    body: Buffer;
    mimeType: string;
  }): Promise<StoredObject>;
  get(key: string): Promise<StoredObjectBody | null>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
};
