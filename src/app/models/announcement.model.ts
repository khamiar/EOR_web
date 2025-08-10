export interface Announcement {
  id?: number;
  title: string;
  content?: string;
  category: string;
  attachmentUrl?: string | null;
  postedBy?: string;
  postedAt: Date | string;
} 