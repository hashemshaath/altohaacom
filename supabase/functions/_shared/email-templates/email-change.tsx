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
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  siteUrl: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  siteUrl,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName} | تأكيد تغيير البريد</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Link href={siteUrl}>
            <Img src={`${siteUrl}/altoha-logo.png`} alt={siteName} width="120" height="40" style={logoStyle} />
          </Link>
        </Section>

        <Section style={iconWrap}>
          <Text style={iconText}>📧</Text>
        </Section>
        <Heading style={h1}>Confirm Your Email Change</Heading>
        <Text style={text}>
          You requested to change your email address for {siteName} from{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link> to{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>Confirm Email Change</Button>
        </Section>
        <Text style={warningText}>
          ⚠️ If you didn't request this change, please secure your account immediately by changing your password.
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
        <Text style={warningTextAr}>
          ⚠️ إذا لم تطلب هذا التغيير، يرجى تأمين حسابك فورًا عن طريق تغيير كلمة المرور.
        </Text>

        <Hr style={divider} />
        <Text style={brandFooter}>© {new Date().getFullYear()} {siteName}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Arabic', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, margin: '0 0 24px', padding: '16px 0', borderBottom: '2px solid hsl(40, 72%, 52%)' }
const logoStyle = { display: 'inline-block' as const }
const iconWrap = { textAlign: 'center' as const, margin: '0 0 8px' }
const iconText = { fontSize: '36px', margin: '0', lineHeight: '1' }
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
  borderRadius: '12px',
  padding: '14px 32px',
  textDecoration: 'none',
}
const warningText = { fontSize: '13px', color: 'hsl(0, 72%, 50%)', lineHeight: '1.6', margin: '0 0 24px', backgroundColor: 'hsl(0, 72%, 97%)', padding: '12px 16px', borderRadius: '8px', border: '1px solid hsl(0, 72%, 90%)' }
const warningTextAr = { ...warningText, direction: 'rtl' as const, textAlign: 'right' as const }
const divider = { borderColor: 'hsl(220, 14%, 90%)', margin: '28px 0' }
const brandFooter = { fontSize: '11px', color: '#bbbbbb', textAlign: 'center' as const, margin: '0' }
