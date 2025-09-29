export interface ImageFile {
  id: number;
  file: File;
  url: string;
  name: string;
  size: number;
}

export interface ConversionOptions {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margin: number;
  quality: 'high' | 'medium' | 'low';
  filename: string;
  imagesPerPage: 1 | 2 | 4;
}

export type PageSize = {
  width: number;
  height: number;
};