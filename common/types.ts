export interface Artist {
  name: string;
  url: string;
  events: any[]; // Define a proper Event type later
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}
