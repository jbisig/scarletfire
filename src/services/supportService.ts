import { authService } from './authService';
import { logger } from '../utils/logger';

const log = logger.create('Support');

export interface SupportRequestInput {
  email: string;
  subject: string;
  message: string;
}

/**
 * Insert a support request into Supabase. Attaches the current auth user_id
 * when available; otherwise stores the row with user_id = null.
 *
 * Throws on Supabase error so the caller can surface it to the user.
 */
export async function submitSupportRequest(input: SupportRequestInput): Promise<void> {
  const supabase = authService.getClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('support_requests').insert({
    user_id: user?.id ?? null,
    email: input.email,
    subject: input.subject,
    message: input.message,
  });

  if (error) {
    log.error('Failed to insert support_request', error);
    throw error;
  }
}
