/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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

interface ReauthenticationEmailProps {
  siteName: string
  siteUrl: string
  token: string
}

export const ReauthenticationEmail = ({
  siteName,
  siteUrl,
  token,
}: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code for {siteName} | رمز التحقق</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Link href={siteUrl}>
            <Img src={`${siteUrl}/altoha-logo.png`} alt={siteName} width="120" height="40" style={logoStyle} />
          </Link>
        </Section>

        <Section style={iconWrap}>
          <Text style={iconText}>🔐</Text>
        </Section>
        <Heading style={h1}>Verification Code</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Section style={codeContainer}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={helperText}>
          This code will expire in 10 minutes. If you didn't request this, please secure your account immediately.
        </Text>

        <Hr style={divider} />

        <Heading style={h1Ar}>رمز التحقق</Heading>
        <Text style={textAr}>استخدم الرمز أدناه لتأكيد هويتك:</Text>
        <Section style={codeContainer}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={helperTextAr}>
          سينتهي هذا الرمز خلال 10 دقائق. إذا لم تطلب هذا، يرجى تأمين حسابك فورًا.
        </Text>

        <Hr style={divider} />
        <Text style={brandFooter}>© {new Date().getFullYear()} {siteName}. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeContainer = { textAlign: 'center' as const, margin: '0 0 24px', backgroundColor: 'hsl(220, 14%, 96%)', padding: '16px', borderRadius: '12px', border: '1px solid hsl(220, 14%, 90%)' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: 'hsl(40, 72%, 52%)',
  textAlign: 'center' as const,
  letterSpacing: '8px',
  margin: '0',
}
const helperText = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0 0 16px' }
const helperTextAr = { ...helperText, direction: 'rtl' as const, textAlign: 'right' as const }
const divider = { borderColor: 'hsl(220, 14%, 90%)', margin: '28px 0' }
const brandFooter = { fontSize: '11px', color: '#bbbbbb', textAlign: 'center' as const, margin: '0' }
