/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
  siteName?: string
}

export const ReauthenticationEmail = ({ token, siteName = 'SoupyLab' }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code: {token}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandMark}>◢ {siteName.toUpperCase()}</Text>
        </Section>
        <Heading style={h1}>Confirm it's you</Heading>
        <Text style={text}>Use the code below to verify your identity:</Text>
        <Section style={codeWrap}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Text style={footer}>
          This code expires shortly. Didn't request this? You can ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Exo 2", "Inter", Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = { borderBottom: '2px solid hsl(185, 100%, 42%)', paddingBottom: '14px', marginBottom: '28px' }
const brandMark = { fontSize: '13px', fontWeight: 'bold' as const, letterSpacing: '0.18em', color: 'hsl(185, 100%, 42%)', margin: 0 }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 8%)', margin: '0 0 18px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: 'hsl(220, 12%, 30%)', lineHeight: '1.6', margin: '0 0 18px' }
const codeWrap = { backgroundColor: 'hsl(220, 14%, 96%)', borderLeft: '3px solid hsl(185, 100%, 42%)', borderRadius: '6px', padding: '18px 22px', margin: '20px 0 28px', textAlign: 'center' as const }
const codeStyle = {
  fontFamily: '"Space Mono", "Courier New", monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: 'hsl(220, 20%, 8%)',
  margin: 0,
  letterSpacing: '0.3em',
}
const footer = { fontSize: '12px', color: 'hsl(220, 12%, 50%)', margin: '36px 0 0', borderTop: '1px solid hsl(220, 15%, 90%)', paddingTop: '18px' }
