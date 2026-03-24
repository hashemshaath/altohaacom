/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Altoha'

interface ContactConfirmationProps {
  name?: string
}

const ContactConfirmationEmail = ({ name }: ContactConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for reaching out to {SITE_NAME} | شكراً لتواصلك مع ألطهاة</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* English */}
        <Heading style={h1}>
          {name ? `Thank you, ${name}!` : 'Thank you for reaching out!'}
        </Heading>
        <Text style={text}>
          We have received your message and will get back to you as soon as possible.
        </Text>
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>

        <Hr style={divider} />

        {/* Arabic */}
        <Heading style={h1Ar}>
          {name ? `شكراً لك، ${name}!` : 'شكراً لتواصلك معنا!'}
        </Heading>
        <Text style={textAr}>
          لقد تلقينا رسالتك وسنعود إليك في أقرب وقت ممكن.
        </Text>
        <Text style={footerAr}>مع أطيب التحيات، فريق ألطهاة</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'Thanks for contacting Altoha | شكراً لتواصلك مع ألطهاة',
  displayName: 'Contact confirmation',
  previewData: { name: 'Chef Ahmad' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Arabic', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 12%)', margin: '0 0 16px' }
const h1Ar = { ...h1, direction: 'rtl' as const, textAlign: 'right' as const }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 45%)', lineHeight: '1.6', margin: '0 0 24px' }
const textAr = { ...text, direction: 'rtl' as const, textAlign: 'right' as const }
const divider = { borderColor: 'hsl(220, 14%, 90%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
const footerAr = { ...footer, direction: 'rtl' as const, textAlign: 'right' as const }
