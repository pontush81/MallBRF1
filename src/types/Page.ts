export interface Page {
  id: string;
  title: string;
  content: string;
  slug: string;
  isPublished: boolean;
  show: boolean;
  createdAt?: string;
  updatedAt?: string;
  files?: FileInfo[];
}

export interface FileInfo {
  id?: string;
  filename: string;
  originalName?: string;
  originalname?: string;
  path?: string;
  url?: string;
  size: number;
  mimetype: string;
  uploadedAt?: string;
} 