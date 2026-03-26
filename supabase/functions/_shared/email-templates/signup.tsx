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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName} | تأكيد بريدك الإلكتروني</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Brand Header */}
        <Section style={headerSection}>
          <Link href={siteUrl}>
            <Img src={`${siteUrl}/altoha-logo.png`} alt={siteName} width="120" height="40" style={logo} />
          </Link>
        </Section>

        <Heading style={h1}>Welcome to {siteName}! 🎉</Heading>
        <Text style={text}>
          Thanks for joining the global culinary community! Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          ) by clicking the button below:
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>Verify Email Address</Button>
        </Section>
        <Text style={helperText}>
          This link will expire in 24 hours. If the button doesn't work, copy and paste this URL into your browser.
        </Text>
        <Text style={footer}>
          If you didn't create an account on {siteName}, you can safely ignore this email.
        </Text>

        <Hr style={divider} />

        {/* Arabic Version */}
        <Heading style={h1Ar}>مرحبًا بك في {siteName}! 🎉</Heading>
        <Text style={textAr}>
          شكرًا لانضمامك إلى المجتمع الطهوي العالمي! يرجى تأكيد عنوان بريدك الإلكتروني (
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          ) بالنقر على الزر أدناه:
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>تأكيد البريد الإلكتروني</Button>
        </Section>
        <Text style={helperTextAr}>
          سينتهي هذا الرابط خلال 24 ساعة. إذا لم يعمل الزر، انسخ الرابط والصقه في متصفحك.
        </Text>
        <Text style={footerAr}>
          إذا لم تقم بإنشاء حساب في {siteName}، يمكنك تجاهل هذا البريد بأمان.
        </Text>

        <Hr style={divider} />
        <Text style={brandFooter}>© {new Date().getFullYear()} {siteName}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Arabic', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, margin: '0 0 24px', padding: '16px 0', borderBottom: '2px solid hsl(40, 72%, 52%)' }
const logo = { display: 'inline-block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 12%)', margin: '0 0 16px' }
const h1Ar = { ...h1, direction: 'rtl' as const, textAlign: 'right' as const }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 45%)', lineHeight: '1.6', margin: '0 0 24px' }
const textAr = { ...text, direction: 'rtl' as const, textAlign: 'right' as const }
const helperText = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0 0 16px' }
const helperTextAr = { ...helperText, direction: 'rtl' as const, textAlign: 'right' as const }
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
const divider = { borderColor: 'hsl(220, 14%, 90%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
const footerAr = { ...footer, direction: 'rtl' as const, textAlign: 'right' as const }
const brandFooter = { fontSize: '11px', color: '#bbbbbb', textAlign: 'center' as const, margin: '0' }
