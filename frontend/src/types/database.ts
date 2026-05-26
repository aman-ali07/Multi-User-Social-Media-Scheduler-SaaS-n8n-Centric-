export type Platform = 'facebook' | 'instagram';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
export type AccountStatus = 'active' | 'expired' | 'revoked';
export type LogStatus = 'success' | 'error' | 'retry';
export type WorkflowStatus = 'running' | 'success' | 'error';

export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: Platform;
  page_id: string;
  page_name: string | null;
  ig_user_id: string | null;
  ig_username: string | null;
  token_expires_at: string | null;
  status: AccountStatus;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  user_id: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  storage_path: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  created_at: string;
}

export interface ScheduledPost {
  id: string;
  user_id: string;
  account_id: string | null;
  title: string | null;
  caption: string | null;
  platforms: Platform[];
  schedule_at: string | null;
  published_at: string | null;
  timezone: string;
  status: PostStatus;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  media?: (MediaAsset & { sort_order: number })[];
  logs?: PostLog[];
}

export interface PostMedia {
  post_id: string;
  media_id: string;
  sort_order: number;
}

export interface PostLog {
  id: string;
  post_id: string;
  workflow_name: string;
  status: LogStatus;
  error_message: string | null;
  response_payload: unknown;
  attempt_number: number;
  created_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_name: string;
  status: WorkflowStatus;
  input_payload: unknown;
  output_payload: unknown;
  error_message: string | null;
  duration_ms: number | null;
  triggered_by: string | null;
  created_at: string;
}

export interface TokenRefreshLog {
  id: string;
  account_id: string;
  old_expires_at: string | null;
  new_expires_at: string | null;
  status: 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}

export interface OAuthState {
  id: string;
  user_id: string;
  platform: Platform;
  state: string;
  code_verifier: string | null;
  redirect_url: string | null;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface DashboardStats {
  scheduledToday: number;
  totalPublished: number;
  totalFailed: number;
  connectedAccounts: number;
  publishingVelocity: { date: string; count: number }[];
}
