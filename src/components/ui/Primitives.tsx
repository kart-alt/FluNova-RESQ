import type { ReactNode } from 'react'
import type { Severity } from '../../types'

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`panel ${className}`}>{children}</section> }
export function StatusDot({ tone = 'green' }: { tone?: 'green' | 'yellow' | 'orange' | 'red' | 'blue' }) { return <span className={`status-dot ${tone}`} aria-hidden="true" /> }
export function SeverityPill({ severity }: { severity: Severity }) { return <span className={`severity-pill ${severity.toLowerCase()}`}>{severity}</span> }
export function SectionLabel({ children }: { children: ReactNode }) { return <p className="section-label">{children}</p> }
