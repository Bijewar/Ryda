import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

/**
 * Password-reset email — single-use link, 30-minute TTL.
 *
 * The link is opaque (random bytes, hashed in the DB) so we don't leak the
 * underlying token via URL parameters. If the user didn't request a reset,
 * the email tells them to ignore it — their account is safe.
 */
export interface PasswordResetTemplateProps {
  name?: string;
  resetUrl: string;
  /** TTL string for the human-readable copy. */
  validFor?: string;
}

export default function PasswordResetTemplate({
  name = 'there',
  resetUrl,
  validFor = '30 minutes',
}: PasswordResetTemplateProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Reset your Ryda password</Preview>
      <Body
        style={{
          backgroundColor: '#0A0A0B',
          color: '#E5E7EB',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', Helvetica, Arial, sans-serif",
          margin: 0,
          padding: '24px 0',
        }}
      >
        <Container
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            backgroundColor: '#131316',
            border: '1px solid #26262E',
            borderRadius: '12px',
            padding: '32px 24px',
          }}
        >
          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Heading
              style={{
                color: '#00FF87',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Ryda
            </Heading>
            <Text style={{ color: '#8A8A95', fontSize: '12px', margin: '4px 0 0' }}>
              Production-grade ride-hailing for Bhopal
            </Text>
          </Section>

          <Hr style={{ borderColor: '#26262E', margin: '0 0 24px' }} />

          <Heading
            as="h1"
            style={{
              color: '#F4F4F5',
              fontSize: '20px',
              fontWeight: 600,
              margin: '0 0 12px',
            }}
          >
            Reset your password, {name}?
          </Heading>
          <Text style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: '22px', margin: '0 0 24px' }}>
            We received a request to reset the password on your Ryda account. Click the button
            below to choose a new password. This link is valid for {validFor}.
          </Text>

          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: '#00FF87',
                color: '#0A0A0B',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Reset password
            </Button>
          </Section>

          <Text
            style={{
              color: '#71717A',
              fontSize: '12px',
              lineHeight: '18px',
              margin: '0 0 16px',
              wordBreak: 'break-all',
            }}
          >
            If the button doesn&apos;t work, copy and paste this URL into your browser:
            <br />
            <span style={{ fontFamily: 'monospace', color: '#8A8A95' }}>{resetUrl}</span>
          </Text>

          <Hr style={{ borderColor: '#26262E', margin: '24px 0' }} />

          <Text style={{ color: '#A1A1AA', fontSize: '13px', lineHeight: '20px', margin: '0 0 12px' }}>
            If you didn&apos;t request this email, you can safely ignore it — your password will not
            be changed. No further action is required.
          </Text>

          <Text style={{ color: '#71717A', fontSize: '11px', lineHeight: '16px', margin: 0 }}>
            Ryda v2 will never ask for your password by email. If you suspect your account has
            been compromised, reply to this email immediately.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

PasswordResetTemplate.PreviewProps = {
  name: 'Aarav',
  resetUrl: 'http://localhost:3000/reset-password?token=abc123def456',
  validFor: '30 minutes',
} satisfies PasswordResetTemplateProps;
