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

interface MagicLinkEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for {siteName} | رابط تسجيل الدخول</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Link href={siteUrl}>
            <Img src={`${siteUrl}/altoha-logo.png`} alt={siteName} width="120" height="40" style={logoStyle} />
          </Link>
        </Section>

        <Section style={iconWrap}>
          <Text style={iconText}>🔗</Text>
        </Section>
        <Heading style={h1}>Your Login Link</Heading>
        <Text style={text}>
          Click the button below to log in to {siteName}. This link will expire shortly.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>Log In to {siteName}</Button>
        </Section>
        <Text style={helperText}>
          If you didn't request this link, you can safely ignore this email.
        </Text>

        <Hr style={divider} />

        <Heading style={h1Ar}>رابط تسجيل الدخول</Heading>
        <Text style={textAr}>
          انقر على الزر أدناه لتسجيل الدخول إلى {siteName}. سينتهي هذا الرابط قريبًا.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>تسجيل الدخول</Button>
        </Section>
        <Text style={helperTextAr}>
          إذا لم تطلب هذا الرابط، يمكنك تجاهل هذا البريد بأمان.
        </Text>

        <Hr style={divider} />
        <Text style={brandFooter}>© {new Date().getFullYear()} {siteName}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
const helperText = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0 0 16px' }
const helperTextAr = { ...helperText, direction: 'rtl' as const, textAlign: 'right' as const }
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
const brandFooter = { fontSize: '11px', color: '#bbbbbb', textAlign: 'center' as const, margin: '0' }
