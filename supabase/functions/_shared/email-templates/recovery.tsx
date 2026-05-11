/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password · {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>SITDOWN VIENNA</Heading>
        <Heading style={h1}>Reset password · Passwort zurücksetzen</Heading>
        <Text style={text}>
          We received a request to reset your password. Tap the button below to choose a new one.
        </Text>
        <Button style={button} href={confirmationUrl}>Reset password</Button>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request this, ignore this email · your password stays the same.<br />
          Sitdown Vienna · Lavaterstraße 2, Wien
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '13px', letterSpacing: '3px', color: '#C9A46E', margin: '0 0 24px', fontWeight: 'bold' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0D0D0D', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: '#0D0D0D', color: '#E8C48A', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 24px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#eee', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#999', lineHeight: '1.5' }
