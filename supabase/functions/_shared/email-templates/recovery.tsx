/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandMark}>◢ {siteName.toUpperCase()}</Text>
        </Section>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for <strong>{siteName}</strong>. Tap the button to choose a new one.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Reset password
          </Button>
        </Section>
        <Text style={footer}>
          Didn't request this? You can ignore this email — your password stays the same.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Exo 2", "Inter", Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = { borderBottom: '2px solid hsl(185, 100%, 42%)', paddingBottom: '14px', marginBottom: '28px' }
const brandMark = { fontSize: '13px', fontWeight: 'bold' as const, letterSpacing: '0.18em', color: 'hsl(185, 100%, 42%)', margin: 0 }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 8%)', margin: '0 0 18px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: 'hsl(220, 12%, 30%)', lineHeight: '1.6', margin: '0 0 18px' }
const buttonWrap = { margin: '28px 0' }
const button = {
  backgroundColor: 'hsl(185, 100%, 42%)',
  color: 'hsl(220, 25%, 6%)',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 26px',
  textDecoration: 'none',
  letterSpacing: '0.02em',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: 'hsl(220, 12%, 50%)', margin: '36px 0 0', borderTop: '1px solid hsl(220, 15%, 90%)', paddingTop: '18px' }
