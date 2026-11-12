export interface FileItem {
  id: string;
  path: string;
  name: string;
  extension: string;
  size: number;
  modifiedAt: number;
  createdAt: number;
  exifTakenAt: number | null;
}
