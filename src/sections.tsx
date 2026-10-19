import type { SiteContent } from './types'
import { AddButton, Card, Field, ImageField, Lines, slug } from './ui'

function move<T>(items: T[], index: number, direction: -1 | 1) {
  const next = index + direction
  if (next < 0 || next >= items.length) return items
  const copy = items.slice()
  const [item] = copy.splice(index, 1)
  copy.splice(next, 0, item)
  return copy
}

export function CompanyEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const company = content.company
  const set = (patch: Partial<SiteContent['company']>) => onChange({ ...content, company: { ...company, ...patch } })
  return (
    <div className="grid gap-4">
      <Field label="Name" value={company.name} onChange={(name) => set({ name })} />
      <Field label="Tagline" value={company.tagline} onChange={(tagline) => set({ tagline })} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Email" value={company.email} onChange={(email) => set({ email })} />
        <Field label="Phone" value={company.phone} onChange={(phone) => set({ phone })} />
      </div>
      <Field label="Location" value={company.location} onChange={(location) => set({ location })} />
      <Field label="Website" value={company.website} onChange={(website) => set({ website })} hint="Shown on the contact section. Include https://" />
      <div className="grid gap-3">
        {company.socials.map((social, index) => (
          <Card
            key={index}
            title={social.label || 'Social link'}
            onRemove={() => set({ socials: company.socials.filter((_, i) => i !== index) })}
            onUp={() => set({ socials: move(company.socials, index, -1) })}
            onDown={() => set({ socials: move(company.socials, index, 1) })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Label" value={social.label} onChange={(label) => set({ socials: company.socials.map((item, i) => (i === index ? { ...item, label } : item)) })} />
              <Field label="URL" value={social.href} onChange={(href) => set({ socials: company.socials.map((item, i) => (i === index ? { ...item, href } : item)) })} />
            </div>
          </Card>
        ))}
        <AddButton label="Add social link" onClick={() => set({ socials: [...company.socials, { label: 'Link', href: 'https://' }] })} />
      </div>
    </div>
  )
}

export function NavigationEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const links = content.navLinks
  const set = (navLinks: SiteContent['navLinks']) => onChange({ ...content, navLinks })
  return (
    <div className="grid gap-3">
      {links.map((link, index) => (
        <Card
          key={index}
          title={link.label || 'Link'}
          onRemove={() => set(links.filter((_, i) => i !== index))}
          onUp={() => set(move(links, index, -1))}
          onDown={() => set(move(links, index, 1))}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Label" value={link.label} onChange={(label) => set(links.map((item, i) => (i === index ? { ...item, label } : item)))} />
            <Field label="Link" value={link.href} onChange={(href) => set(links.map((item, i) => (i === index ? { ...item, href } : item)))} hint="Use #about for a section on the page." />
          </div>
        </Card>
      ))}
      <AddButton label="Add link" onClick={() => set([...links, { label: 'New', href: '#about' }])} />
    </div>
  )
}

export function HeroEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const hero = content.hero
  const set = (patch: Partial<SiteContent['hero']>) => onChange({ ...content, hero: { ...hero, ...patch } })
  return (
    <div className="grid gap-4">
      <Field label="Eyebrow" value={hero.eyebrow} onChange={(eyebrow) => set({ eyebrow })} />
      <Lines label="Headline" value={hero.headline} onChange={(headline) => set({ headline })} hint="Each line of the headline." />
      <Field label="Body" value={hero.body} onChange={(body) => set({ body })} multiline />
      <ImageField label="Image" value={hero.image} onChange={(image) => set({ image })} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Primary button" value={hero.primaryCta.label} onChange={(label) => set({ primaryCta: { ...hero.primaryCta, label } })} />
        <Field label="Primary link" value={hero.primaryCta.href} onChange={(href) => set({ primaryCta: { ...hero.primaryCta, href } })} />
        <Field label="Secondary button" value={hero.secondaryCta.label} onChange={(label) => set({ secondaryCta: { ...hero.secondaryCta, label } })} />
        <Field label="Secondary link" value={hero.secondaryCta.href} onChange={(href) => set({ secondaryCta: { ...hero.secondaryCta, href } })} />
      </div>
    </div>
  )
}

export function AboutEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const about = content.about
  const set = (patch: Partial<SiteContent['about']>) => onChange({ ...content, about: { ...about, ...patch } })
  return (
    <div className="grid gap-4">
      <Field label="Eyebrow" value={about.eyebrow} onChange={(eyebrow) => set({ eyebrow })} />
      <Lines label="Headline" value={about.headline} onChange={(headline) => set({ headline })} />
      <Field label="Body" value={about.body} onChange={(body) => set({ body })} multiline />
      <Lines label="Paragraphs" value={about.paragraphs} onChange={(paragraphs) => set({ paragraphs })} hint="Longer copy under the intro." />
      <Lines label="Stages" value={about.stages} onChange={(stages) => set({ stages })} hint="Shown as Establish → Operate → Grow." />
      <div className="grid gap-4 md:grid-cols-3">
        <ImageField label="About image" value={about.image} onChange={(image) => set({ image })} />
        <ImageField label="Vision image" value={about.visionImage} onChange={(visionImage) => set({ visionImage })} />
        <ImageField label="Values image" value={about.valuesImage} onChange={(valuesImage) => set({ valuesImage })} />
      </div>
      <Field label="Vision title" value={about.vision.title} onChange={(title) => set({ vision: { ...about.vision, title } })} />
      <Field label="Vision" value={about.vision.body} onChange={(body) => set({ vision: { ...about.vision, body } })} multiline />
      <Field label="Mission title" value={about.mission.title} onChange={(title) => set({ mission: { ...about.mission, title } })} />
      <Field label="Mission" value={about.mission.body} onChange={(body) => set({ mission: { ...about.mission, body } })} multiline />
      <div className="grid gap-3">
        {about.values.map((value, index) => (
          <Card
            key={index}
            title={value.title || 'Value'}
            onRemove={() => set({ values: about.values.filter((_, i) => i !== index) })}
            onUp={() => set({ values: move(about.values, index, -1) })}
            onDown={() => set({ values: move(about.values, index, 1) })}
          >
            <Field label="Title" value={value.title} onChange={(title) => set({ values: about.values.map((item, i) => (i === index ? { ...item, title } : item)) })} />
            <Field label="Body" value={value.body} onChange={(body) => set({ values: about.values.map((item, i) => (i === index ? { ...item, body } : item)) })} multiline />
          </Card>
        ))}
        <AddButton label="Add value" onClick={() => set({ values: [...about.values, { title: 'New value', body: '' }] })} />
      </div>
      <div className="grid gap-3">
        {about.stats.map((stat, index) => (
          <Card
            key={index}
            title={stat.label || 'Stat'}
            onRemove={() => set({ stats: about.stats.filter((_, i) => i !== index) })}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Value" value={String(stat.value)} onChange={(value) => set({ stats: about.stats.map((item, i) => (i === index ? { ...item, value: Number(value) || 0 } : item)) })} />
              <Field label="Suffix" value={stat.suffix} onChange={(suffix) => set({ stats: about.stats.map((item, i) => (i === index ? { ...item, suffix } : item)) })} />
              <Field label="Label" value={stat.label} onChange={(label) => set({ stats: about.stats.map((item, i) => (i === index ? { ...item, label } : item)) })} />
            </div>
          </Card>
        ))}
        <AddButton label="Add stat" onClick={() => set({ stats: [...about.stats, { value: 0, suffix: '+', label: 'New stat' }] })} />
      </div>
    </div>
  )
}

export function ServicesEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const services = content.services
  const set = (next: SiteContent['services']) => onChange({ ...content, services: next })
  return (
    <div className="grid gap-3">
      {services.map((service, index) => (
        <Card
          key={service.id}
          title={`${service.number} ${service.name}`}
          onRemove={() => set(services.filter((_, i) => i !== index))}
          onUp={() => set(move(services, index, -1))}
          onDown={() => set(move(services, index, 1))}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Number" value={service.number} onChange={(number) => set(services.map((item, i) => (i === index ? { ...item, number } : item)))} />
            <Field label="Name" value={service.name} onChange={(name) => set(services.map((item, i) => (i === index ? { ...item, name } : item)))} />
            <Field label="Id" value={service.id} onChange={(id) => set(services.map((item, i) => (i === index ? { ...item, id } : item)))} hint="consulting, logistics, recruitment, finance, or legal keeps the matching visual." />
          </div>
          <Field label="Title" value={service.title} onChange={(title) => set(services.map((item, i) => (i === index ? { ...item, title } : item)))} />
          <Field label="Description" value={service.description} onChange={(description) => set(services.map((item, i) => (i === index ? { ...item, description } : item)))} multiline />
          <Lines label="Concept" value={service.concept} onChange={(concept) => set(services.map((item, i) => (i === index ? { ...item, concept } : item)))} />
          <Lines label="Capabilities" value={service.capabilities} onChange={(capabilities) => set(services.map((item, i) => (i === index ? { ...item, capabilities } : item)))} />
          <ImageField label="Image" value={service.image} onChange={(image) => set(services.map((item, i) => (i === index ? { ...item, image } : item)))} />
        </Card>
      ))}
      <AddButton
        label="Add service"
        onClick={() =>
          set([
            ...services,
            {
              id: `service-${services.length + 1}`,
              number: String(services.length + 1).padStart(2, '0'),
              name: 'New service',
              concept: ['One', 'Two', 'Three'],
              title: 'New service title.',
              description: '',
              capabilities: [],
              image: '/profile/vision.jpg',
            },
          ])
        }
      />
    </div>
  )
}

export function ClientsEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const clients = content.clients
  const set = (next: SiteContent['clients']) => onChange({ ...content, clients: next })
  return (
    <div className="grid gap-3">
      {clients.map((client, index) => (
        <Card key={index} title={client.name || 'Client'} onRemove={() => set(clients.filter((_, i) => i !== index))} onUp={() => set(move(clients, index, -1))} onDown={() => set(move(clients, index, 1))}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" value={client.name} onChange={(name) => set(clients.map((item, i) => (i === index ? { ...item, name } : item)))} />
            <Field label="Mark" value={client.mark} onChange={(mark) => set(clients.map((item, i) => (i === index ? { ...item, mark } : item)))} />
          </div>
          <ImageField label="Logo" value={client.logo ?? ''} onChange={(logo) => set(clients.map((item, i) => (i === index ? { ...item, logo: logo || undefined } : item)))} />
        </Card>
      ))}
      <AddButton label="Add client" onClick={() => set([...clients, { name: 'New client', mark: 'CLIENT' }])} />
    </div>
  )
}

export function TestimonialsEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const items = content.testimonials
  const set = (testimonials: SiteContent['testimonials']) => onChange({ ...content, testimonials })
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <Card key={index} title={item.name || 'Testimonial'} onRemove={() => set(items.filter((_, i) => i !== index))} onUp={() => set(move(items, index, -1))} onDown={() => set(move(items, index, 1))}>
          <Field label="Quote" value={item.quote} onChange={(quote) => set(items.map((entry, i) => (i === index ? { ...entry, quote } : entry)))} multiline />
          <Field label="Detail" value={item.detail} onChange={(detail) => set(items.map((entry, i) => (i === index ? { ...entry, detail } : entry)))} multiline />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" value={item.name} onChange={(name) => set(items.map((entry, i) => (i === index ? { ...entry, name } : entry)))} />
            <Field label="Role" value={item.role} onChange={(role) => set(items.map((entry, i) => (i === index ? { ...entry, role } : entry)))} />
            <Field label="Company" value={item.company} onChange={(company) => set(items.map((entry, i) => (i === index ? { ...entry, company } : entry)))} />
            <Field label="Mark" value={item.mark} onChange={(mark) => set(items.map((entry, i) => (i === index ? { ...entry, mark } : entry)))} />
          </div>
          <ImageField label="Logo" value={item.logo} onChange={(logo) => set(items.map((entry, i) => (i === index ? { ...entry, logo } : entry)))} />
        </Card>
      ))}
      <AddButton label="Add testimonial" onClick={() => set([...items, { quote: '', detail: '', name: 'Name', role: 'Client', company: 'Company', mark: 'MARK', logo: '' }])} />
    </div>
  )
}

export function WhyEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const why = content.whyChoose
  const set = (patch: Partial<SiteContent['whyChoose']>) => onChange({ ...content, whyChoose: { ...why, ...patch } })
  return (
    <div className="grid gap-4">
      <Field label="Eyebrow" value={why.eyebrow} onChange={(eyebrow) => set({ eyebrow })} />
      <Lines label="Headline" value={why.headline} onChange={(headline) => set({ headline })} />
      <Field label="Body" value={why.body} onChange={(body) => set({ body })} multiline />
      <ImageField label="Image" value={why.image} onChange={(image) => set({ image })} />
      {why.items.map((item, index) => (
        <Card
          key={index}
          title={item.title || 'Reason'}
          onRemove={() => set({ items: why.items.filter((_, i) => i !== index) })}
          onUp={() => set({ items: move(why.items, index, -1) })}
          onDown={() => set({ items: move(why.items, index, 1) })}
        >
          <Field label="Title" value={item.title} onChange={(title) => set({ items: why.items.map((entry, i) => (i === index ? { ...entry, title } : entry)) })} />
          <Field label="Body" value={item.body} onChange={(body) => set({ items: why.items.map((entry, i) => (i === index ? { ...entry, body } : entry)) })} multiline />
          <ImageField label="Image" value={item.image} onChange={(image) => set({ items: why.items.map((entry, i) => (i === index ? { ...entry, image } : entry)) })} />
        </Card>
      ))}
      <AddButton label="Add reason" onClick={() => set({ items: [...why.items, { title: 'New reason', body: '', image: '/profile/why-local.jpg' }] })} />
    </div>
  )
}

export function TeamEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const team = content.team
  const set = (next: SiteContent['team']) => onChange({ ...content, team: next })
  return (
    <div className="grid gap-3">
      {team.map((person, index) => (
        <Card key={index} title={person.name || 'Team member'} onRemove={() => set(team.filter((_, i) => i !== index))} onUp={() => set(move(team, index, -1))} onDown={() => set(move(team, index, 1))}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" value={person.name} onChange={(name) => set(team.map((item, i) => (i === index ? { ...item, name } : item)))} />
            <Field label="Role" value={person.role} onChange={(role) => set(team.map((item, i) => (i === index ? { ...item, role } : item)))} />
          </div>
          <Field label="Bio" value={person.bio} onChange={(bio) => set(team.map((item, i) => (i === index ? { ...item, bio } : item)))} multiline />
          <div className="grid gap-4 md:grid-cols-2">
            <ImageField label="Photo" value={person.image} onChange={(image) => set(team.map((item, i) => (i === index ? { ...item, image } : item)))} />
            <Field label="LinkedIn" value={person.linkedin} onChange={(linkedin) => set(team.map((item, i) => (i === index ? { ...item, linkedin } : item)))} />
          </div>
        </Card>
      ))}
      <AddButton label="Add team member" onClick={() => set([...team, { name: 'New member', role: 'Role', bio: '', image: '/team/team-1.png', linkedin: 'https://www.linkedin.com' }])} />
    </div>
  )
}

export function CareersEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const careers = content.careers
  const set = (patch: Partial<SiteContent['careers']>) => onChange({ ...content, careers: { ...careers, ...patch } })
  return (
    <div className="grid gap-4">
      <Field label="Headline" value={careers.headline} onChange={(headline) => set({ headline })} />
      <Field label="Body" value={careers.body} onChange={(body) => set({ body })} multiline />
      <Lines label="Benefits" value={careers.benefits} onChange={(benefits) => set({ benefits })} />
      {careers.jobs.map((job, index) => (
        <Card
          key={job.id}
          title={job.title || 'Role'}
          onRemove={() => set({ jobs: careers.jobs.filter((_, i) => i !== index) })}
          onUp={() => set({ jobs: move(careers.jobs, index, -1) })}
          onDown={() => set({ jobs: move(careers.jobs, index, 1) })}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" value={job.title} onChange={(title) => set({ jobs: careers.jobs.map((item, i) => (i === index ? { ...item, title, id: item.id || slug(title) } : item)) })} />
            <Field label="Id" value={job.id} onChange={(id) => set({ jobs: careers.jobs.map((item, i) => (i === index ? { ...item, id } : item)) })} />
            <Field label="Department" value={job.department} onChange={(department) => set({ jobs: careers.jobs.map((item, i) => (i === index ? { ...item, department } : item)) })} />
            <Field label="Location" value={job.location} onChange={(location) => set({ jobs: careers.jobs.map((item, i) => (i === index ? { ...item, location } : item)) })} />
            <Field label="Type" value={job.type} onChange={(type) => set({ jobs: careers.jobs.map((item, i) => (i === index ? { ...item, type } : item)) })} />
          </div>
          <Field label="Summary" value={job.summary} onChange={(summary) => set({ jobs: careers.jobs.map((item, i) => (i === index ? { ...item, summary } : item)) })} />
          <Field label="Description" value={job.description} onChange={(description) => set({ jobs: careers.jobs.map((item, i) => (i === index ? { ...item, description } : item)) })} multiline />
          <Lines label="Responsibilities" value={job.responsibilities} onChange={(responsibilities) => set({ jobs: careers.jobs.map((item, i) => (i === index ? { ...item, responsibilities } : item)) })} />
          <Lines label="Requirements" value={job.requirements} onChange={(requirements) => set({ jobs: careers.jobs.map((item, i) => (i === index ? { ...item, requirements } : item)) })} />
        </Card>
      ))}
      <AddButton
        label="Add role"
        onClick={() =>
          set({
            jobs: [
              ...careers.jobs,
              {
                id: `role-${careers.jobs.length + 1}`,
                title: 'New role',
                department: 'Consulting',
                location: 'Addis Ababa',
                type: 'Full-time',
                summary: '',
                description: '',
                responsibilities: [],
                requirements: [],
              },
            ],
          })
        }
      />
    </div>
  )
}

export function InsightsEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const insights = content.insights
  const setInsights = (next: SiteContent['insights']) => onChange({ ...content, insights: next })
  return (
    <div className="grid gap-4">
      <Lines label="Categories" value={content.insightCategories} onChange={(insightCategories) => onChange({ ...content, insightCategories })} hint="Include All if the filter should show everything." />
      {insights.map((item, index) => (
        <Card key={item.id} title={item.title || 'Article'} onRemove={() => setInsights(insights.filter((_, i) => i !== index))} onUp={() => setInsights(move(insights, index, -1))} onDown={() => setInsights(move(insights, index, 1))}>
          <Field label="Title" value={item.title} onChange={(title) => setInsights(insights.map((entry, i) => (i === index ? { ...entry, title } : entry)))} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Id" value={item.id} onChange={(id) => setInsights(insights.map((entry, i) => (i === index ? { ...entry, id } : entry)))} />
            <Field label="Category" value={item.category} onChange={(category) => setInsights(insights.map((entry, i) => (i === index ? { ...entry, category } : entry)))} />
            <Field label="Date" value={item.date} onChange={(date) => setInsights(insights.map((entry, i) => (i === index ? { ...entry, date } : entry)))} />
            <Field label="Read time" value={item.readTime} onChange={(readTime) => setInsights(insights.map((entry, i) => (i === index ? { ...entry, readTime } : entry)))} />
          </div>
          <Field label="Description" value={item.description} onChange={(description) => setInsights(insights.map((entry, i) => (i === index ? { ...entry, description } : entry)))} multiline />
          <ImageField label="Image" value={item.image} onChange={(image) => setInsights(insights.map((entry, i) => (i === index ? { ...entry, image } : entry)))} />
        </Card>
      ))}
      <AddButton
        label="Add article"
        onClick={() =>
          setInsights([
            ...insights,
            {
              id: slug(`article-${insights.length + 1}`),
              category: 'Business',
              date: 'Oct 07, 2026',
              title: 'New article',
              description: '',
              image: '/insights/insight-1.png',
              readTime: '4 min read',
            },
          ])
        }
      />
    </div>
  )
}

export function AssistantEditor({ content, onChange }: { content: SiteContent; onChange: (content: SiteContent) => void }) {
  const assistant = content.assistant
  const set = (patch: Partial<SiteContent['assistant']>) => onChange({ ...content, assistant: { ...assistant, ...patch } })
  return (
    <div className="grid gap-4">
      <Field label="Welcome message" value={assistant.welcome} onChange={(welcome) => set({ welcome })} multiline />
      <Lines label="Suggestions" value={assistant.suggestions} onChange={(suggestions) => set({ suggestions })} />
    </div>
  )
}
