import React from 'react'

const stateNotices = [
  {
    state: 'Nevada',
    icon: 'location_on',
    highlight: true,
    content: 'In Nevada, attorneys must be licensed by the State Bar of Nevada to practice law in the state. ClaimCalculator.ai does not verify or endorse any particular attorney\'s qualifications beyond confirming their ability to advertise. Users should conduct their own due diligence before hiring legal counsel. Nevada has a 2-year statute of limitations for personal injury cases — only a licensed Nevada attorney can advise you on deadlines applicable to your specific case.',
  },
  {
    state: 'California',
    icon: 'gavel',
    highlight: false,
    content: 'California licensed attorneys participate in a joint advertising program. Making a false or fraudulent worker\'s compensation case is a felony subject to up to five years in prison or a fine of $150,000 or double the value of the fraud, whichever is greater, or by both.',
  },
  {
    state: 'New York',
    icon: 'gavel',
    highlight: false,
    content: 'This site is considered attorney advertising under New York law. Past results do not guarantee future outcomes. Individuals seeking legal representation should verify attorney credentials independently.',
  },
  {
    state: 'Florida',
    icon: 'gavel',
    highlight: false,
    content: 'In Florida, ClaimCalculator.ai is a qualified provider, not a law firm. Any person who knowingly files a false or fraudulent case for payment of a loss will incur a crime and may be subject to fines and jail time. You are not responsible for your own costs, unless compensation is recovered, except where case-related costs or reductions from the recovery amount apply.',
  },
]

const generalNotices = [
  {
    icon: 'info',
    title: 'Educational Information Only',
    body: 'This site may contain areas that give information about the law and the legal system, provided for general informational and educational purposes only. The information on this site does not constitute legal advice and must not be used as a substitute for seeking counsel from a licensed attorney authorized to practice law in your jurisdiction. Any legal information on this site is not tailored to any specific case, was not prepared for your benefit, and should not be relied upon as legal advice.',
  },
  {
    icon: 'handshake',
    title: 'No Attorney-Client Relationship',
    body: 'Your use of this site does not establish an attorney-client relationship or any other professional relationship between you and any other person, including ClaimCalculator.ai, its owner, affiliates, or participating attorneys. Your reliance and use of the information contained in or linked from this site is entirely at your own discretion and risk.',
  },
  {
    icon: 'campaign',
    title: 'Advertising Service — Not a Law Firm',
    body: 'ClaimCalculator.ai is an advertising service and does not offer or provide legal advice. ClaimCalculator.ai is not a lawyer referral service, attorney, or law firm. Our trade names are used solely for marketing and advertising purposes, connecting users with independent attorneys. The advertising attorneys are independently owned and operated law firms and not affiliated with each other or with ClaimCalculator.ai, except as paid participants in this advertising program. You may always request a particular attorney by name.',
  },
  {
    icon: 'schedule',
    title: 'Time-Sensitive Legal Information',
    body: 'Some of the information on this website discusses time-sensitive legal information, such as statutes of limitation. Laws change, and no representation is made as to the continued accuracy of information previously published on this site. Only a licensed attorney can advise you regarding any deadlines, statutory requirements, or other limits on your cases applicable to your specific case. ClaimCalculator.ai expressly advises you not to rely on any such information on this website as a substitute for legal counsel.',
  },
  {
    icon: 'star_half',
    title: 'Attorney Selection & Testimonials',
    body: 'The information contained on this website is not a recommendation, referral, or endorsement of any particular lawyer or law firm. ClaimCalculator.ai makes no representations, guarantees, or warranties as to the legal ability, quality, or competency of the attorneys that participate in the advertising program. Any testimonials appearing on this website are based on actual events but may be portrayed by actors. Testimonial results are not typical, do not apply to all attorneys in the advertising program, and should not be relied upon as an expectation of future results.',
  },
  {
    icon: 'image',
    title: 'Images & Dramatizations',
    body: 'Images used on this site are for illustrative purposes only and may feature paid actors and/or spokespersons, not actual lawyers or clients. Any depictions of accidents, consultations, or other events are dramatizations.',
  },
]

export default function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-transparent relative z-10">

      <main className="pt-20 pb-24 px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center pt-12 pb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/15">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>balance</span>
              <span className="text-xs font-label font-semibold text-primary uppercase tracking-widest">Paid Attorney Advertising</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-headline text-on-background">Legal <span className="text-primary italic">Notice</span></h1>
            <p className="text-on-surface-variant max-w-xl mx-auto text-base leading-relaxed">
              While this website is generally prepared and maintained pursuant to applicable laws, the following legal notice applies to all users who access this website, regardless of jurisdiction.
            </p>
          </div>

          {/* General notices */}
          <div className="space-y-4 mb-12">
            {generalNotices.map(item => (
              <div key={item.title} className="flex flex-col sm:flex-row gap-4 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/15 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-headline text-on-background">{item.title}</h2>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* State-specific notices */}
          <div className="space-y-4">
            <h2 className="text-xl font-headline text-on-background mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
              State-Specific Notices
            </h2>
            {stateNotices.map(notice => (
              <div
                key={notice.state}
                className={`p-6 rounded-2xl border ${notice.highlight ? 'border-primary/25 bg-primary/5' : 'border-outline-variant/10 bg-surface-container-low'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {notice.highlight && <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>}
                  <h3 className={`text-base font-headline ${notice.highlight ? 'text-primary' : 'text-on-background'}`}>{notice.state}</h3>
                  {notice.highlight && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 uppercase tracking-widest">Primary Jurisdiction</span>}
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{notice.content}</p>
              </div>
            ))}
          </div>

          {/* Settlement disclaimer */}
          <div className="mt-10 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/5">
            <p className="text-[11px] text-outline leading-relaxed">
              The settlement estimate provided by ClaimCalculator.ai is produced using a proprietary model informed by historical U.S. settlements and multiple third-party data sources. This tool is for informational and illustrative purposes only and does not constitute legal advice, a valuation, or a guarantee of results. Actual outcomes depend on the specific facts of your case and the attorney representing you. Past results do not predict future outcomes. Every case is unique, and actual results depend on specific facts, applicable law, and your attorney's representation. Use of this tool does not create an attorney-client relationship. You should consult with a qualified attorney before making decisions about your case.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}
