export interface FavoriteRecord {
  id: string;
  uid: string;
  resourceId: string;
  createdAt: string;
}

export interface RecentViewRecord {
  id: string;
  uid: string;
  resourceId: string;
  viewedAt: string;
}

export interface DownloadRecord {
  id: string;
  uid: string;
  resourceId: string;
  downloadedAt: string;
}
