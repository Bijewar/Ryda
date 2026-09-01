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
 * Welcome email — sent immediately after a successful registration.
 *
 * The CTA points at the passenger dashboard so the user can book their first
 * ride without having to navigate from the home page.
 */
export interface WelcomeTemplateProps {
  name: string;
  /** Absolute URL — defaults to the passenger dashboard. */
  bookRideUrl?: string;
}

export default function WelcomeTemplate({
  name,
  bookRideUrl = 'http://localhost:3000/dashboard',
}: WelcomeTemplateProps): React.ReactElement {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Ryda, {name} — book your first ride in Bhopal</Preview>
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
              fontSize: '22px',
              fontWeight: 600,
              margin: '0 0 12px',
            }}
          >
            Welcome aboard, {name} 👋
          </Heading>
          <Text style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: '22px', margin: '0 0 16px' }}>
            Your Ryda account is ready. You can now book rides across Bhopal — from MP Nagar to
            Old City, BHEL to Kolar — in seconds.
          </Text>
          <Text style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: '22px', margin: '0 0 24px' }}>
            Every ride is geofenced to the official Bhopal municipal boundary, so you&apos;ll only
            ever be matched with drivers inside the city.
          </Text>

          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Button
              href={bookRideUrl}
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
              Book your first ride
            </Button>
          </Section>

          <Hr style={{ borderColor: '#26262E', margin: '24px 0' }} />

          <Heading
            as="h2"
            style={{
              color: '#F4F4F5',
              fontSize: '14px',
              fontWeight: 600,
              margin: '0 0 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            What&apos;s next
          </Heading>
          <Text style={{ color: '#A1A1AA', fontSize: '13px', lineHeight: '20px', margin: '0 0 8px' }}>
            1. Open the Ryda app and pick a pickup + dropoff in Bhopal.
          </Text>
          <Text style={{ color: '#A1A1AA', fontSize: '13px', lineHeight: '20px', margin: '0 0 8px' }}>
            2. Choose a payment method — UPI, card, wallet, or cash.
          </Text>
          <Text style={{ color: '#A1A1AA', fontSize: '13px', lineHeight: '20px', margin: '0 0 16px' }}>
            3. Track your driver in real-time and rate the ride when you arrive.
          </Text>

          <Text style={{ color: '#71717A', fontSize: '11px', lineHeight: '16px', margin: 0 }}>
            You&apos;re receiving this email because you registered an account on Ryda. If this
            wasn&apos;t you, please reply to this email so we can investigate.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

WelcomeTemplate.PreviewProps = {
  name: 'Aarav',
  bookRideUrl: 'http://localhost:3000/dashboard',
} satisfies WelcomeTemplateProps;
