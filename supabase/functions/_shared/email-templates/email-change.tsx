/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName} | تأكيد تغيير البريد</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm Your Email Change</Heading>
        <Text style={text}>
          You requested to change your email address for {siteName} from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link> to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>Confirm Email Change</Button>
        </Section>
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately.
        </Text>

        <Hr style={divider} />

        <Heading style={h1Ar}>تأكيد تغيير البريد الإلكتروني</Heading>
        <Text style={textAr}>
          لقد طلبت تغيير عنوان بريدك الإلكتروني في {siteName} من{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link> إلى{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>تأكيد تغيير البريد</Button>
        </Section>
        <Text style={footerAr}>
          إذا لم تطلب هذا التغيير، يرجى تأمين حسابك فورًا.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Arabic', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 12%)', margin: '0 0 16px' }
const h1Ar = { ...h1, direction: 'rtl' as const, textAlign: 'right' as const }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 45%)', lineHeight: '1.6', margin: '0 0 24px' }
const textAr = { ...text, direction: 'rtl' as const, textAlign: 'right' as const }
const link = { color: 'hsl(40, 72%, 52%)', textDecoration: 'underline' }
const btnWrap = { textAlign: 'center' as const, margin: '0 0 24px' }
const button = {
  backgroundColor: 'hsl(40, 72%, 52%)',
  color: 'hsl(220, 20%, 8%)',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '12px 28px',
  textDecoration: 'none',
}
const divider = { borderColor: 'hsl(220, 14%, 90%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
const footerAr = { ...footer, direction: 'rtl' as const, textAlign: 'right' as const }
