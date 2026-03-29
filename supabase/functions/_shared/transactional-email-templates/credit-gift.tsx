/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SoupyLab'
const SITE_URL = 'https://soupylab.lovable.app'

interface CreditGiftProps {
  amount?: number
  reason?: string
}

const CreditGiftEmail = ({ amount = 100, reason }: CreditGiftProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've received {amount} bonus credits on {SITE_NAME}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎁 You've received bonus credits!</Heading>
        <Text style={text}>
          Great news — <strong>{amount} credits</strong> have been added to your {SITE_NAME} account.
        </Text>
        {reason && (
          <Section style={reasonBox}>
            <Text style={reasonText}>"{reason}"</Text>
          </Section>
        )}
        <Text style={text}>
          Use them to build AI modules, run pipelines, generate images, and more.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={`${SITE_URL}/dashboard`}>
            Go to Dashboard
          </Button>
        </Section>
        <Text style={footer}>
          Happy building,<br />The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CreditGiftEmail,
  subject: (data: Record<string, any>) => `🎁 You've received ${data?.amount || 100} bonus credits!`,
  displayName: 'Credit gift notification',
  previewData: { amount: 250, reason: 'Early adopter bonus — thanks for testing!' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Exo 2', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#101720', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 16px' }
const reasonBox = {
  backgroundColor: '#f0fdfa',
  borderLeft: '4px solid #00B4D8',
  padding: '12px 16px',
  margin: '0 0 20px',
  borderRadius: '0 8px 8px 0',
}
const reasonText = { fontSize: '14px', color: '#2d3748', fontStyle: 'italic' as const, margin: '0' }
const buttonSection = { textAlign: 'center' as const, margin: '0 0 32px' }
const button = {
  backgroundColor: '#00B4D8',
  color: '#101720',
  padding: '12px 28px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#718096', margin: '32px 0 0', lineHeight: '1.5' }
