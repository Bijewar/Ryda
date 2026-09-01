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
 * OTP email — 6-digit verification code, large monospaced numerals.
 *
 * Sent on register / login / password-reset. The code is single-use and
 * expires in 5 minutes (10 minutes for the explicit "Valid for 10 minutes"
 * copy below — the actual TTL is configured in src/lib/auth/otp.ts).
 */
export interface OtpTemplateProps {
  name?: string;
  code: string;
  /** "10 minutes" by default. Override when the TTL changes. */
  validFor?: string;
}

export default function OtpTemplate({
  name = 'there',
  code,
  validFor = '10 minutes',
}: OtpTemplateProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Your Ryda verification code is {code}</Preview>
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
            Hi {name}, your verification code
          </Heading>
          <Text style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: '20px', margin: '0 0 24px' }}>
            Enter this code in the Ryda app to verify it&apos;s you. If you didn&apos;t request this,
            you can safely ignore this email.
          </Text>

          <Section
            style={{
              textAlign: 'center',
              backgroundColor: '#00FF87',
              color: '#0A0A0B',
              padding: '20px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontFamily:
                "'JetBrains Mono', 'SF Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: '12px',
            }}
            aria-label={`Verification code ${code}`}
          >
            {code}
          </Section>

          <Text style={{ color: '#8A8A95', fontSize: '12px', textAlign: 'center', margin: '0 0 16px' }}>
            Valid for {validFor}
          </Text>

          <Hr style={{ borderColor: '#26262E', margin: '24px 0' }} />

          <Text style={{ color: '#71717A', fontSize: '11px', lineHeight: '16px', margin: 0 }}>
            This email was sent by Ryda v2. If you didn&apos;t create an account or request a
            verification code, please ignore this email — no action is needed.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Used by `OtpTemplate.Preview` — exported so React Email preview pages can
// render a default instance without constructing props by hand.
OtpTemplate.PreviewProps = {
  name: 'Aarav',
  code: '482917',
  validFor: '10 minutes',
} satisfies OtpTemplateProps;
