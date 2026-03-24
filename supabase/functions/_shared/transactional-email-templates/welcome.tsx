/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Altoha'

interface WelcomeProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME}! | مرحباً بك في ألطهاة!</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* English */}
        <Heading style={h1}>
          {name ? `Welcome aboard, ${name}! 🎉` : 'Welcome to Altoha! 🎉'}
        </Heading>
        <Text style={text}>
          You've joined the premier global culinary community. Here's what you can do:
        </Text>
        <Text style={text}>
          🏆 Compete in culinary competitions{'\n'}
          👨‍🍳 Connect with top chefs worldwide{'\n'}
          📜 Earn certificates and recognition{'\n'}
          🌍 Explore events and exhibitions
        </Text>
        <Button style={button} href="https://altoha.com/dashboard">
          Explore Your Dashboard
        </Button>
        <Text style={footer}>Welcome to the family, The {SITE_NAME} Team</Text>

        <Hr style={divider} />

        {/* Arabic */}
        <Heading style={h1Ar}>
          {name ? `مرحباً بك، ${name}! 🎉` : 'مرحباً بك في ألطهاة! 🎉'}
        </Heading>
        <Text style={textAr}>
          لقد انضممت إلى المجتمع الطهوي العالمي الأول. إليك ما يمكنك فعله:
        </Text>
        <Text style={textAr}>
          🏆 المشاركة في مسابقات الطهي{'\n'}
          👨‍🍳 التواصل مع أفضل الطهاة حول العالم{'\n'}
          📜 الحصول على شهادات وتقدير{'\n'}
          🌍 استكشاف الفعاليات والمعارض
        </Text>
        <Button style={buttonAr} href="https://altoha.com/dashboard">
          استكشف لوحة التحكم
        </Button>
        <Text style={footerAr}>أهلاً بك في العائلة، فريق ألطهاة</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to Altoha! | مرحباً بك في ألطهاة!',
  displayName: 'Welcome email',
  previewData: { name: 'Chef Ahmad' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Arabic', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 12%)', margin: '0 0 16px' }
const h1Ar = { ...h1, direction: 'rtl' as const, textAlign: 'right' as const }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 45%)', lineHeight: '1.6', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const textAr = { ...text, direction: 'rtl' as const, textAlign: 'right' as const }
const button = { backgroundColor: 'hsl(40, 72%, 52%)', color: 'hsl(220, 20%, 8%)', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' as const, margin: '8px 0 24px' }
const buttonAr = { ...button, direction: 'rtl' as const }
const divider = { borderColor: 'hsl(220, 14%, 90%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
const footerAr = { ...footer, direction: 'rtl' as const, textAlign: 'right' as const }
