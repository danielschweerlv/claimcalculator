import React, { useState } from 'react'

const sections = [
  {
    id: 'introduction',
    num: '1',
    title: 'Introduction',
    content: `Please review this page carefully. These Terms of Use ("Terms") constitute a legal contract between you and ClaimCalculator.ai, its owner, or one of our affiliates (collectively, "ClaimCalculator.ai," "Company," "we," "us" or "our"). The Terms govern your access to and use of our website and all portals, products, services, and interactive features controlled by us that post a link to these Terms (collectively, the "Services"). By using the Sites or Services, you agree to these Terms. Our Services are not intended for those under the age of 18 — if you access our Services, you represent and warrant that you are at least 18 years of age.`,
  },
  {
    id: 'changes',
    num: '2',
    title: 'Changes to These Terms',
    content: `From time to time, we may modify, add, or delete portions of these Terms and will post those changes here with an updated date. Your continued use of the Sites or Services after any such changes constitutes your agreement to such changes. We reserve the right to change or improve the features and functionality of the Services at any time, and to suspend or terminate the Services for any reason or at any time.`,
  },
  {
    id: 'privacy',
    num: '3',
    title: 'Privacy Policy',
    content: `Our Privacy Policy is incorporated into these Terms by reference. By using the Sites or Services, you indicate that you understand and consent to the collection, use, and disclosure of your information as described in our Privacy Policy.`,
  },
  {
    id: 'additional-terms',
    num: '4',
    title: 'Additional Terms and Conditions',
    content: `In connection with your use of the Sites or Services, you may occasionally be asked to consent to additional policies or terms. Please read any supplemental policies carefully. Any supplemental terms will not vary or replace these Terms regarding any use of our Sites or Services unless otherwise expressly stated.`,
  },
  {
    id: 'electronic-comms',
    num: '5',
    title: 'Consent to Electronic Communications',
    content: `By using the Sites or Services, you agree that we may communicate with you electronically. Any notices, agreements, or other communications that ClaimCalculator.ai sends to you electronically will satisfy any legal communication requirements. By providing your phone number, you expressly consent to receive calls and text messages, including automated messages, from ClaimCalculator.ai and participating attorneys. Standard message and data rates may apply. You can opt out at any time by replying STOP. To withdraw your consent from receiving electronic notices, please contact us at privacy@claimcalculator.ai.`,
  },
  {
    id: 'third-party',
    num: '6',
    title: 'Third Party Websites',
    content: `The Sites may contain links to third-party websites ("Linked Sites"). We are not responsible for the privacy practices, content, or terms of third-party websites. We do not control, endorse, or accept responsibility for the content on any Linked Sites. Your correspondence or business dealings with third parties found on or throughout the Sites are solely between you and such third parties. You agree that we are not responsible or liable for any losses, damages, or liabilities incurred as the result of any such dealings.`,
  },
  {
    id: 'prohibited',
    num: '7',
    title: 'Prohibited Conduct',
    bullets: [
      'Impersonate any person or entity or misrepresent your affiliation with any person or entity',
      'Engage in unauthorized spidering, scraping or harvesting of content or personal information',
      'Obtain or attempt to gain unauthorized access to other computer systems, materials, or information',
      'Collect or store personal data about other users without proper rights or consent',
      'Use any device or software to interfere with the proper working of the Sites or Services',
      'Circumvent, reverse engineer, or otherwise alter any software comprising the Sites',
      'Upload or transmit any communication or material that contains a virus or is otherwise harmful',
      'Send any communication to other users without their consent',
      'Violate, or encourage any conduct that would violate, any applicable law or regulation',
      'Engage in fraud or misuse of the Services',
    ],
    prefix: 'You may not access or use the Sites or Services to take any action that could harm us or any third party, interfere with our operations, or violate any laws. For example, and without limitation, you may not:',
  },
  {
    id: 'security',
    num: '8',
    title: 'Security',
    content: `Violating the security of the Sites or Services is prohibited and may result in criminal and civil liability. We may investigate security incidents and cooperate with law enforcement if a criminal violation is suspected. We may suspend or terminate your access for any reason at any time without notice. In the event of a data breach affecting personal information, ClaimCalculator.ai will notify affected users via email and public website notice within 72 hours, as required by law.`,
  },
  {
    id: 'account',
    num: '9',
    title: 'Use of Account; Risk of Loss',
    content: `ClaimCalculator.ai reserves the right to refuse service, cancel orders, or remove or edit content in its sole discretion. If you use an account on our Sites, you agree to provide true, current, complete and accurate information. You may not use your account or the Sites or Services for the purpose of committing or furthering fraudulent acts. You also agree to notify us immediately of any unauthorized access to or use of your account.`,
  },
  {
    id: 'submitted',
    num: '10',
    title: 'Submitted Materials',
    content: `You remain fully responsible for the materials or submissions that you provide to us. If you send us any Submitted Material (information, creative works, pictures, ideas, or other content), you grant ClaimCalculator.ai a royalty-free, unrestricted, worldwide, perpetual, irrevocable, non-exclusive right and license to use, copy, reproduce, modify, publish, distribute, and create derivative works from the Submitted Material in any media. You warrant that you entirely own the Submitted Material and have all rights necessary to authorize this license.`,
  },
  {
    id: 'ip',
    num: '11',
    title: 'Intellectual Property',
    content: `The Sites contain content protected by copyrights, trademarks, service marks, and other proprietary rights ("Content"). ClaimCalculator.ai or its third-party licensors own all Content on the Sites. You may print copies of Content for personal, non-commercial use only, provided that you maintain any notices contained in the Content. You may not publish, reproduce, distribute, perform, modify, transmit, or create derivative works based on any Content without our prior written consent.`,
  },
  {
    id: 'infringement',
    num: '12',
    title: 'Claims of Infringement',
    content: `ClaimCalculator.ai respects the intellectual property of others and requires that you do the same. In accordance with the Digital Millennium Copyright Act ("DMCA"), we will respond to notices of alleged copyright infringement that are duly reported. If you believe that your content has been copied in a way that constitutes copyright infringement, please contact us at privacy@claimcalculator.ai with the subject line "DMCA Notice" and include a description of the copyrighted work, the location of the infringing material, your contact information, and your signature.`,
  },
  {
    id: 'indemnification',
    num: '13',
    title: 'Indemnification',
    content: `You agree to defend, indemnify, and hold harmless ClaimCalculator.ai, its affiliates, subsidiaries, officers, directors, employees, and agents from and against any claims, losses, damages, fines, or other liabilities arising from: (i) your use of and access to the Sites or Services; (ii) your violation of any of these Terms; and (iii) your violation of any third-party right, including any copyright, trademark, trade secret, or privacy right.`,
  },
  {
    id: 'disclaimers',
    num: '14',
    title: 'Disclaimers',
    content: `YOUR USE OF THE SITE IS AT YOUR OWN RISK. WE MAKE NO REPRESENTATIONS OR WARRANTIES ABOUT THE OPERATION OF THE SITE OR THE INFORMATION, MATERIALS, GOODS OR SERVICES APPEARING OR OFFERED ON THE SITE, ALL OF WHICH ARE PROVIDED "AS IS." WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, WARRANTIES AGAINST INFRINGEMENT, WARRANTIES RELATING TO ACCURACY OR COMPLETENESS OF ANY INFORMATION ON THIS WEBSITE, AND WARRANTIES OF TITLE. CLAIMCALCULATOR.AI DOES NOT WARRANT THAT THE SITE OR SERVICES WILL MEET YOUR NEEDS, BE UNINTERRUPTED, SECURE, OR ERROR-FREE.`,
    isLegal: true,
  },
  {
    id: 'liability',
    num: '15',
    title: 'Limitation of Liabilities',
    content: `TO THE FULLEST EXTENT PERMITTED BY LAW: IN NO EVENT WILL CLAIMCALCULATOR.AI (OR ITS OFFICERS, DIRECTORS, AFFILIATES, AGENTS, OR EMPLOYEES) BE LIABLE FOR CONSEQUENTIAL, INDIRECT, INCIDENTAL, PUNITIVE, EXEMPLARY OR SPECIAL DAMAGES ARISING OUT OF OR IN CONNECTION WITH THESE TERMS, THE USE OR INABILITY TO USE THE SITE OR SERVICES, OR ANY LOSS OF REVENUE, PROFITS, OR DATA. IN NO EVENT WILL CLAIMCALCULATOR.AI'S AGGREGATE LIABILITY ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE SERVICES EXCEED $100. ANY CAUSE OF ACTION ARISING OUT OF OR RELATED TO THE SITE MUST BEGIN WITHIN ONE (1) YEAR AFTER THE CAUSE OF ACTION ACCRUES.`,
    isLegal: true,
  },
  {
    id: 'release',
    num: '16',
    title: 'Release',
    content: `If you have a dispute with us or one or more users of the Sites or Services, you release ClaimCalculator.ai (and its officers, directors, affiliates, agents, and employees) from claims, demands and damages of every kind and nature, known and unknown, arising out of or in any way connected with such disputes.`,
  },
  {
    id: 'termination',
    num: '17',
    title: 'Termination',
    content: `ClaimCalculator.ai reserves the right, in its sole discretion, to restrict, suspend, or terminate these Terms and your access to all or any part of the Sites or the Content or Services, at any time and for any reason without prior notice or liability. You may terminate these Terms by discontinuing your use of the Services.`,
  },
  {
    id: 'severability',
    num: '18',
    title: 'Severability',
    content: `If any provision of these Terms is held in whole or in part to be invalid, void, or unenforceable in any jurisdiction for any reason, the remainder of that provision and of the entire Agreement will be severable and remain in full force and effect.`,
  },
  {
    id: 'applicable-law',
    num: '19',
    title: 'Applicable Law',
    content: `These Terms will be governed by the laws of the United States and the State of Nevada, as applicable, without resort to any conflict of laws provisions. By using the Sites, you waive any claims that may arise under the laws of other countries or territories.`,
  },
  {
    id: 'dispute',
    num: '20',
    title: 'Dispute Resolution; Class Action and Jury Trial Waiver',
    content: `YOU ARE WAIVING YOUR RIGHT TO FILE A LAWSUIT OR PARTICIPATE IN A CLASS ACTION. With respect to any and all disputes arising out of or in connection with the Sites, Services, or these Terms, ClaimCalculator.ai and you agree to first negotiate in good faith. If a dispute is not resolved within 60 days, either party may demand mediation under JAMS. If settlement is not reached within 90 days after service of a written demand for mediation, any unresolved controversy will be resolved by binding arbitration before a single arbitrator. Both you and ClaimCalculator.ai understand that you are giving up the right to litigate all disputes in court before a judge or jury.`,
    isLegal: true,
  },
  {
    id: 'ada',
    num: '21',
    title: 'ADA Compliance Notice',
    content: `We are committed to making the website's content accessible for all. If you are having difficulty accessing or navigating the content on this website, or if you notice any content, feature, or functionality that you believe is not fully accessible to people with disabilities, please contact us at accessibility@claimcalculator.ai with "Website Access" in the subject line and provide a description of the specific feature you feel is not fully accessible. We take all feedback seriously and will consider it as we evaluate ways to accommodate all our customers.`,
  },
  {
    id: 'contact',
    num: '22',
    title: 'Contact Us',
    isContact: true,
  },
]

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('introduction') 

  return (
    <div className="min-h-screen bg-transparent relative z-10">

      <main className="pt-20 pb-24 px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center pt-12 pb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/15">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              <span className="text-xs font-label font-semibold text-primary uppercase tracking-widest">Last updated: 2024</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-headline text-on-background">Terms of <span className="text-primary italic">Service</span></h1>
            <p className="text-on-surface-variant max-w-xl mx-auto text-base leading-relaxed">Please review this page carefully. These Terms constitute a legal contract between you and ClaimCalculator.ai.</p>
          </div>

          {/* Important notice banner */}
          <div className="mb-8 p-4 rounded-2xl border border-error/30 bg-error/8 flex gap-3 items-start">
            <span className="material-symbols-outlined text-error flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              <span className="font-bold text-error">IMPORTANT NOTICE:</span> These Terms of Use are subject to binding arbitration and a waiver of class action and jury trial rights as detailed in Section 20 below.
            </p>
          </div>

          {/* Table of contents */}
          <div className="mb-10 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10">
            <p className="text-xs font-label font-bold text-outline uppercase tracking-widest mb-4">Table of Contents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors py-1 group">
                  <span className="text-[10px] font-bold text-outline w-5 flex-shrink-0">{s.num}.</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">{s.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="rounded-2xl bg-surface-container-low border border-outline-variant/10 overflow-hidden">
                <button className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-surface-container transition-colors" onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-primary w-7 flex-shrink-0">{section.num}.</span>
                    <h2 className="text-base font-headline text-on-background">{section.title}</h2>
                  </div>
                  <span className={`material-symbols-outlined text-outline flex-shrink-0 transition-transform duration-300 ${activeSection === section.id ? 'rotate-180' : ''}`}>expand_more</span>
                </button>

                {activeSection === section.id && (
                  <div className="px-5 pb-6 pt-2 border-t border-outline-variant/10">
                    <div className="pt-4 space-y-3">
                      {section.isContact ? (
                        <div className="space-y-3">
                          <p className="text-sm text-on-surface-variant">If you have questions about these Terms or the Services, please contact us:</p>
                          <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/10 space-y-2 text-sm">
                            <p className="font-bold text-on-background">ClaimCalculator.ai</p>
                            <p className="text-on-surface-variant flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-lg">mail</span>
                              <a href="mailto:privacy@claimcalculator.ai" className="text-primary hover:underline">privacy@claimcalculator.ai</a>
                            </p>
                          </div>
                        </div>
                      ) : section.bullets ? (
                        <div className="space-y-3">
                          {section.prefix && <p className="text-sm text-on-surface-variant">{section.prefix}</p>}
                          <ul className="space-y-2">
                            {section.bullets.map(b => (
                              <li key={b} className="flex gap-2.5 text-sm text-on-surface-variant">
                                <span className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0 mt-2" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className={`text-sm leading-relaxed ${section.isLegal ? 'text-on-surface-variant/70 font-label text-[11px] bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10' : 'text-on-surface-variant'}`}>{section.content}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
