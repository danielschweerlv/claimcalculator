import React, { useState } from 'react'

const sections = [
  {
    id: 'introduction',
    num: '1',
    title: 'Introduction',
    content: (
      <div className="space-y-4">
        <p>Welcome. You have arrived at a website provided by ClaimCalculator.ai (hereinafter "Company," "we," "our" or "us") or one of our affiliates. Our mission is to bridge the gap between a law firm's need to grow and an underserved community's need for trustworthy legal services.</p>
        <p>We take your privacy seriously. We provide this Privacy Policy ("Policy") to tell you what information we collect about you, how we obtain it, how we share it, and how you may limit the ways in which we use your personal information. If you have questions about this Policy after you review it, feel free to contact us at <a href="mailto:privacy@claimcalculator.ai" className="text-primary hover:underline">privacy@claimcalculator.ai</a>.</p>
      </div>
    ),
  },
  {
    id: 'scope',
    num: '2',
    title: 'Scope',
    content: (
      <div className="space-y-4">
        <p>This Policy applies when you use or access our website or any landing page operated by us that links to this Policy, or when you otherwise provide Personal Information or interact with us online, via phone calls or other communications with our representatives or in-person.</p>
        <p>For this Policy, "Personal Information" is information that identifies, relates to, or could reasonably be linked with you or your household. We refer to all the above as our "Services." Our Services are used by people who contact us looking for legal services ("Users"), attorneys and law firms with whom we partner ("Firms") and individuals seeking employment with us ("Employment Applicants").</p>
        <p>Please note that if you provide your information while interacting with our Sites or Services, we will take that as your agreement to our collection, use, and disclosure of your information as set forth in this Policy.</p>
        <p>This Policy does not apply to any products, goods, services, websites, or content that are offered by third parties ("Third Party Services"), which are governed by their respective privacy policies.</p>
      </div>
    ),
  },
  {
    id: 'what-we-collect',
    num: '3',
    title: 'What Information We Collect',
    content: (
      <div className="space-y-6">
        <p>As a general rule, we limit the Personal Information we collect to that which is adequate, relevant, and reasonably necessary for us to provide our Services to you.</p>
        <div>
          <h4 className="text-sm text-on-background mb-3 uppercase tracking-widest text-xs">Information That You Provide to Us</h4>
          <p className="mb-3">As you interact with our Sites or Services, we may collect some or all of the following Personal Information via webforms and other communications with you:</p>
          <ul className="space-y-2">
            {[
              'Contact information such as your first and last name, email address, home or business address, telephone numbers and mobile numbers',
              'Age, date of birth and gender',
              'Status of driver\'s registration and insurance',
              'Job title and your current or past employment or educational information',
              'Disability status or other health information',
              'Details of your vehicle, pedestrian or workplace accident(s) or incident(s), including dates, times and locations; names or other identifying information of other individuals involved; the extent of your injuries, damages and/or treatment',
              'Audiovisual information such as recordings of your voice for calls to our representatives',
              'Other information that you voluntarily provide that could reasonably be used to identify you personally',
            ].map(item => (
              <li key={item} className="flex gap-2.5 text-sm text-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm text-on-background mb-3 uppercase tracking-widest text-xs">Information That Is Automatically Collected</h4>
          <p className="mb-3">Like many businesses, we automatically collect certain information when you visit or interact with our Sites ("Usage Information"), including:</p>
          <ul className="space-y-2">
            {[
              'Your IP address or another unique identifier',
              'Your device functionality (browser, operating system, hardware, mobile network information)',
              'Referring and exit web pages and URLs',
              'Areas within the Sites that you visit and your activities there',
              'Your device location or other location information, including zip code, state or country',
              'Information about your engagement with our emails',
              'Statistical information about how users, collectively, use the Sites',
            ].map(item => (
              <li key={item} className="flex gap-2.5 text-sm text-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm text-on-background mb-3 uppercase tracking-widest text-xs">Information Collected from Third Parties</h4>
          <p>Our Sites may include functionality that allows certain interactions between our Sites and your account on a third-party website or application. We also may obtain information about traffic and usage from third parties. We do not have control over the information that is collected, used, and shared by these third parties. We encourage you to review their privacy statements.</p>
        </div>
        <div>
          <h4 className="text-sm text-on-background mb-3 uppercase tracking-widest text-xs">Information We Infer</h4>
          <p>We derive information or draw inferences about you based on information we collect. For example, based on your contact information or language spoken, we may infer your interest in certain attorneys or law firms.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'cookies',
    num: '4',
    title: 'Use of Cookies and Other Tracking Technologies',
    content: (
      <div className="space-y-4">
        <p>We may use various methods and technologies to store or collect Usage Information ("Tracking Technologies"), including:</p>
        <ul className="space-y-2">
          {[
            'Cookies — files placed on a device to uniquely identify your browser or store information on your device',
            'Pixels — small graphic files that allow us to monitor use of the Sites',
            'Web Beacons — small tags placed on our pages',
            'Embedded Scripts — code that collects information about your interactions',
            'Browser Fingerprinting — collection and analysis of device data for identification',
            'Recognition Technologies — statistical tools used to recognize users across devices',
          ].map(item => (
            <li key={item} className="flex gap-2.5 text-sm text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'why-we-collect',
    num: '5',
    title: 'Why We Collect Information',
    content: (
      <div className="space-y-4">
        <p>We use the information we collect about you in a variety of ways, including:</p>
        <ul className="space-y-2">
          {[
            'To process your request for legal services and facilitate the functionality of our Sites',
            'To communicate with you about your requests and our Services',
            'To respond to your service inquiries and requests for information',
            'To maintain, improve, and analyze our Sites or Services',
            'To detect, prevent, or investigate suspicious activity or fraud',
            'To comply with applicable legal and regulatory obligations',
            'To enforce our terms, policies, and agreements',
            'To evaluate your application for employment',
          ].map(item => (
            <li key={item} className="flex gap-2.5 text-sm text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'ai-chatbots',
    num: '6',
    title: 'Use of AI Chatbots',
    content: (
      <p>We use chatbots operated by artificial intelligence ("AI") on some of our Sites. Users of the Sites may be interacting with an AI chatbot rather than a human. If you prefer to speak to a human, please contact us using the information in the Contact Us section below.</p>
    ),
  },
  {
    id: 'disclosure',
    num: '7',
    title: 'When We Disclose Information',
    content: (
      <div className="space-y-4">
        <p>As a business, we may need to disclose your personal information to service providers outside our organization. Certain nonpublic information about you may be disclosed in the following situations:</p>
        <ul className="space-y-2">
          {[
            'To comply with applicable law or respond to valid legal process, including from law enforcement or other government agencies',
            'As part of any actual or threatened legal proceedings, disclosing only the information necessary',
            'During a review of our practices under authorization of a state or national licensing board',
            'In conjunction with a prospective purchase, sale, or merger of all or part of our company',
            'To provide information to service providers and vendors who process information on our behalf',
            'To other parties with your consent',
          ].map(item => (
            <li key={item} className="flex gap-2.5 text-sm text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
        <p>We do not sell, rent, or lease your personal information to unaffiliated third parties for their own marketing purposes without your consent.</p>
      </div>
    ),
  },
  {
    id: 'third-party',
    num: '8',
    title: 'Third-Party Links',
    content: (
      <p>For your convenience, the Sites and this Policy may contain links to other websites not controlled by us. We are not responsible for the privacy practices, advertising, products, services, or the content of such other websites. The use of third-party links on our Sites should not be deemed to imply that we endorse or have any affiliation with the links.</p>
    ),
  },
  {
    id: 'opt-out',
    num: '9',
    title: 'Opt-Out of Electronic Communications',
    content: (
      <div className="space-y-4">
        <p>If you would like to opt out of receiving future promotional emails or other commercial electronic communications from us, you may do so at any time by:</p>
        <ul className="space-y-2">
          {[
            'Clicking the "unsubscribe" link within the email',
            'Contacting us directly at privacy@claimcalculator.ai',
          ].map(item => (
            <li key={item} className="flex gap-2.5 text-sm text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
        <p>Please note that even after you opt out of all commercial messages, we may still send you administrative messages regarding the Services.</p>
      </div>
    ),
  },
  {
    id: 'third-party-tracking',
    num: '10',
    title: 'Third-Party Tracking and Advertising',
    content: (
      <div className="space-y-4">
        <p>We may use third-party service providers who may use tracking technologies to serve you advertisements and offers based on your interests, browsing history, and other data. You may opt out of interest-based advertising from some providers below:</p>
        <ul className="space-y-2">
          {[
            { name: 'Google', url: 'https://adssettings.google.com/authenticated' },
            { name: 'Meta', url: 'https://www.facebook.com/settings/?tab=ads' },
            { name: 'Network Advertising Initiative', url: 'https://optout.networkadvertising.org/' },
            { name: 'Digital Advertising Alliance', url: 'https://optout.aboutads.info/' },
          ].map(item => (
            <li key={item.name} className="flex gap-2.5 text-sm text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{item.name}</a>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'do-not-sell',
    num: '11',
    title: 'Do Not Sell My Personal Information',
    content: (
      <div className="space-y-4">
        <p>Certain state privacy laws give residents the right to opt out of the "sale" of their personal information. We do not sell personal information in the traditional sense. However, to the extent our use of third-party advertising partners constitutes a "sale" under applicable state law, you may opt out by contacting us at privacy@claimcalculator.ai.</p>
      </div>
    ),
  },
  {
    id: 'security',
    num: '12',
    title: 'Security of Your Information',
    content: (
      <p>We take commercially reasonable security measures to help protect personal information from loss, misuse, unauthorized access, disclosure, alteration, and destruction. However, no internet transmission or electronic storage is ever fully secure or error-free. We therefore cannot guarantee absolute security.</p>
    ),
  },
  {
    id: 'retention',
    num: '13',
    title: 'Retention of Information',
    content: (
      <p>We retain personal information for as long as necessary to fulfill the purposes for which it was collected and to comply with applicable legal, regulatory, tax, or accounting requirements. When we no longer need personal information, we take reasonable steps to destroy or de-identify it.</p>
    ),
  },
  {
    id: 'children',
    num: '14',
    title: 'Children\'s Privacy',
    content: (
      <p>Our Sites are not directed at children under the age of 13, and we do not knowingly collect personal information from children under 13. If you believe we may have collected information from a child under 13, please contact us at privacy@claimcalculator.ai.</p>
    ),
  },
  {
    id: 'your-choices',
    num: '15',
    title: 'Your Choices and Rights',
    content: (
      <div className="space-y-4">
        <p>Depending on your jurisdiction, you may have certain rights regarding your personal information, including:</p>
        <ul className="space-y-2">
          {[
            'To obtain a portable copy of your personal data',
            'To request deletion of personal information we hold about you',
            'To request correction of inaccurate personal information',
            'To request that we restrict how we use your personal information',
            'To object to certain processing of your personal information',
          ].map(item => (
            <li key={item} className="flex gap-2.5 text-sm text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              {item}
            </li>
          ))}
        </ul>
        <p>To exercise any of these rights, please contact us using the information in the Contact Us section below. We will respond to your request in accordance with applicable law.</p>
      </div>
    ),
  },
  {
    id: 'california',
    num: '16',
    title: 'California Privacy Rights',
    content: (
      <div className="space-y-4">
        <p>California residents may have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), including the right to know, delete, correct, and opt out of the sale or sharing of personal information. To submit a request, please contact us at privacy@claimcalculator.ai.</p>
      </div>
    ),
  },
  {
    id: 'nevada',
    num: '17',
    title: 'Nevada Privacy Rights',
    content: (
      <div className="space-y-4">
        <p>Nevada residents may opt out of the sale of covered information by sending a request to privacy@claimcalculator.ai. We will respond within 60 days of receipt of a verified request.</p>
      </div>
    ),
  },
  {
    id: 'contact',
    num: '18',
    title: 'Contact Us',
    content: (
      <div className="space-y-3">
        <p>If you have any questions or suggestions regarding this Policy, please contact us:</p>
        <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10 space-y-2 text-sm">
          <p className="font-bold text-on-background">ClaimCalculator.ai</p>
          <p className="text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">mail</span>
            <a href="mailto:privacy@claimcalculator.ai" className="text-primary hover:underline">privacy@claimcalculator.ai</a>
          </p>
        </div>
      </div>
    ),
  },
]

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('introduction')

  return (
    <div className="min-h-screen bg-transparent relative z-10">

      <main className="pt-20 pb-24 px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center pt-12 pb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/15">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <span className="text-xs font-label font-semibold text-primary uppercase tracking-widest">Last updated: 2024</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-headline text-on-background">Privacy <span className="text-primary italic">Policy</span></h1>
            <p className="text-on-surface-variant max-w-xl mx-auto text-base leading-relaxed">
              We take your privacy seriously. This policy explains exactly what data we collect, why we collect it, and how you can control it.
            </p>
          </div>

          {/* Table of contents */}
          <div className="mb-10 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10">
            <p className="text-xs font-label font-bold text-outline uppercase tracking-widest mb-4">Table of Contents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {sections.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors py-1 group"
                >
                  <span className="text-[10px] font-bold text-outline w-5 flex-shrink-0">{s.num}.</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">{s.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="rounded-2xl bg-surface-container-low border border-outline-variant/10 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between gap-4 p-5 lg:p-6 text-left hover:bg-surface-container transition-colors"
                  onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-primary w-7 flex-shrink-0">{section.num}.</span>
                    <h2 className="text-base font-headline text-on-background">{section.title}</h2>
                  </div>
                  <span className={`material-symbols-outlined text-outline flex-shrink-0 transition-transform duration-300 ${activeSection === section.id ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {activeSection === section.id && (
                  <div className="px-5 lg:px-6 pb-6 pt-2 text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/10">
                    <div className="pt-4">{section.content}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-10 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/5">
            <p className="text-[11px] text-outline leading-relaxed">
              ClaimCalculator.ai is not a law firm or an attorney referral service. This advertisement is not legal advice and is not a guarantee or prediction of the outcome of your legal matter. Every case is different. The settlement estimate provided by ClaimCalculator.ai is for informational and illustrative purposes only and does not constitute legal advice, a valuation, or a guarantee of results. Use of this tool does not create an attorney-client relationship.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}
