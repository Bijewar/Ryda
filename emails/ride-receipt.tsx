import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

/**
 * Ride receipt email — sent after a ride completes and payment is captured.
 *
 * Mirrors the on-screen receipt (pickup, dropoff, distance, fare, driver,
 * timestamps). The "View ride" CTA links to the in-app ride detail page so
 * the user can rate the driver + download a PDF receipt.
 */
export interface RideReceiptTemplateProps {
  passengerName: string;
  rideId: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceMeters: number;
  durationSeconds: number;
  farePaise: number;
  currency: string;
  surgeMultiplier?: number;
  driverName?: string;
  driverRating?: number;
  vehicleModel?: string;
  licensePlate?: string;
  completedAt: string;
  /** Absolute URL to the in-app ride detail page. */
  rideUrl?: string;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs} hr ${mins} min`;
}

function formatFare(paise: number, currency: string): string {
  const value = (paise / 100).toFixed(2);
  return currency === 'INR' ? `₹${value}` : `${value} ${currency}`;
}

export default function RideReceiptTemplate(
  props: RideReceiptTemplateProps,
): React.ReactElement {
  const {
    passengerName,
    rideId,
    pickupAddress,
    dropoffAddress,
    distanceMeters,
    durationSeconds,
    farePaise,
    currency,
    surgeMultiplier = 1,
    driverName,
    driverRating,
    vehicleModel,
    licensePlate,
    completedAt,
    rideUrl = `http://localhost:3000/receipts/${rideId}`,
  } = props;

  return (
    <Html>
      <Head />
      <Preview>
        Ryda receipt · {formatFare(farePaise, currency)} · {formatDistance(distanceMeters)}
      </Preview>
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
            maxWidth: '520px',
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
              Ride receipt · {new Date(completedAt).toLocaleDateString('en-IN')}
            </Text>
          </Section>

          <Hr style={{ borderColor: '#26262E', margin: '0 0 24px' }} />

          <Heading
            as="h1"
            style={{
              color: '#F4F4F5',
              fontSize: '20px',
              fontWeight: 600,
              margin: '0 0 8px',
            }}
          >
            Thanks for riding, {passengerName}
          </Heading>
          <Text style={{ color: '#A1A1AA', fontSize: '14px', lineHeight: '20px', margin: '0 0 24px' }}>
            Here&apos;s the receipt for your ride. Save it for your records or rate your driver
            from the app.
          </Text>

          {/* Trip details table */}
          <Section
            style={{
              backgroundColor: '#0A0A0B',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <Row style={{ marginBottom: '12px' }}>
              <Column style={{ width: '90px', verticalAlign: 'top' }}>
                <Text style={{ color: '#8A8A95', fontSize: '11px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pickup
                </Text>
              </Column>
              <Column>
                <Text style={{ color: '#F4F4F5', fontSize: '14px', margin: 0, lineHeight: '18px' }}>
                  {pickupAddress}
                </Text>
              </Column>
            </Row>
            <Row style={{ marginBottom: '12px' }}>
              <Column style={{ width: '90px', verticalAlign: 'top' }}>
                <Text style={{ color: '#8A8A95', fontSize: '11px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Dropoff
                </Text>
              </Column>
              <Column>
                <Text style={{ color: '#F4F4F5', fontSize: '14px', margin: 0, lineHeight: '18px' }}>
                  {dropoffAddress}
                </Text>
              </Column>
            </Row>
            <Row>
              <Column style={{ width: '90px' }}>
                <Text style={{ color: '#8A8A95', fontSize: '11px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Completed
                </Text>
              </Column>
              <Column>
                <Text style={{ color: '#A1A1AA', fontSize: '13px', margin: 0 }}>
                  {new Date(completedAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Driver + distance row */}
          <Row style={{ marginBottom: '16px' }}>
            <Column style={{ width: '50%' }}>
              <Text style={{ color: '#8A8A95', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Distance
              </Text>
              <Text style={{ color: '#F4F4F5', fontSize: '14px', margin: 0 }}>
                {formatDistance(distanceMeters)} · {formatDuration(durationSeconds)}
              </Text>
            </Column>
            <Column style={{ width: '50%' }}>
              <Text style={{ color: '#8A8A95', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Driver
              </Text>
              <Text style={{ color: '#F4F4F5', fontSize: '14px', margin: 0 }}>
                {driverName ?? 'Ryda partner'}
                {driverRating ? ` · ★ ${driverRating.toFixed(1)}` : ''}
              </Text>
              {vehicleModel && licensePlate && (
                <Text style={{ color: '#8A8A95', fontSize: '12px', margin: '2px 0 0' }}>
                  {vehicleModel} · {licensePlate}
                </Text>
              )}
            </Column>
          </Row>

          {/* Fare breakdown */}
          <Section
            style={{
              backgroundColor: '#00FF87',
              color: '#0A0A0B',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
            }}
          >
            <Row>
              <Column>
                <Text
                  style={{
                    color: '#0A0A0B',
                    fontSize: '12px',
                    margin: 0,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Total fare{surgeMultiplier > 1 ? ` · ${surgeMultiplier.toFixed(1)}x surge` : ''}
                </Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text
                  style={{
                    color: '#0A0A0B',
                    fontSize: '24px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {formatFare(farePaise, currency)}
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Button
              href={rideUrl}
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
              View ride
            </Button>
          </Section>

          <Hr style={{ borderColor: '#26262E', margin: '24px 0' }} />

          <Text style={{ color: '#71717A', fontSize: '11px', lineHeight: '16px', margin: 0 }}>
            Ride ID: <span style={{ fontFamily: 'monospace' }}>{rideId}</span>
          </Text>
          <Text style={{ color: '#71717A', fontSize: '11px', lineHeight: '16px', margin: '4px 0 0' }}>
            Need help with this ride? Reply to this email or open the ride in the app to contact
            support.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

RideReceiptTemplate.PreviewProps = {
  passengerName: 'Aarav',
  rideId: 'cly8x1m2h0000qzrm4n2p3k7v',
  pickupAddress: 'MP Nagar, Bhopal',
  dropoffAddress: 'Habibganj Railway Station, Bhopal',
  distanceMeters: 4320,
  durationSeconds: 980,
  farePaise: 14250,
  currency: 'INR',
  surgeMultiplier: 1.2,
  driverName: 'Imran Khan',
  driverRating: 4.9,
  vehicleModel: 'Maruti Dzire',
  licensePlate: 'MP04 GH 3456',
  completedAt: new Date().toISOString(),
  rideUrl: 'http://localhost:3000/receipts/cly8x1m2h0000qzrm4n2p3k7v',
} satisfies RideReceiptTemplateProps;
