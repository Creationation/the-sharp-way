/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link · {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>SITDOWN VIENNA</Heading>
        <Heading style={h1}>Log in · Anmelden</Heading>
        <Text style={text}>
          Tap the button below to log in. This link expires shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>Log in</Button>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request this, ignore this email.<br />
          Sitdown Vienna · Lavaterstraße 2, Wien
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '13px', letterSpacing: '3px', color: '#C9A46E', margin: '0 0 24px', fontWeight: 'bold' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0D0D0D', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: '#0D0D0D', color: '#E8C48A', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 24px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#eee', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#999', lineHeight: '1.5' }
