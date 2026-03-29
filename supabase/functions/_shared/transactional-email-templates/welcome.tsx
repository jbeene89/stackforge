/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SoupyLab'
const SITE_URL = 'https://soupylab.lovable.app'

interface WelcomeProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — let's build something extraordinary</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Welcome aboard, ${name}!` : 'Welcome aboard!'}
        </Heading>
        <Text style={text}>
          You've just joined {SITE_NAME} — the indie AI builder platform where you
          forge, train, and deploy intelligent modules without big-cloud lock-in.
        </Text>
        <Text style={text}>
          Here's what you can do right away:
        </Text>
        <Section style={list}>
          <Text style={listItem}>🔧 Build your first AI module in the Module Builder</Text>
          <Text style={listItem}>🧪 Experiment in the SLM Lab with on-device models</Text>
          <Text style={listItem}>📦 Browse community templates in the Marketplace</Text>
        </Section>
        <Section style={buttonSection}>
          <Button style={button} href={`${SITE_URL}/dashboard`}>
            Go to Dashboard
          </Button>
        </Section>
        <Text style={footer}>
          Happy forging,<br />The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: `Welcome to ${SITE_NAME}!`,
  displayName: 'Welcome email',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

// Brand colors: primary hsl(185 100% 42%) ≈ #00B4D8, foreground hsl(220 20% 8%) ≈ #101720
const main = { backgroundColor: '#ffffff', fontFamily: "'Exo 2', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#101720', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 16px' }
const list = { margin: '0 0 24px' }
const listItem = { fontSize: '15px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '4px' }
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
