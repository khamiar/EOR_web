export interface Announcement {
  id?: number;
  title: string;
  content?: string;
  category: string;
  attachmentUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishDate?: Date | string | null;
  postedBy?: string;
  postedAt: Date | string;
  updatedAt?: Date;
  sendNotification?: boolean;
} 