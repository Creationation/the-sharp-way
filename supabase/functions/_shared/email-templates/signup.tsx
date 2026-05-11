/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email · Sitdown Vienna</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>SITDOWN VIENNA</Heading>
        <Heading style={h1}>Welcome · Willkommen</Heading>
        <Text style={text}>
          Thanks for signing up at <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Please confirm <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link> to activate your account.
        </Text>
        <Button style={button} href={confirmationUrl}>Confirm email · E-Mail bestätigen</Button>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't create an account, ignore this email.<br />
          Sitdown Vienna · Lavaterstraße 2, Wien
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '13px', letterSpacing: '3px', color: '#C9A46E', margin: '0 0 24px', fontWeight: 'bold' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0D0D0D', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#C9A46E', textDecoration: 'underline' }
const button = { backgroundColor: '#0D0D0D', color: '#E8C48A', fontSize: '14px', fontWeight: 'bold' as const, borderRadius: '16px', padding: '14px 24px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#eee', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#999', lineHeight: '1.5' }
