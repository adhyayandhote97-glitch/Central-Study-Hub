export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  pinned?: boolean;
  expiresAt?: string | null;
}
