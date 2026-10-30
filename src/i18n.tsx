import { createContext, useContext, type ReactNode } from 'react'
import type { ContentLocale, SectionId } from './types'

type CmsCopy = {
  loading: string
  contentStudio: string
  signIn: string
  welcomeBack: string
  couldNotSignIn: string
  editWebsite: string
  email: string
  password: string
  passwordLabel: string
  signingIn: string
  signOut: string
  signedOut: string
  viewSite: string
  save: string
  saving: string
  pages: string
  admin: string
  users: string
  editing: string
  loadingContent: string
  contentLanguage: string
  discardChanges: string
  contentSaved: string
  couldNotSave: string
  couldNotLoad: string
  createUser: string
  creating: string
  userCreated: string
  userDeleted: string
  deleteUser: string
  deleteThisUser: string
  role: string
  editor: string
  adminRole: string
  you: string
  fieldLabels: Record<string, string>
  fieldHints: Record<string, string>
  uiLabels: Record<string, string>
  sectionLabels: Record<SectionId | 'users', string>
  analytics: {
    title: string
    description: string
    last7: string
    last30: string
    last90: string
    refresh: string
    visitors: string
    visits: string
    pageViews: string
    contactSubmissions: string
    locations: string
    cities: string
    sources: string
    sections: string
    devices: string
    topPages: string
    serviceInterest: string
    noData: string
    noServiceData: string
    contactActions: string
    engagement: string
    averageEngagement: string
    formStarts: string
    formSubmissions: string
    submissionRate: string
    views: string
    interactions: string
    notTracked: string
    couldNotLoad: string
  }
}

const english: CmsCopy = {
  loading: 'Loading', contentStudio: 'Content studio', signIn: 'Sign in', welcomeBack: 'Welcome back, {name}.', couldNotSignIn: 'Could not sign in.', editWebsite: 'Edit the website content from here.', email: 'Email', password: 'Password', signingIn: 'Signing in…', signOut: 'Sign out', signedOut: 'Signed out.', viewSite: 'View site', save: 'Save', saving: 'Saving…', pages: 'Pages', admin: 'Admin', users: 'Users', editing: 'Editing', loadingContent: 'Loading content', contentLanguage: 'Content language', discardChanges: 'Discard unsaved changes in this language?', contentSaved: 'Content saved. Refresh the website to see it.', couldNotSave: 'Could not save.', couldNotLoad: 'Could not load content.', createUser: 'Create user', creating: 'Creating…', userCreated: 'User created.', userDeleted: 'User deleted.', deleteUser: 'Delete', deleteThisUser: 'Delete this user?', role: 'Role', editor: 'Editor', adminRole: 'Admin', you: 'You',
  passwordLabel: 'Password',
  fieldLabels: {}, fieldHints: {}, uiLabels: { 'No image': 'No image', 'Upload image': 'Upload image', 'Replace image': 'Replace image', 'Uploading…': 'Uploading…', Remove: 'Remove', 'Move up': 'Move up', 'Move down': 'Move down', Untitled: 'Untitled' },
  sectionLabels: { company: 'Company', navigation: 'Navigation', hero: 'Hero', about: 'About', services: 'Services', why: 'Why us', investment: 'Investment intelligence', analytics: 'Analytics', clients: 'Clients', testimonials: 'Testimonials', team: 'Team', careers: 'Careers', insights: 'Insights', users: 'Users' },
  analytics: { title: 'Anonymous website analytics', description: 'Aggregate visits, locations, sections, service interest, and contact actions. No form names, emails, phone numbers, or messages are stored here.', last7: 'Last 7 days', last30: 'Last 30 days', last90: 'Last 90 days', refresh: 'Refresh analytics', visitors: 'Visitors', visits: 'Visits', pageViews: 'Page views', contactSubmissions: 'Contact submissions', locations: 'Visitors by location', cities: 'Cities when available', sources: 'Traffic sources', sections: 'Website sections reached', devices: 'Device mix', topPages: 'Top pages', serviceInterest: 'Service interest', noData: 'No data yet.', noServiceData: 'No service interest recorded yet.', contactActions: 'Contact actions', engagement: 'Engagement and form activity', averageEngagement: 'Average engagement', formStarts: 'Form starts', formSubmissions: 'Form submissions', submissionRate: 'Submission rate', views: 'views', interactions: 'interactions', notTracked: 'Not tracked yet', couldNotLoad: 'Could not load analytics.' },
}

const amharic: CmsCopy = {
  ...english,
  loading: 'በመጫን ላይ', contentStudio: 'የይዘት ማዕከል', signIn: 'ግባ', welcomeBack: 'እንኳን ደህና መጡ፣ {name}።', couldNotSignIn: 'መግባት አልተቻለም።', editWebsite: 'የድረ-ገጹን ይዘት ከዚህ ያርትዑ።', email: 'ኢሜይል', password: 'የይለፍ ቃል', signingIn: 'በመግባት ላይ…', signOut: 'ውጣ', signedOut: 'ወጥተዋል።', viewSite: 'ድረ-ገጹን ይመልከቱ', save: 'አስቀምጥ', saving: 'በማስቀመጥ ላይ…', pages: 'ገጾች', admin: 'አስተዳደር', users: 'ተጠቃሚዎች', editing: 'በማርትዕ ላይ', loadingContent: 'ይዘት በመጫን ላይ', contentLanguage: 'የይዘት ቋንቋ', discardChanges: 'በዚህ ቋንቋ ያልተቀመጠውን ለውጥ ይተዉ?', contentSaved: 'ይዘቱ ተቀምጧል። ለማየት ድረ-ገጹን ያድሱ።', couldNotSave: 'ማስቀመጥ አልተቻለም።', couldNotLoad: 'ይዘቱን መጫን አልተቻለም።', createUser: 'ተጠቃሚ ይፍጠሩ', creating: 'በመፍጠር ላይ…', userCreated: 'ተጠቃሚው ተፈጥሯል።', userDeleted: 'ተጠቃሚው ተሰርዟል።', deleteUser: 'ሰርዝ', deleteThisUser: 'ይህን ተጠቃሚ ይሰርዙ?', role: 'ሚና', editor: 'አርታዒ', adminRole: 'አስተዳዳሪ', you: 'እርስዎ',
  passwordLabel: 'የይለፍ ቃል',
  sectionLabels: { company: 'ድርጅት', navigation: 'አሰሳ', hero: 'ዋና ምስል', about: 'ስለ እኛ', services: 'አገልግሎቶች', why: 'ለምን እኛ', investment: 'የኢንቨስትመንት ግንዛቤ', analytics: 'ትንታኔ', clients: 'ደንበኞች', testimonials: 'የደንበኞች አስተያየት', team: 'ቡድን', careers: 'ሥራዎች', insights: 'ግንዛቤዎች', users: 'ተጠቃሚዎች' },
  fieldLabels: { Name: 'ስም', Tagline: 'መሪ ንግግር', Email: 'ኢሜይል', Phone: 'ስልክ', Location: 'አድራሻ', Website: 'ድረ-ገጽ', Label: 'መለያ', URL: 'ዩአርኤል', Link: 'አገናኝ', Eyebrow: 'አጭር ርዕስ', Headline: 'ርዕስ', Body: 'ዋና ጽሑፍ', Image: 'ምስል', Title: 'ርዕስ', Description: 'መግለጫ', Company: 'ድርጅት', Role: 'ሚና', Quote: 'ጥቅስ', Detail: 'ዝርዝር', Concept: 'ጽንሰ ሀሳብ', Capabilities: 'አቅሞች', Category: 'ምድብ', Date: 'ቀን', Summary: 'ማጠቃለያ', Department: 'ክፍል', Requirements: 'መስፈርቶች', Responsibilities: 'ኃላፊነቶች', Benefits: 'ጥቅማጥቅሞች', Suggestions: 'ጥቆማዎች', 'Read time': 'የንባብ ጊዜ', 'Map embed URL': 'የካርታ አገናኝ', 'Primary button': 'ዋና ቁልፍ', 'Primary link': 'ዋና አገናኝ', 'Secondary button': 'ሁለተኛ ቁልፍ', 'Secondary link': 'ሁለተኛ አገናኝ', 'Vision title': 'የራዕይ ርዕስ', Vision: 'ራዕይ', 'Mission title': 'የተልዕኮ ርዕስ', Mission: 'ተልዕኮ', 'About image': 'የስለ እኛ ምስል', 'Vision image': 'የራዕይ ምስል', 'Values image': 'የእሴቶች ምስል', 'Image alt text': 'የምስል አማራጭ ጽሑፍ', 'Button label': 'የቁልፍ መለያ', 'Button link': 'የቁልፍ አገናኝ', 'Framework label': 'የማዕቀፍ መለያ', 'Framework text': 'የማዕቀፍ ጽሑፍ', 'Decision lens': 'የውሳኔ መነጽር', Photo: 'ፎቶ', LinkedIn: 'LinkedIn', Id: 'መለያ ቁጥር', Number: 'ቁጥር', Value: 'ዋጋ', Suffix: 'ቅጥያ', Type: 'ዓይነት', 'Welcome message': 'የመቀበያ መልዕክት' },
  fieldHints: { 'Shown on the contact section. Include https://': 'በግንኙነት ክፍል ይታያል። https:// ያካትቱ።', 'Use #about for a section on the page.': 'በገጹ ላይ ላለ ክፍል #about ይጠቀሙ።', 'Each line of the headline.': 'እያንዳንዱ መስመር የርዕሱ አካል ነው።', 'Longer copy under the intro.': 'ከመግቢያው በታች የሚገኝ ረዘም ያለ ጽሑፍ።', 'Shown as Establish → Operate → Grow.': 'እንደ ማቋቋም → ማስኬድ → ማደግ ይታያል።', 'One item per line': 'አንድ ንጥል በእያንዳንዱ መስመር', 'Include All if the filter should show everything.': 'ማጣሪያው ሁሉንም እንዲያሳይ All ያካትቱ።' },
  uiLabels: { 'Add social link': 'የማህበራዊ አገናኝ ይጨምሩ', 'Add link': 'አገናኝ ይጨምሩ', 'Add value': 'እሴት ይጨምሩ', 'Add stat': 'ስታት ይጨምሩ', 'Add service': 'አገልግሎት ይጨምሩ', 'Add client': 'ደንበኛ ይጨምሩ', 'Add testimonial': 'አስተያየት ይጨምሩ', 'Add reason': 'ምክንያት ይጨምሩ', 'Add decision lens': 'የውሳኔ መነጽር ይጨምሩ', 'Add team member': 'የቡድን አባል ይጨምሩ', 'Add role': 'ሚና ይጨምሩ', 'Add article': 'ጽሑፍ ይጨምሩ', 'No image': 'ምስል የለም', Upload: 'ስቀል', 'Upload image': 'ምስል ይስቀሉ', 'Replace image': 'ምስል ይቀይሩ', 'Uploading…': 'በመስቀል ላይ…', Remove: 'አስወግድ', 'Move up': 'ወደ ላይ አንቀሳቅስ', 'Move down': 'ወደ ታች አንቀሳቅስ', Untitled: 'ርዕስ የለውም' },
  analytics: { ...english.analytics, title: 'ስም የማይገልጽ የድረ-ገጽ ትንታኔ', description: 'ጉብኝቶችን፣ አካባቢዎችን፣ ክፍሎችን፣ የአገልግሎት ፍላጎትንና የግንኙነት ተግባራትን በጠቅላላ ያሳያል።', last7: 'ያለፉት 7 ቀናት', last30: 'ያለፉት 30 ቀናት', last90: 'ያለፉት 90 ቀናት', refresh: 'ትንታኔን አድስ', visitors: 'ጎብኚዎች', visits: 'ጉብኝቶች', pageViews: 'የገጽ እይታዎች', contactSubmissions: 'የግንኙነት ማስገቢያዎች', locations: 'ጎብኚዎች በአካባቢ', cities: 'ከተሞች', sources: 'የትራፊክ ምንጮች', sections: 'የተደረሱ የድረ-ገጽ ክፍሎች', devices: 'የመሣሪያ አይነት', topPages: 'ተወዳጅ ገጾች', serviceInterest: 'የአገልግሎት ፍላጎት', noData: 'እስካሁን መረጃ የለም።', noServiceData: 'እስካሁን የአገልግሎት ፍላጎት አልተመዘገበም።', contactActions: 'የግንኙነት ተግባራት', engagement: 'ተሳትፎና የቅጽ እንቅስቃሴ', averageEngagement: 'አማካይ ተሳትፎ', formStarts: 'የቅጽ መጀመሪያዎች', formSubmissions: 'የቅጽ ማስገቢያዎች', submissionRate: 'የማስገባት መጠን', views: 'እይታዎች', interactions: 'ግንኙነቶች', notTracked: 'እስካሁን አልተከታተለም', couldNotLoad: 'ትንታኔን መጫን አልተቻለም።' },
}

const chinese: CmsCopy = {
  ...english,
  loading: '加载中', contentStudio: '内容工作台', signIn: '登录', welcomeBack: '欢迎回来，{name}。', couldNotSignIn: '登录失败。', editWebsite: '在这里编辑网站内容。', email: '电子邮箱', password: '密码', signingIn: '登录中…', signOut: '退出', signedOut: '已退出。', viewSite: '查看网站', save: '保存', saving: '保存中…', pages: '页面', admin: '管理', users: '用户', editing: '正在编辑', loadingContent: '正在加载内容', contentLanguage: '内容语言', discardChanges: '放弃此语言中未保存的更改？', contentSaved: '内容已保存。刷新网站即可查看。', couldNotSave: '保存失败。', couldNotLoad: '内容加载失败。', createUser: '创建用户', creating: '创建中…', userCreated: '用户已创建。', userDeleted: '用户已删除。', deleteUser: '删除', deleteThisUser: '删除此用户？', role: '角色', editor: '编辑者', adminRole: '管理员', you: '您',
  passwordLabel: '密码',
  sectionLabels: { company: '公司', navigation: '导航', hero: '首屏', about: '关于我们', services: '服务', why: '为什么选择我们', investment: '投资洞察', analytics: '分析', clients: '客户', testimonials: '客户评价', team: '团队', careers: '招聘', insights: '洞察', users: '用户' },
  fieldLabels: { Name: '名称', Tagline: '标语', Email: '电子邮箱', Phone: '电话', Location: '地址', Website: '网站', Label: '标签', URL: '网址', Link: '链接', Eyebrow: '眉题', Headline: '标题', Body: '正文', Image: '图片', Title: '标题', Description: '描述', Company: '公司', Role: '角色', Quote: '引言', Detail: '详情', Concept: '概念', Capabilities: '能力', Category: '类别', Date: '日期', Summary: '摘要', Department: '部门', Requirements: '任职要求', Responsibilities: '职责', Benefits: '福利', Suggestions: '建议', 'Read time': '阅读时间', 'Map embed URL': '地图嵌入网址', 'Primary button': '主按钮', 'Primary link': '主链接', 'Secondary button': '次按钮', 'Secondary link': '次链接', 'Vision title': '愿景标题', Vision: '愿景', 'Mission title': '使命标题', Mission: '使命', 'About image': '关于我们图片', 'Vision image': '愿景图片', 'Values image': '价值观图片', 'Image alt text': '图片替代文本', 'Button label': '按钮标签', 'Button link': '按钮链接', 'Framework label': '框架标签', 'Framework text': '框架文本', 'Decision lens': '决策视角', Photo: '照片', LinkedIn: 'LinkedIn', Id: '编号', Number: '编号', Value: '数值', Suffix: '后缀', Type: '类型', 'Welcome message': '欢迎消息' },
  fieldHints: { 'Shown on the contact section. Include https://': '显示在联系区块。请包含 https://。', 'Use #about for a section on the page.': '页面区块请使用 #about 这样的链接。', 'Each line of the headline.': '标题的每一行。', 'Longer copy under the intro.': '介绍文字下方的详细内容。', 'Shown as Establish → Operate → Grow.': '显示为“建立 → 运营 → 增长”。', 'One item per line': '每行一个项目', 'Include All if the filter should show everything.': '如果筛选器要显示全部内容，请包含“全部”。' },
  uiLabels: { 'Add social link': '添加社交链接', 'Add link': '添加链接', 'Add value': '添加价值观', 'Add stat': '添加统计', 'Add service': '添加服务', 'Add client': '添加客户', 'Add testimonial': '添加评价', 'Add reason': '添加理由', 'Add decision lens': '添加决策视角', 'Add team member': '添加团队成员', 'Add role': '添加职位', 'Add article': '添加文章', 'No image': '暂无图片', 'Upload image': '上传图片', 'Replace image': '替换图片', 'Uploading…': '上传中…', Remove: '移除', 'Move up': '上移', 'Move down': '下移', Untitled: '未命名' },
  analytics: { ...english.analytics, title: '匿名网站分析', description: '汇总访问、位置、页面区块、服务兴趣和联系行为。这里不保存姓名、邮箱、电话或消息。', last7: '最近 7 天', last30: '最近 30 天', last90: '最近 90 天', refresh: '刷新分析', visitors: '访客', visits: '访问次数', pageViews: '页面浏览量', contactSubmissions: '联系提交数', locations: '访客位置', cities: '可用城市', sources: '流量来源', sections: '到达的网站区块', devices: '设备类型', topPages: '热门页面', serviceInterest: '服务兴趣', noData: '暂无数据。', noServiceData: '暂无服务兴趣数据。', contactActions: '联系行为', engagement: '参与度和表单活动', averageEngagement: '平均参与时间', formStarts: '表单开始数', formSubmissions: '表单提交数', submissionRate: '提交率', views: '浏览', interactions: '互动', notTracked: '尚未追踪', couldNotLoad: '分析加载失败。' },
}

const translations: Record<ContentLocale, CmsCopy> = { en: english, am: amharic, zh: chinese }

const CmsLocaleContext = createContext<ContentLocale>('en')

export function CmsLocaleProvider({ locale, children }: { locale: ContentLocale; children: ReactNode }) {
  return <CmsLocaleContext.Provider value={locale}>{children}</CmsLocaleContext.Provider>
}

export function useCmsCopy() {
  const locale = useContext(CmsLocaleContext)
  const copy = translations[locale]
  const label = (value: string) => copy.fieldLabels[value] || copy.uiLabels[value] || value
  const hint = (value: string) => copy.fieldHints[value] || value
  return { ...copy, locale, label, hint }
}
