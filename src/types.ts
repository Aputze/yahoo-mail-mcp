/**
 * Type definitions for Yahoo Mail MCP Server
 */

export interface YahooConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  imapHost: string;
  imapPort: number;
  caldavUrl: string;
  smtpHost: string;
  smtpPort: number;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export interface Email {
  id: string;
  uid: number;
  messageId: string;
  subject: string;
  from: EmailAddress[];
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  date: Date;
  text?: string;
  html?: string;
  attachments?: Attachment[];
  flags?: string[];
  folder?: string;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content?: Buffer;
  cid?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  organizer?: EmailAddress;
  attendees?: EmailAddress[];
  status: string;
  calendarId: string;
  url?: string;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  url: string;
  color?: string;
}

export interface FetchEmailsParams {
  folder?: string;
  limit?: number;
  offset?: number;
  since?: Date;
  before?: Date;
  unreadOnly?: boolean;
}

export interface SearchEmailsParams {
  query: string;
  folder?: string;
  from?: string;
  subject?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
}

export interface FetchCalendarEventsParams {
  calendarId?: string;
  startDate: Date;
  endDate: Date;
}

export interface SendEmailParams {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

