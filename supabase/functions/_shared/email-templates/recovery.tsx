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

interface RecoveryEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName} | إعادة تعيين كلمة المرور</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Brand Header */}
        <Section style={headerSection}>
          <Link href={siteUrl}>
            <Img src={`${siteUrl}/altoha-logo.png`} alt={siteName} width="120" height="40" style={logoStyle} />
          </Link>
        </Section>

        <Section style={iconWrap}>
          <Text style={iconText}>🔑</Text>
        </Section>
        <Heading style={h1}>Reset Your Password</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Click the
          button below to choose a new password.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>Reset Password</Button>
        </Section>
        <Text style={helperText}>
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
        </Text>

        <Hr style={divider} />

        {/* Arabic */}
        <Section style={iconWrap}>
          <Text style={iconText}>🔑</Text>
        </Section>
        <Heading style={h1Ar}>إعادة تعيين كلمة المرور</Heading>
        <Text style={textAr}>
          لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك في {siteName}.
          اضغط على الزر أدناه لاختيار كلمة مرور جديدة.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>إعادة تعيين كلمة المرور</Button>
        </Section>
        <Text style={helperTextAr}>
          سينتهي هذا الرابط خلال ساعة واحدة. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد بأمان — ستبقى كلمة مرورك كما هي.
        </Text>

        <Hr style={divider} />
        <Text style={brandFooter}>© {new Date().getFullYear()} {siteName}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
