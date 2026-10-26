import type { Project, Testimonial } from '../services/publicApi'
export const projects: Project[] = [
  { id: 'install-1', title: 'Successful installation 6.2kWp Solar Panels!', image: '/images/install-6kwp.jpg', alt: 'AIZEK technicians installing a 6.2kWp solar array on a rooftop', approved: true, capacityKwp: 6.2 },
  { id: 'install-2', title: '3.1kWp additional PV array and 5.1kWh battery installation', image: '/images/install-lubao-3kwp.jpg', alt: 'AIZEK technicians mounting solar rails on a roof in Lubao, Pampanga', approved: true, location: 'San Pablo, Lubao, Pampanga', capacityKwp: 3.1 },
  { id: 'install-3', title: 'Project completion! 2.5kWp-5kW-5.1kWh Solar System Package', image: '/images/install-magalang-2kwp.jpg', alt: 'Completed 2.5kWp rooftop solar array in Magalang, Pampanga', approved: true, location: 'Magalang, Pampanga', capacityKwp: 2.5 },
]
export const testimonials: Testimonial[] = []
