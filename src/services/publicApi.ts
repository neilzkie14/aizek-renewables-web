import type { EstimateInput, EstimateResult } from '../features/calculator/calculation'
import type { QuoteEstimate } from '../features/calculator/types'
export interface Project { id: string; title: string; image: string; alt: string; approved: boolean; location?: string; capacityKwp?: number }
export interface Testimonial { id: string; displayName: string; text: string; approved: boolean; location?: string }
export interface QuoteRequest { name: string; contact: string; province: string; city: string; system: string; message?: string; consent: boolean; estimate?: QuoteEstimate }
export interface EstimateResponse { input: EstimateInput; result: EstimateResult }
// Future API adapters. No endpoint is called until a backend is configured and verified.
export const publicApi = {
  projects: () => get<Project[]>('/api/v1/public/projects'),
  testimonials: () => get<Testimonial[]>('/api/v1/public/testimonials'),
  calculate: (input: EstimateInput) => post<EstimateResponse>('/api/v1/estimates/calculate', input),
}
async function get<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Unable to load content. Please try again later.')
  return response.json() as Promise<T>
}
async function post<T>(url: string, data: unknown): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  if (!response.ok) throw new Error('Unable to calculate. Please try again later.')
  return response.json() as Promise<T>
}
