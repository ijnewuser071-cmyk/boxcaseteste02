export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type NotificationChannel = "whatsapp" | "email" | "app";
export type NotificationStatus = "draft" | "scheduled" | "queued" | "processing" | "sent" | "delivered" | "failed" | "read" | "cancelled";
export type ClientStatus = "lead" | "active" | "inactive" | "blocked";
export type SubscriptionStatus = "pending" | "active" | "past_due" | "cancelled" | "expired";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "client" | "staff" | "admin";
  created_at: string;
  updated_at: string;
}

export interface ClientRow {
  id: string;
  user_id: string | null;
  profile_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  whatsapp_opt_in: boolean;
  email_opt_in: boolean;
  app_opt_in: boolean;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  client_id: string;
  subscription_id: string | null;
  template_id: string | null;
  kind: "promotion" | "expiration" | "payment" | "transactional";
  channel: NotificationChannel;
  title: string | null;
  message: string;
  status: NotificationStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  provider_message_id: string | null;
  attempt_count: number;
  last_attempt_at: string | null;
  error_message: string | null;
  dedupe_key: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  client_id: string;
  plan_code: string;
  plan_name: string;
  price_cents: number;
  starts_at: string;
  ends_at: string;
  status: SubscriptionStatus;
  auto_renew: boolean;
  last_payment_at: string | null;
  next_payment_at: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplateRow {
  id: string;
  code: string;
  channel: NotificationChannel;
  title: string | null;
  body: string;
  provider_template_name: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanRow {
  id: string;
  code: string;
  name: string;
  frequency_per_week: number;
  price_cents: number;
  price_per_class_cents: number | null;
  description: string | null;
  benefits: Json;
  featured: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequestRow {
  id: string;
  client_id: string;
  plan_id: string;
  subscription_id: string | null;
  amount_cents: number;
  pix_txid: string;
  status: "pending" | "under_review" | "paid" | "rejected" | "expired" | "cancelled";
  requested_at: string;
  reported_paid_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

type Insert<T, Generated extends keyof T> = Omit<T, Generated> & Partial<Pick<T, Generated>>;
type Update<T> = Partial<Omit<T, "id" | "created_at">>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insert<ProfileRow, "created_at" | "updated_at" | "full_name" | "email" | "phone" | "avatar_url" | "role">;
        Update: Update<ProfileRow>;
        Relationships: [];
      };
      clients: {
        Row: ClientRow;
        Insert: Insert<ClientRow, "id" | "created_at" | "updated_at" | "user_id" | "profile_id" | "email" | "phone" | "status" | "whatsapp_opt_in" | "email_opt_in" | "app_opt_in" | "metadata">;
        Update: Update<ClientRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Insert<NotificationRow, "id" | "created_at" | "updated_at" | "subscription_id" | "template_id" | "kind" | "title" | "status" | "scheduled_at" | "sent_at" | "delivered_at" | "read_at" | "provider_message_id" | "attempt_count" | "last_attempt_at" | "error_message" | "dedupe_key" | "metadata">;
        Update: Update<NotificationRow>;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Insert<SubscriptionRow, "id" | "created_at" | "updated_at" | "status" | "auto_renew" | "last_payment_at" | "next_payment_at" | "payment_reference">;
        Update: Update<SubscriptionRow>;
        Relationships: [];
      };
      notification_templates: {
        Row: NotificationTemplateRow;
        Insert: Insert<NotificationTemplateRow, "id" | "created_at" | "updated_at" | "title" | "provider_template_name" | "active">;
        Update: Update<NotificationTemplateRow>;
        Relationships: [];
      };
      plans: {
        Row: PlanRow;
        Insert: Insert<PlanRow, "id" | "created_at" | "updated_at" | "price_per_class_cents" | "description" | "benefits" | "featured" | "active" | "sort_order">;
        Update: Update<PlanRow>;
        Relationships: [];
      };
      payment_requests: {
        Row: PaymentRequestRow;
        Insert: Insert<PaymentRequestRow, "id" | "subscription_id" | "status" | "requested_at" | "reported_paid_at" | "confirmed_at" | "confirmed_by" | "notes" | "created_at" | "updated_at">;
        Update: Update<PaymentRequestRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      report_pix_payment: {
        Args: { requested_plan_id: string; requested_txid: string; requested_addon_codes: string[] };
        Returns: string;
      };
      queue_expiration_reminders: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      mark_notification_read: {
        Args: { notification_id: string };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      confirm_pix_payment: {
        Args: { payment_request_id: string };
        Returns: string;
      };
    };
    Enums: {
      notification_channel: NotificationChannel;
      notification_status: NotificationStatus;
      client_status: ClientStatus;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
