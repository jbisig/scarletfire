import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullet({ bold, children }: { bold?: string; children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bullet}>{'\u2022'}</Text>
      <Text style={styles.body}>
        {bold ? <Text style={styles.bold}>{bold}: </Text> : null}
        {children}
      </Text>
    </View>
  );
}

export function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last Updated: January 23, 2026</Text>

        <Section title="Overview">
          <Text style={styles.body}>
            Grateful Dead Player is a free app that lets you stream live Grateful Dead concert recordings from the Internet Archive. We built this app for fans, by fans, and we respect your privacy. This policy explains what information the app collects and how it's used.
          </Text>
        </Section>

        <Section title="Information We Collect">
          <Text style={styles.subheading}>Account Information</Text>
          <Text style={styles.body}>
            Creating an account is optional but enables you to save your favorite songs and shows. If you choose to create an account, we collect:
          </Text>
          <Bullet bold="Email Address">Used for account authentication and communication about your account</Bullet>
          <Bullet bold="Saved Content">The songs and shows you choose to save to your account</Bullet>
          <Text style={styles.body}>
            This information is stored securely on our servers and is associated with your account.
          </Text>
        </Section>

        <Section title="Information We Do Not Collect">
          <Bullet>We do not track your location</Bullet>
          <Bullet>We do not access your contacts, photos, or other device data</Bullet>
          <Bullet>We do not use advertising or sell your data to third parties</Bullet>
        </Section>

        <Section title="Information Collected Automatically">
          <Text style={styles.body}>
            The app may collect limited technical information to ensure functionality:
          </Text>
          <Bullet bold="Device Information">Basic device type and operating system version for compatibility purposes</Bullet>
          <Bullet bold="Crash Data">If the app crashes, anonymous crash reports may be generated to help us fix bugs</Bullet>
          <Bullet bold="Usage Analytics">We may collect anonymous, aggregated usage statistics (such as which features are used most frequently) to improve the app</Bullet>
          <Text style={styles.body}>
            This technical data is collected anonymously and cannot be used to identify you personally.
          </Text>
        </Section>

        <Section title="Data from the Internet Archive">
          <Text style={styles.body}>
            When you browse or stream concerts, the app connects to the Internet Archive's public API. The Internet Archive has its own privacy policy governing how they handle requests to their servers. We encourage you to review their privacy policy at archive.org.
          </Text>
        </Section>

        <Section title="Data Storage">
          <Text style={styles.subheading}>Local Storage</Text>
          <Text style={styles.body}>
            The app stores your preferences (such as playback settings) locally on your device. This data never leaves your device and is deleted when you uninstall the app.
          </Text>
          <Text style={styles.subheading}>Server Storage</Text>
          <Text style={styles.body}>
            If you create an account, your email address and saved songs/shows are stored securely on our servers. This data is retained until you delete your account.
          </Text>
        </Section>

        <Section title="Data Retention">
          <Bullet bold="Local data">Deleted when you uninstall the app</Bullet>
          <Bullet bold="Account data">Retained until you request account deletion</Bullet>
        </Section>

        <Section title="Third-Party Services">
          <Text style={styles.body}>
            The app connects to the following third-party service:
          </Text>
          <Bullet bold="Internet Archive (archive.org)">Provides the concert recordings and metadata. Their privacy policy applies to data transmitted to their servers.</Bullet>
        </Section>

        <Section title="Children's Privacy">
          <Text style={styles.body}>
            This app is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can delete it.
          </Text>
        </Section>

        <Section title="Changes to This Policy">
          <Text style={styles.body}>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app or on our website. You are advised to review this policy periodically for any changes.
          </Text>
        </Section>

        <Section title="Your Rights">
          <Text style={styles.body}>
            You have the following rights regarding your data:
          </Text>
          <Bullet bold="Access">You can view your saved songs and shows within the app at any time</Bullet>
          <Bullet bold="Deletion">You can delete your account and all associated data by contacting us or using the account deletion option in the app</Bullet>
          <Bullet bold="Data Export">You can request a copy of your data by contacting us</Bullet>
          <Text style={styles.body}>
            Depending on your location (such as the EU under GDPR or California under CCPA), you may have additional rights regarding your personal data. To exercise any of these rights, please contact us using the information below.
          </Text>
        </Section>

        <Section title="Contact Us">
          <Text style={styles.body}>
            If you have any questions about this privacy policy or the app's privacy practices, please contact us at:
          </Text>
          <Text style={[styles.body, styles.bold]}>
            Email: contact@scarletfire.app
          </Text>
          <Text style={[styles.body, styles.effectiveDate]}>
            This privacy policy is effective as of the date listed above.
          </Text>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.xxl,
    paddingTop: Platform.OS === 'web' ? 60 : SPACING.xxl,
    paddingBottom: 80,
    maxWidth: 720,
    ...(Platform.OS === 'web' ? { alignSelf: 'center' as const, width: '100%' } : {}),
  },
  title: {
    ...TYPOGRAPHY.heading1,
    marginBottom: SPACING.sm,
  },
  lastUpdated: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textHint,
    marginBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading3,
    marginBottom: SPACING.md,
  },
  subheading: {
    ...TYPOGRAPHY.labelLarge,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  bold: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  bulletRow: {
    flexDirection: 'row',
    paddingLeft: SPACING.md,
    marginBottom: SPACING.sm,
  },
  bullet: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
    lineHeight: 24,
  },
  effectiveDate: {
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
});
