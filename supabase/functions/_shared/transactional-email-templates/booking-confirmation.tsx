/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Altoha'

interface BookingConfirmationProps {
  name?: string
  bookingType?: string
  bookingDate?: string
  bookingNumber?: string
}

const BookingConfirmationEmail = ({ name, bookingType, bookingDate, bookingNumber }: BookingConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your booking is confirmed — {SITE_NAME} | تأكيد حجزك — ألطهاة</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* English */}
        <Heading style={h1}>
          {name ? `Booking Confirmed, ${name}!` : 'Your Booking is Confirmed!'}
        </Heading>
        <Text style={text}>
          Thank you for your reservation. Here are your booking details:
        </Text>
        {bookingNumber && <Text style={detail}><strong>Booking #:</strong> {bookingNumber}</Text>}
        {bookingType && <Text style={detail}><strong>Type:</strong> {bookingType}</Text>}
        {bookingDate && <Text style={detail}><strong>Date:</strong> {bookingDate}</Text>}
        <Text style={text}>
          If you need to make changes, please contact our team.
        </Text>
        <Button style={button} href={`https://altoha.com/dashboard`}>
          View My Bookings
        </Button>
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>

        <Hr style={divider} />

        {/* Arabic */}
        <Heading style={h1Ar}>
          {name ? `تم تأكيد الحجز، ${name}!` : 'تم تأكيد حجزك!'}
        </Heading>
        <Text style={textAr}>
          شكراً لحجزك. إليك تفاصيل الحجز:
        </Text>
        {bookingNumber && <Text style={detailAr}><strong>رقم الحجز:</strong> {bookingNumber}</Text>}
        {bookingType && <Text style={detailAr}><strong>النوع:</strong> {bookingType}</Text>}
        {bookingDate && <Text style={detailAr}><strong>التاريخ:</strong> {bookingDate}</Text>}
        <Text style={textAr}>
          إذا كنت بحاجة لإجراء أي تغييرات، يرجى التواصل مع فريقنا.
        </Text>
        <Button style={buttonAr} href={`https://altoha.com/dashboard`}>
          عرض حجوزاتي
        </Button>
        <Text style={footerAr}>مع أطيب التحيات، فريق ألطهاة</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingConfirmationEmail,
  subject: (data: Record<string, any>) =>
    data.bookingNumber
      ? `Booking #${data.bookingNumber} Confirmed | تأكيد الحجز #${data.bookingNumber}`
      : 'Your Booking is Confirmed | تم تأكيد حجزك',
  displayName: 'Booking confirmation',
  previewData: { name: 'Chef Ahmad', bookingType: 'Competition Entry', bookingDate: '2026-04-15', bookingNumber: 'BK-20260415' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Noto Sans Arabic', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 12%)', margin: '0 0 16px' }
const h1Ar = { ...h1, direction: 'rtl' as const, textAlign: 'right' as const }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 45%)', lineHeight: '1.6', margin: '0 0 16px' }
const textAr = { ...text, direction: 'rtl' as const, textAlign: 'right' as const }
const detail = { fontSize: '14px', color: 'hsl(220, 20%, 12%)', lineHeight: '1.6', margin: '0 0 4px' }
const detailAr = { ...detail, direction: 'rtl' as const, textAlign: 'right' as const }
const button = { backgroundColor: 'hsl(40, 72%, 52%)', color: 'hsl(220, 20%, 8%)', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none', display: 'inline-block' as const, margin: '8px 0 24px' }
const buttonAr = { ...button, direction: 'rtl' as const }
const divider = { borderColor: 'hsl(220, 14%, 90%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
const footerAr = { ...footer, direction: 'rtl' as const, textAlign: 'right' as const }
