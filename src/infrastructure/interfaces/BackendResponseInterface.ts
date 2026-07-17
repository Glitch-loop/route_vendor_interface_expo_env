export interface BackendMetadataResponseInterface {
  limit: number;
  has_next_page: boolean;
  next_item: string;
}

export interface BackendResponseInterface<T> {
  message: string;
  data: T;
  meta?: BackendMetadataResponseInterface;
}