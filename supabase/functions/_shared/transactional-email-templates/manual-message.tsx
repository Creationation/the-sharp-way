import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Sitdown Vienna'

interface ManualMessageProps {
  subject?: string
  message?: string
  recipientName?: string
}

const ManualMessageEmail = ({ subject, message, recipientName }: ManualMessageProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{subject || `Message from ${SITE_NAME}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{subject || `Message from ${SITE_NAME}`}</Heading>
        {recipientName ? <Text style={text}>Hi {recipientName},</Text> : null}
        {(message || '').split('\n').map((line, i) => (
          <Text key={i} style={text}>{line || '\u00A0'}</Text>
        ))}
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} · Lavaterstraße 2, Wien</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ManualMessageEmail,
  subject: (data: Record<string, any>) => data?.subject || `Message from ${SITE_NAME}`,
  displayName: 'Manual message',
  previewData: { subject: 'Hello from Sitdown Vienna', message: 'This is a test message.', recipientName: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0D0D0D', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0 0 12px' }
const hr = { borderColor: '#eee', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999' }
