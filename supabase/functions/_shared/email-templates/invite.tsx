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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName} | تمت دعوتك للانضمام</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You've Been Invited</Heading>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Click the button below to accept the invitation and create your account.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>Accept Invitation</Button>
        </Section>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>

        <Hr style={divider} />

        <Heading style={h1Ar}>تمت دعوتك للانضمام</Heading>
        <Text style={textAr}>
          لقد تمت دعوتك للانضمام إلى{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          انقر على الزر أدناه لقبول الدعوة وإنشاء حسابك.
        </Text>
        <Section style={btnWrap}>
          <Button style={button} href={confirmationUrl}>قبول الدعوة</Button>
        </Section>
        <Text style={footerAr}>
          إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذا البريد بأمان.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
