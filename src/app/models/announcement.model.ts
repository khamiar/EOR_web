export interface Announcement {
  id?: number;
  title: string;
  content?: string;
  category: string;
  attachmentUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishDate?: Date;
  postedBy: string;
  postedAt: Date;
  updatedAt?: Date;
  sendNotification?: boolean;
} 