/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Altoha'

interface PasswordChangedProps {
  name?: string
}

const PasswordChangedEmail = ({ name }: PasswordChangedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your password has been changed | تم تغيير كلمة المرور</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* English */}
        <Section style={iconWrap}>
          <Text style={iconText}>🔒</Text>
        </Section>
        <Heading style={h1}>Password Changed</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hello,'}{'\n\n'}
          Your password for {SITE_NAME} has been successfully changed.
          If you made this change, no further action is needed.
        </Text>
        <Text style={warningText}>
          ⚠️ If you did not change your password, please secure your account immediately by resetting your password or contacting our support team.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>

        <Hr style={divider} />

        {/* Arabic */}
        <Section style={iconWrap}>
          <Text style={iconText}>🔒</Text>
        </Section>
        <Heading style={h1Ar}>تم تغيير كلمة المرور</Heading>
        <Text style={textAr}>
          {name ? `مرحبًا ${name}،` : 'مرحبًا،'}{'\n\n'}
          تم تغيير كلمة المرور الخاصة بك في {SITE_NAME} بنجاح.
          إذا قمت بهذا التغيير، فلا حاجة لاتخاذ أي إجراء إضافي.
        </Text>
        <Text style={warningTextAr}>
          ⚠️ إذا لم تقم بتغيير كلمة المرور، يرجى تأمين حسابك فورًا عن طريق إعادة تعيين كلمة المرور أو التواصل مع فريق الدعم.
        </Text>
        <Text style={footerAr}>— فريق {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PasswordChangedEmail,
  subject: 'Password Changed | تم تغيير كلمة المرور',
  displayName: 'Password changed confirmation',
  previewData: { name: 'Ahmad' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Arabic', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const iconWrap = { textAlign: 'center' as const, margin: '0 0 8px' }
const iconText = { fontSize: '36px', margin: '0', lineHeight: '1' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 12%)', margin: '0 0 16px' }
const h1Ar = { ...h1, direction: 'rtl' as const, textAlign: 'right' as const }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 45%)', lineHeight: '1.6', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const textAr = { ...text, direction: 'rtl' as const, textAlign: 'right' as const }
const warningText = { fontSize: '13px', color: 'hsl(0, 72%, 50%)', lineHeight: '1.6', margin: '0 0 24px', backgroundColor: 'hsl(0, 72%, 97%)', padding: '12px 16px', borderRadius: '8px', border: '1px solid hsl(0, 72%, 90%)' }
const warningTextAr = { ...warningText, direction: 'rtl' as const, textAlign: 'right' as const }
const divider = { borderColor: 'hsl(220, 14%, 90%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
const footerAr = { ...footer, direction: 'rtl' as const, textAlign: 'right' as const }
