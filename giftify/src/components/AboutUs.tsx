import { Target, ShieldCheck, HeartPulse, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="bg-white min-h-screen py-16 sm:py-24 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Intro Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            Our Mission
          </span>
          <h1 className="mt-4 font-sans font-extrabold text-4xl sm:text-5xl text-gray-900 tracking-tight leading-none">
            About <span className="text-purple-600">Giftify</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-500 font-sans leading-relaxed">
            We are dedicated to celebrating milestones together. Giftify removes the mental fatigue and stress of coordination from beautiful celebrations, making moments memorable.
          </p>
        </div>

        {/* Purpose Card */}
        <div className="bg-purple-50/50 rounded-3xl p-8 sm:p-10 mb-12 border border-purple-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow flex items-center justify-center shrink-0">
              <Target className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-sans font-bold text-gray-900 mb-2">Purpose of Giftify</h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Giftify was created to eliminate duplication, gift regrets, and awkward guesswork. By providing a single point of collaboration, we allow organizers to publish exact product links, choose what they care about most, and empower guests to reserve items instantly. Everyone feels excited to give, and hosts receive exactly what fits their home.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Grid */}
        <div className="mb-16">
          <h2 className="text-center font-sans font-bold text-2xl text-gray-900 mb-10">How It Works in 3 Simple Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Setup Your Event",
                desc: "Enter your celebration parameters like time, venue, and custom template invitation structures in under 2 minutes."
              },
              {
                step: "02",
                title: "Curate Gifting Directory",
                desc: "Add items from any website with customizable priority meters (High, Medium, Low), so friends know what you need most."
              },
              {
                step: "03",
                title: "Real-time RSVPs & Sync",
                desc: "Send your invite link. Guests RSVP and safely reserve items in real-time. Reserved gifts are instantly locked out for others."
              }
            ].map((stepObj) => (
              <div key={stepObj.step} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all relative">
                <span className="absolute -top-6 left-6 font-sans font-black text-6xl text-purple-100/60 select-none z-0">
                  {stepObj.step}
                </span>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{stepObj.title}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{stepObj.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two-Column Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Benefits for Organizers */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 hover:border-purple-100 transition-all">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 flex items-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-sans font-bold text-lg sm:text-xl text-gray-900">Benefits for Organizers</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Consolidate invitations & custom design templates in one dashboard.",
                "Instantly track guest lists, veggie/non-veggie dining preferences, and family counts.",
                "Prevent duplicate gifts automatically with live reservation toggles.",
                "Easily export or search RSVPs without copying and pasting chat messages."
              ].map((benefit, i) => (
                <li key={i} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits for Guests */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 hover:border-purple-100 transition-all">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 flex items-center">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h3 className="font-sans font-bold text-lg sm:text-xl text-gray-900">Benefits for Guests</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Secure, single-click RSVP experience without needing to register or download apps.",
                "Access complete list of approved gift wishes with official product links.",
                "Reserve gifts quickly and securely, preventing duplicate purchases.",
                "Deselect/change mind safely and instantly with live-updating item cards."
              ].map((benefit, i) => (
                <li key={i} className="flex items-start space-x-2 text-xs sm:text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
