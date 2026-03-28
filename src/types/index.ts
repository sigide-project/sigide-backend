import { Optional } from 'sequelize';

// Address types
export interface AddressAttributes {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  lat?: number | null;
  lng?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AddressCreationAttributes = Optional<AddressAttributes, 'id' | 'address_line2' | 'is_default' | 'lat' | 'lng'>;

export interface CreateAddressInput {
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  is_default?: boolean;
  lat?: number;
  lng?: number;
}

export interface UpdateAddressInput {
  label?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
  lat?: number;
  lng?: number;
}

// User types
export interface UserAttributes {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string | null;
  password_hash: string;
  avatar_url?: string | null;
  rating: number;
  role: 'user' | 'admin';
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'username' | 'phone' | 'avatar_url' | 'rating' | 'role' | 'isActive' | 'isDeleted'>;

// Item types
export type ItemType = 'lost' | 'found';
export type ItemStatus = 'open' | 'claimed' | 'resolved' | 'cancelled';

export interface ItemAttributes {
  id: string;
  user_id: string;
  type: ItemType;
  status: ItemStatus;
  title: string;
  description?: string | null;
  category?: string | null;
  image_urls: string[];
  location_name?: string | null;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  reward_amount: number;
  lost_found_at?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ItemCreationAttributes = Optional<ItemAttributes, 'id' | 'status' | 'description' | 'category' | 'image_urls' | 'location_name' | 'location' | 'reward_amount' | 'lost_found_at'>;

// Claim types
export type ClaimStatus = 'pending' | 'accepted' | 'rejected' | 'resolved' | 'disputed';

export interface ClaimAttributes {
  id: string;
  item_id: string;
  claimant_id: string;
  status: ClaimStatus;
  proof_description?: string | null;
  proof_images: string[];
  resolved_at?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ClaimCreationAttributes = Optional<ClaimAttributes, 'id' | 'status' | 'proof_description' | 'proof_images' | 'resolved_at'>;

// Message types
export interface MessageAttributes {
  id: string;
  claim_id: string;
  sender_id: string;
  content: string;
  read_at?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MessageCreationAttributes = Optional<MessageAttributes, 'id' | 'read_at'>;

// Reward types
export type RewardStatus = 'pending' | 'released' | 'cancelled';

export interface RewardAttributes {
  id: string;
  item_id: string;
  payer_id: string;
  payee_id?: string | null;
  amount: number;
  status: RewardStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RewardCreationAttributes = Optional<RewardAttributes, 'id' | 'payee_id' | 'status'>;

// Notification types
export interface NotificationAttributes {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NotificationCreationAttributes = Optional<NotificationAttributes, 'id' | 'payload' | 'read'>;

// SavedItem types
export interface SavedItemAttributes {
  id: string;
  user_id: string;
  item_id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SavedItemCreationAttributes = Optional<SavedItemAttributes, 'id'>;

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Request types - Note: For Express request augmentation, see express.d.ts
export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  name: string;
  phone?: string | null;
  avatar_url?: string | null;
  rating: number;
  role: 'user' | 'admin';
  isActive?: boolean;
  isDeleted?: boolean;
}

// Sort options for items
export type ItemSortBy = 'createdAt' | 'reward_amount' | 'distance' | 'title';
export type SortOrder = 'asc' | 'desc';

// Filter types
export interface ItemFilters {
  lat?: number;
  lng?: number;
  radius?: number;
  minDistance?: number;
  maxDistance?: number;
  type?: ItemType;
  category?: string;
  tags?: string[];
  status?: ItemStatus;
  search?: string;
  sortBy?: ItemSortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface UserItemFilters {
  type?: ItemType;
  status?: ItemStatus;
  page?: number;
  limit?: number;
}

// Item input types
export interface CreateItemInput {
  type: ItemType;
  title: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  location_name: string;
  image_urls?: string[];
  reward_amount?: number;
  lost_found_at: Date | string;
}

export interface UpdateItemInput {
  type?: ItemType;
  title?: string;
  description?: string;
  category?: string;
  lat?: number;
  lng?: number;
  location_name?: string;
  image_urls?: string[];
  reward_amount?: number;
  lost_found_at?: Date | string;
}

// User update input types
export interface UpdateMeInput {
  name?: string;
  phone?: string;
  avatar_url?: string;
  username?: string;
}

// Upload types
export interface UploadResult {
  url: string;
}

// JWT Payload
export interface JwtPayload {
  id: string;
  email: string;
  role?: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

// Auth types
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    avatar_url: string | null;
    role: 'user' | 'admin';
  };
  token: string;
}

// Database config types
export interface DatabaseConfig {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  port?: number;
  dialect: 'postgres';
  logging?: boolean | ((sql: string) => void);
  use_env_variable?: string;
  dialectOptions?: {
    ssl?: {
      require: boolean;
      rejectUnauthorized: boolean;
    };
  };
  pool?: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

export interface DatabaseConfigs {
  development: DatabaseConfig;
  test: DatabaseConfig;
  production: DatabaseConfig;
  [key: string]: DatabaseConfig;
}
