import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { submitSupportRequest } from '../services/supportService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

const SUBJECT_MAX = 200;
const MESSAGE_MAX = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function SupportScreen() {
  const { state: authState } = useAuth();
  const initialEmail = authState.user?.email ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailError = useMemo(() => {
    if (!email.trim()) return 'Email is required.';
    if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
    return null;
  }, [email]);
  const subjectError = useMemo(() => {
    if (!subject.trim()) return 'Subject is required.';
    if (subject.length > SUBJECT_MAX) return `Subject must be ${SUBJECT_MAX} characters or fewer.`;
    return null;
  }, [subject]);
  const messageError = useMemo(() => {
    if (!message.trim()) return 'Message is required.';
    if (message.length > MESSAGE_MAX) return `Message must be ${MESSAGE_MAX} characters or fewer.`;
    return null;
  }, [message]);

  const canSubmit = !emailError && !subjectError && !messageError && status !== 'submitting';

  const handleSubmit = useCallback(async () => {
    setAttempted(true);
    if (!canSubmit) return;

    // Honeypot: silently succeed, do not insert.
    if (website.trim().length > 0) {
      setStatus('success');
      return;
    }

    setStatus('submitting');
    setErrorMessage(null);
    try {
      await submitSupportRequest({
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  }, [canSubmit, email, subject, message, website]);

  const handleSendAnother = useCallback(() => {
    setEmail(initialEmail);
    setSubject('');
    setMessage('');
    setWebsite('');
    setAttempted(false);
    setStatus('idle');
    setErrorMessage(null);
  }, [initialEmail]);

  if (status === 'success') {
    return (
      <ScrollView contentContainerStyle={styles.outer}>
        <View style={styles.card}>
          <Text style={styles.title}>Thanks!</Text>
          <Text style={styles.body}>
            We got your message and will get back to you as soon as we can.
          </Text>
          <TouchableOpacity onPress={handleSendAnother} style={styles.secondaryButton} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Send another</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.outer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Support</Text>
          <Text style={styles.body}>
            Found a bug, have a feature request, or just want to say hi? Send us a note.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={status !== 'submitting'}
            />
            {attempted && emailError && <Text style={styles.fieldError}>{emailError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              style={styles.input}
              placeholder="Short summary"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={SUBJECT_MAX}
              editable={status !== 'submitting'}
            />
            {attempted && subjectError && <Text style={styles.fieldError}>{subjectError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              style={[styles.input, styles.textarea]}
              placeholder="Tell us what's going on…"
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={MESSAGE_MAX}
              editable={status !== 'submitting'}
            />
            {attempted && messageError && <Text style={styles.fieldError}>{messageError}</Text>}
          </View>

          {/* Honeypot: hidden from real users via display:none. Bots that blindly
              fill every input will trip this and be silently dropped. */}
          <View style={styles.honeypot} pointerEvents="none">
            <TextInput
              value={website}
              onChangeText={setWebsite}
              autoComplete="off"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {...({ tabIndex: -1 } as any)}
            />
          </View>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
            accessibilityRole="button"
          >
            {status === 'submitting' ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.primaryButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  outer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 640,
    gap: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.heading1,
    color: COLORS.textPrimary,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  field: {
    gap: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    color: COLORS.textPrimary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textarea: {
    minHeight: 160,
  },
  fieldError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
  },
  errorBanner: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.accent,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  errorBannerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
  },
  primaryButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    // @ts-ignore - web only
    cursor: 'pointer',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.background,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: SPACING.sm,
    // @ts-ignore - web only
    cursor: 'pointer',
  },
  secondaryButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    textDecorationLine: 'underline',
  },
  honeypot: {
    // @ts-ignore - web only: remove the honeypot from layout and a11y.
    display: 'none',
  },
});
