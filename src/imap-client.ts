/**
 * IMAP Client for Yahoo Mail
 * 
 * This is a skeleton implementation. You'll need to:
 * 1. Implement connection with OAuth2 (XOAUTH2)
 * 2. Implement email fetching with pagination
 * 3. Implement email searching
 * 4. Parse email content using mailparser
 */

import Imap from 'imap';
// @ts-ignore - mailparser types may not be available
import { simpleParser } from 'mailparser';
import type { Email, FetchEmailsParams, SearchEmailsParams } from './types.js';
import type { YahooOAuth2 } from './oauth2.js';

export class YahooIMAPClient {
  private imap: Imap | null = null;
  private oauth2: YahooOAuth2;
  private emailAddress: string;
  private imapHost: string;
  private imapPort: number;
  private connected: boolean = false;

  constructor(oauth2: YahooOAuth2, emailAddress: string, imapHost: string, imapPort: number) {
    this.oauth2 = oauth2;
    this.emailAddress = emailAddress;
    this.imapHost = imapHost;
    this.imapPort = imapPort;
  }

  /**
   * Connect to IMAP server with OAuth2
   */
  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const accessToken = await this.oauth2.getAccessToken();
        
        // Create IMAP connection with OAuth2 token
        this.imap = new Imap({
          user: this.emailAddress,
          xoauth2: accessToken, // OAuth2 token for XOAUTH2 authentication
          host: this.imapHost,
          port: this.imapPort,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
        } as any); // Type assertion needed for xoauth2

        if (!this.imap) {
          reject(new Error('Failed to create IMAP connection'));
          return;
        }

        this.imap.once('ready', () => {
          this.connected = true;
          resolve();
        });

        this.imap.once('error', (err: Error) => {
          this.connected = false;
          reject(err);
        });

        this.imap.connect();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from IMAP server
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.imap && this.connected) {
        this.imap.end();
        this.imap.once('end', () => {
          this.connected = false;
          this.imap = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.imap !== null;
  }

  /**
   * Fetch emails from a folder
   */
  async fetchEmails(params: FetchEmailsParams = {}): Promise<Email[]> {
    if (!this.connected || !this.imap) {
      await this.connect();
    }

    if (!this.imap) {
      throw new Error('IMAP connection not available');
    }

    const {
      folder = 'INBOX',
      limit = 50,
      offset = 0,
      since,
      unreadOnly = false,
    } = params;

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP connection not available'));
        return;
      }

      if (!this.imap) {
        reject(new Error('IMAP connection not available'));
        return;
      }

      this.imap.openBox(folder, false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        if (!this.imap) {
          reject(new Error('IMAP connection lost'));
          return;
        }

        // Build search criteria
        const criteria: any[] = [];
        if (unreadOnly) {
          criteria.push(['UNSEEN']);
        }
        if (since) {
          criteria.push(['SINCE', since]);
        }

        // Search for emails
        this.imap.search(criteria.length > 0 ? criteria : ['ALL'], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (results.length === 0) {
            resolve([]);
            return;
          }

          // Apply pagination
          const start = Math.max(0, results.length - offset - limit);
          const end = results.length - offset;
          const uids = results.slice(Math.max(0, start), end).reverse(); // Most recent first

          if (!this.imap) {
            reject(new Error('IMAP connection lost'));
            return;
          }

          // Fetch email data
          const fetch = this.imap.fetch(uids, {
            bodies: '',
            struct: true,
          });

          const emails: Email[] = [];

          fetch.on('message', (msg, seqno) => {
            let emailBuffer = Buffer.alloc(0);

            msg.on('body', (stream) => {
              stream.on('data', (chunk: Buffer) => {
                emailBuffer = Buffer.concat([emailBuffer, chunk]);
              });
            });

            msg.once('attributes', async (attrs) => {
              try {
                const parsed = await simpleParser(emailBuffer);
                
                emails.push({
                  id: attrs.uid.toString(),
                  uid: attrs.uid,
                  messageId: parsed.messageId || '',
                  subject: parsed.subject || '(No Subject)',
                  from: parsed.from?.value || [],
                  to: parsed.to?.value || [],
                  cc: parsed.cc?.value,
                  bcc: parsed.bcc?.value,
                  date: parsed.date || new Date(),
                  text: parsed.text,
                  html: parsed.html,
                  attachments: parsed.attachments?.map((att) => ({
                    filename: att.filename || 'attachment',
                    contentType: att.contentType,
                    size: att.size || 0,
                    cid: att.cid,
                  })),
                  flags: attrs.flags || [],
                  folder,
                });

                // Resolve when all emails are processed
                if (emails.length === uids.length) {
                  resolve(emails);
                }
              } catch (parseErr) {
                console.error('Error parsing email:', parseErr);
                // Continue with other emails even if one fails
                if (emails.length === uids.length - 1) {
                  resolve(emails);
                }
              }
            });

            msg.once('end', () => {
              // Message end
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });
        });
      });
    });
  }

  /**
   * Get a specific email by UID
   */
  async getEmail(emailId: string, folder: string = 'INBOX'): Promise<Email> {
    if (!this.connected || !this.imap) {
      await this.connect();
    }

    if (!this.imap) {
      throw new Error('IMAP connection not available');
    }

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP connection not available'));
        return;
      }

      this.imap.openBox(folder, false, (err) => {
        if (err) {
          reject(err);
          return;
        }

        if (!this.imap) {
          reject(new Error('IMAP connection lost'));
          return;
        }

        const uid = parseInt(emailId, 10);
        const fetch = this.imap.fetch([uid], {
          bodies: '',
          struct: true,
        });

        let emailBuffer = Buffer.alloc(0);

        fetch.on('message', async (msg) => {
          msg.on('body', (stream) => {
            stream.on('data', (chunk: Buffer) => {
              emailBuffer = Buffer.concat([emailBuffer, chunk]);
            });
          });

          msg.once('attributes', async (attrs) => {
            try {
              const parsed = await simpleParser(emailBuffer);
              
              resolve({
                id: attrs.uid.toString(),
                uid: attrs.uid,
                messageId: parsed.messageId || '',
                subject: parsed.subject || '(No Subject)',
                from: parsed.from?.value || [],
                to: parsed.to?.value || [],
                cc: parsed.cc?.value,
                bcc: parsed.bcc?.value,
                date: parsed.date || new Date(),
                text: parsed.text,
                html: parsed.html,
                attachments: parsed.attachments?.map((att: any) => ({
                  filename: att.filename || 'attachment',
                  contentType: att.contentType,
                  size: att.size || 0,
                  cid: att.cid,
                })),
                flags: attrs.flags || [],
                folder,
              });
            } catch (parseErr) {
              reject(new Error(`Failed to parse email: ${parseErr}`));
            }
          });
        });

        fetch.once('error', (err) => {
          reject(err);
        });
      });
    });
  }

  /**
   * Search emails by criteria
   */
  async searchEmails(params: SearchEmailsParams): Promise<Email[]> {
    if (!this.connected || !this.imap) {
      await this.connect();
    }

    if (!this.imap) {
      throw new Error('IMAP connection not available');
    }

    const {
      query,
      folder = 'INBOX',
      from,
      subject,
      dateRange,
      limit = 50,
    } = params;

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP connection not available'));
        return;
      }

      this.imap.openBox(folder, false, (err) => {
        if (err) {
          reject(err);
          return;
        }

        if (!this.imap) {
          reject(new Error('IMAP connection lost'));
          return;
        }

        // Build IMAP search criteria
        const criteria: any[] = [];

        if (query) {
          // Search in body and subject
          criteria.push(['OR', ['BODY', query], ['SUBJECT', query]]);
        }

        if (from) {
          criteria.push(['FROM', from]);
        }

        if (subject) {
          criteria.push(['SUBJECT', subject]);
        }

        if (dateRange) {
          if (dateRange.start) {
            criteria.push(['SINCE', dateRange.start]);
          }
          if (dateRange.end) {
            criteria.push(['BEFORE', dateRange.end]);
          }
        }

        // Search
        this.imap.search(criteria.length > 0 ? criteria : ['ALL'], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (results.length === 0) {
            resolve([]);
            return;
          }

          // Apply limit and get most recent first
          const uids = results.slice(-limit).reverse();

          if (!this.imap) {
            reject(new Error('IMAP connection lost'));
            return;
          }

          const fetch = this.imap.fetch(uids, {
            bodies: '',
            struct: true,
          });

          const emails: Email[] = [];

          fetch.on('message', (msg) => {
            let emailBuffer = Buffer.alloc(0);

            msg.on('body', (stream) => {
              stream.on('data', (chunk: Buffer) => {
                emailBuffer = Buffer.concat([emailBuffer, chunk]);
              });
            });

            msg.once('attributes', async (attrs) => {
              try {
                const parsed = await simpleParser(emailBuffer);
                
                emails.push({
                  id: attrs.uid.toString(),
                  uid: attrs.uid,
                  messageId: parsed.messageId || '',
                  subject: parsed.subject || '(No Subject)',
                  from: parsed.from?.value || [],
                  to: parsed.to?.value || [],
                  cc: parsed.cc?.value,
                  bcc: parsed.bcc?.value,
                  date: parsed.date || new Date(),
                  text: parsed.text,
                  html: parsed.html,
                  attachments: parsed.attachments?.map((att) => ({
                    filename: att.filename || 'attachment',
                    contentType: att.contentType,
                    size: att.size || 0,
                    cid: att.cid,
                  })),
                  flags: attrs.flags || [],
                  folder,
                });

                if (emails.length === uids.length) {
                  resolve(emails);
                }
              } catch (parseErr) {
                console.error('Error parsing email:', parseErr);
                if (emails.length === uids.length - 1) {
                  resolve(emails);
                }
              }
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });
        });
      });
    });
  }

  /**
   * List available mailboxes/folders
   */
  async listMailboxes(): Promise<string[]> {
    if (!this.connected || !this.imap) {
      await this.connect();
    }

    if (!this.imap) {
      throw new Error('IMAP connection not available');
    }

    return new Promise((resolve, reject) => {
      if (!this.imap) {
        reject(new Error('IMAP connection not available'));
        return;
      }

      this.imap.getBoxes((err, boxes) => {
        if (err) {
          reject(err);
          return;
        }

        const mailboxList: string[] = [];

        const extractBoxes = (boxList: any, prefix: string = '') => {
          for (const [name, boxValue] of Object.entries(boxList)) {
            const box = boxValue as { delimiter: string; children?: any };
            const fullName = prefix ? `${prefix}${box.delimiter}${name}` : name;
            mailboxList.push(fullName);
            if (box.children) {
              extractBoxes(box.children, fullName);
            }
          }
        };

        extractBoxes(boxes);
        resolve(mailboxList);
      });
    });
  }
}

