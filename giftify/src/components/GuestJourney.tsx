import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle, XCircle, Gift, ExternalLink, Calendar, MapPin, 
  Sparkles, Check, AlertCircle, RefreshCw, ChefHat, Heart, Users
} from 'lucide-react';
import { Event, Gift as GiftType, GuestRSVP } from '../types';

interface GuestJourneyProps {
  eventId: string;
  onNavigateHome: () => void;
}

export default function GuestJourney({ eventId, onNavigateHome }: GuestJourneyProps) {
  const [activeScreen, setActiveScreen] = useState<'invite' | 'form' | 'gifts' | 'not-attending-confirm'>('invite');
  const [eventData, setEventData] = useState<Event | null>(null);
  const [gifts, setGifts] = useState<GiftType[]>([]);
  const [guestRsvpResult, setGuestRsvpResult] = useState<GuestRSVP | null>(null);

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [familyCount, setFamilyCount] = useState<number>(1);
  const [vegCount, setVegCount] = useState<number>(0);
  const [nonVegCount, setNonVegCount] = useState<number>(1);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Unique guestId tracked locally across render loops so we don't duplicate guest registries
  const [guestId, setGuestId] = useState<string>(() => {
    const saved = localStorage.getItem(`giftify_guest_id_${eventId}`);
    if (saved) return saved;
    const newId = "GST-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    localStorage.setItem(`giftify_guest_id_${eventId}`, newId);
    return newId;
  });

  // Fetch event meta
  const fetchEventMeta = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/public/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEventData(data);
      } else {
        setError("Invitation expired or invalid URL link. Please confirm the code with your host.");
      }
    } catch (e) {
      setError("Failed to fetch invitation details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch gift wishlist
  const fetchGifts = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/gifts`);
      if (res.ok) {
        const data = await res.json();
        setGifts(data);
      }
    } catch (e) {
      console.error("Gifts load error", e);
    }
  };

  // Sync details on mount
  useEffect(() => {
    if (eventId) {
      fetchEventMeta();
      fetchGifts();
    }
  }, [eventId]);

  // Establish Server-Sent Events (SSE) for Real-Time synchronization!
  useEffect(() => {
    if (!eventId) return;

    console.log(`Establishing Real-Time Server-Sent Events stream for event: ${eventId}`);
    const sse = new EventSource(`/api/events/${eventId}/live`);

    sse.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log("Real-time SSE event parsed successfully:", parsed);
        if (parsed.type === "SYNC") {
          // Instantly sync gifts list when other users reserve things of the database!
          fetchGifts();
        }
      } catch (e) {
        console.error("SSE parsing failure", e);
      }
    };

    sse.onerror = (err) => {
      console.warn("SSE interface dropped connectivity, falling back to backup short polling helper:", err);
    };

    // Backup Polling Interval in case SSE is blocked by local proxy issues
    const fallbackSyncInterval = setInterval(() => {
      fetchGifts();
    }, 3000);

    return () => {
      sse.close();
      clearInterval(fallbackSyncInterval);
    };
  }, [eventId]);

  // Form submission: Save Guest RSVP response
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName || !email) {
      setError("Full Name and Email Address are highly required fields.");
      return;
    }

    if (vegCount + nonVegCount !== familyCount) {
      setError(`Your dining preferences totals (${vegCount} Veg + ${nonVegCount} Non-Veg) must match your total family count (${familyCount} member(s)).`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          familyMembers: familyCount,
          vegCount,
          nonVegCount,
          attendanceStatus: "accepted",
          guestId
        })
      });

      if (res.ok) {
        const parsedRsvp = await res.json();
        setGuestRsvpResult(parsedRsvp);
        setSuccess("RSVP submitted successfully! Let's choose your gift wishlist item next.");
        setTimeout(() => {
          setActiveScreen('gifts');
          setSuccess(null);
        }, 1200);
      } else {
        const errData = await res.json();
        setError(errData.error || "RSVP submission failed.");
      }
    } catch (err) {
      setError("Network fault logging RSVP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineInvitation = async () => {
    // Save a declined RSVP to let host know
    try {
      await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName || "Anonymous Declined Guest",
          email: email || "declined@giftify.com",
          attendanceStatus: "declined",
          guestId
        })
      });
    } catch (e) {
      console.error(e);
    }
    setActiveScreen('not-attending-confirm');
  };

  const handleClearForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setFamilyCount(1);
    setVegCount(0);
    setNonVegCount(1);
  };

  // Real-Time reserving logic: Select Gift (Guest locks card)
  const handleSelectGift = async (wishItem: GiftType) => {
    setError(null);
    const mockGuestName = fullName || guestRsvpResult?.name || "Anonymous Guest";
    
    try {
      const res = await fetch(`/api/gifts/${wishItem.id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, guestName: mockGuestName })
      });

      if (res.ok) {
        // Redraw gifts list locally
        fetchGifts();
      } else {
        const errData = await res.json();
        setError(errData.error || "This item was reserved by another guest just now.");
        fetchGifts(); // sync immediately
      }
    } catch (e) {
      setError("Network speed fluctuation, please retry.");
    }
  };

  // Real-Time releasing logic: Deselect Gift (Guest unlocks Card)
  const handleDeselectGift = async (wishItem: GiftType) => {
    setError(null);
    if (wishItem.reservedByGuestId && wishItem.reservedByGuestId !== guestId) {
      setError("This gift was selected by another guest and its status cannot be changed by other users.");
      return;
    }
    try {
      const res = await fetch(`/api/gifts/${wishItem.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId })
      });

      if (res.ok) {
        fetchGifts();
      } else {
        setError("Unable to cancel gift lease.");
      }
    } catch (e) {
      setError("Network failed to release gift reservation.");
    }
  };

  if (isLoading && !eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
        <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mb-2" />
        <span className="text-xs text-gray-500 font-bold">Fetching unique celebration invitation files...</span>
      </div>
    );
  }

  if (error && !eventData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 max-w-md mx-auto text-center font-sans">
        <XCircle className="h-10 w-10 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Invitation Error</h2>
        <p className="text-gray-500 text-xs sm:text-sm mb-6 leading-relaxed">
          {error}
        </p>
        <button
          onClick={onNavigateHome}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl"
        >
          Return to Giftify Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in flex flex-col items-center justify-center">
      
      {/* GLOBAL BANNER ERROR MONITOR */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl flex items-start space-x-2 text-xs font-semibold max-w-xl w-full">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-3.5 rounded-2xl flex items-start space-x-2 text-xs font-semibold max-w-xl w-full">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}


      {/* SCREEN 1: THE INVITATION DEBUT */}
      {activeScreen === 'invite' && eventData && (
        <div className="max-w-xl w-full bg-white rounded-3xl overflow-hidden border border-gray-150/80 shadow-lg text-center">
          
          {/* Header Theme representation illustration */}
          <div className="p-8 text-white min-h-[300px] flex flex-col justify-between items-center text-center relative border-b border-gray-100 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-4 left-4 right-4 bottom-4 border border-dashed border-amber-300/40 rounded-2xl pointer-events-none" />

            {eventData.invitationOption === 'template' ? (
              <>
                <div className="space-y-1 z-10">
                  <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest block bg-white/5 border border-white/10 px-3 py-1 rounded-full w-max mx-auto">
                    CELERATING IN STYLE
                  </span>
                  <h1 className="font-serif font-extrabold text-2xl sm:text-3xl text-amber-300 tracking-tight leading-none pt-4">
                    {eventData.templateData?.eventName || eventData.name}
                  </h1>
                </div>

                <div className="z-10 my-4 text-center max-w-sm">
                  <p className="font-sans text-[11px] sm:text-xs text-purple-200 leading-relaxed font-light">
                    Host Partner: <strong className="text-white font-bold">{eventData.templateData?.hostName || "Host"}</strong>
                  </p>
                  <p className="font-sans italic text-xs sm:text-sm text-gray-100 font-medium my-2">
                    "{eventData.templateData?.specialMessage || "Join our special day!"}"
                  </p>
                </div>

                <div className="z-10 bg-white/5 border border-white/10 p-3 rounded-2xl text-[11px] font-bold tracking-wide w-full max-w-xs flex justify-around">
                  <div>
                    <span className="block text-[8px] text-amber-300 uppercase tracking-widest">Date</span>
                    <span>{eventData.templateData?.eventDate || eventData.date}</span>
                  </div>
                  <div className="border-l border-white/10 px-2" />
                  <div>
                    <span className="block text-[8px] text-amber-300 uppercase tracking-widest">Dinner</span>
                    <span>{eventData.templateData?.foodTime || eventData.foodServingTime}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="inset-0 absolute w-full h-full">
                {eventData.invitationImageUrl ? (
                  <img
                    src={eventData.invitationImageUrl}
                    alt="Celebration Invitation Card"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-purple-900 border-2">
                    <span className="text-xs text-purple-200">No Custom Invitation Uploaded</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Invitation Footer Controls with touch targets at least 44px */}
          <div className="p-6 sm:p-10 space-y-6 bg-white">
            <div className="space-y-2">
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Would you like to celebrate with us?</h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Kindly submit your RSVP parameters so we can tally seat numbers and cooking proportions correctly.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setActiveScreen('form')}
                className="min-h-[48px] px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer hover:shadow-md flex items-center justify-center space-x-2"
                id="btn-accept"
              >
                <Check className="h-4 w-4" />
                <span>Accept Invitation</span>
              </button>
              
              <button
                onClick={handleDeclineInvitation}
                className="min-h-[48px] px-6 border border-gray-200 text-gray-650 hover:bg-red-50 hover:text-red-700 hover:border-red-200 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2"
                id="btn-decline"
              >
                <XCircle className="h-4 w-4 shrink-0" />
                <span>Decline RSVP</span>
              </button>
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-center space-x-6 text-xs text-gray-400 font-medium">
              <span className="flex items-center space-x-1.5">
                <MapPin className="h-3.5 w-3.5 text-purple-400" />
                <span>{eventData.venue}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Calendar className="h-3.5 w-3.5 text-purple-400" />
                <span>{eventData.date}</span>
              </span>
            </div>
          </div>

        </div>
      )}


      {/* SCREEN 2: GUEST INFORMATION RSVP FORM */}
      {activeScreen === 'form' && eventData && (
        <div className="max-w-lg w-full bg-white rounded-3xl border border-gray-100 shadow-lg p-6 sm:p-8">
          <button 
            onClick={() => setActiveScreen('invite')}
            className="flex items-center space-x-1 text-xs text-purple-650 font-bold hover:underline mb-6 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Invitation Card</span>
          </button>

          <div className="space-y-1 mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">Your RSVP Details</h2>
            <p className="text-xs text-gray-400">Complete required dimensions to automatically advance to gift directory list selection.</p>
          </div>

          <form onSubmit={handleRsvpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Jennifer Aniston"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., jennifer@example.com"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., +1 (555) 019-2834"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Attendance numbers tally block */}
            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-4">
              <span className="text-xs font-bold text-purple-750 flex items-center space-x-1.5 uppercase tracking-wide">
                <ChefHat className="h-4 w-4" />
                <span>Catering & Seating Seats Tally</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Attending Count</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    required
                    value={familyCount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1;
                      setFamilyCount(val);
                      // default non-veg/veg
                      setNonVegCount(val);
                      setVegCount(0);
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold bg-white text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Vegetarians</label>
                  <input
                    type="number"
                    min={0}
                    max={familyCount}
                    required
                    value={vegCount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setVegCount(val);
                      setNonVegCount(familyCount - val >= 0 ? familyCount - val : 0);
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-center text-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Non-Vegetarians</label>
                  <input
                    type="number"
                    min={0}
                    max={familyCount}
                    required
                    value={nonVegCount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setNonVegCount(val);
                      setVegCount(familyCount - val >= 0 ? familyCount - val : 0);
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-center text-amber-600 font-bold"
                  />
                </div>

              </div>
              <p className="text-[10px] text-gray-400">Make sure Veg + Non-Veg count equates strictly to Attending Count.</p>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClearForm}
                className="px-4 py-2 border border-gray-205 text-gray-550 rounded-xl text-xs sm:text-sm hover:bg-gray-50 cursor-pointer"
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer shadow-sm hover:shadow"
                id="btn-rsvp-submit"
              >
                Submit RSVP details
              </button>
            </div>
          </form>
        </div>
      )}


      {/* SCREEN 3: NOT ATTENDING / MOCK DECLINE REDIRECT */}
      {activeScreen === 'not-attending-confirm' && eventData && (
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-150 p-6 sm:p-10 text-center shadow-lg">
          <Heart className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Thank you for letting us know!</h2>
          <p className="text-gray-500 text-xs sm:text-sm mb-6 max-w-sm mx-auto leading-relaxed">
            We are sorry you cannot attend the celebration. But if you would still like to choose and send an approved gift to your friend, click continue below.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => setActiveScreen('gifts')}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl cursor-pointer shadow-sm"
            >
              Continue To Gift Selection
            </button>
            <button
              onClick={() => setActiveScreen('invite')}
              className="w-full py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-bold rounded-xl cursor-pointer"
            >
              Back to Invitation
            </button>
          </div>
        </div>
      )}


      {/* SCREEN 4: GIFT SELECTION TREE (REAL-TIME SSE SUPPORTED) */}
      {activeScreen === 'gifts' && eventData && (
        <div className="max-w-5xl w-full animate-fade-in space-y-6">
          
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                // Return to Invitation Page but do NOT lose RSVP states
                setActiveScreen('invite');
                setError(null);
              }}
              className="inline-flex items-center space-x-1.5 text-xs text-purple-600 hover:underline font-bold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Invitation Card</span>
            </button>

            {/* Quick RSVP identifier banner in top right */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-extrabold text-gray-400 block">Logged Guest Session</span>
              <span className="text-xs font-bold text-purple-700">
                {fullName || guestRsvpResult?.name || "Guest Contributor"} / {guestRsvpResult?.attendanceStatus === 'accepted' ? 'Attending' : guestRsvpResult?.attendanceStatus === 'declined' ? 'Declined' : 'Viewing'}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-105 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Celebration Gifting Registry</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900">Approved Gift Directory Wishlist</h1>
                <p className="text-xs text-gray-400">Lock custom wishes below. Once chosen, items instantly label as "Selected by Others" for other guests.</p>
              </div>

              <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 border-2 border-dashed border-amber-300 px-3.5 py-2 rounded-2xl">
                <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Real-time DB Sync Active</span>
              </div>
            </div>

            {gifts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {gifts.map((item) => {
                  const isReserved = !!item.reservedByGuestId;
                  const reservedByMe = item.reservedByGuestId === guestId;

                  return (
                    <div 
                      key={item.id} 
                      className={`h-full border bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between ${
                        reservedByMe ? 'border-purple-500 shadow-sm ring-2 ring-purple-100' : 'border-gray-100'
                      }`}
                    >
                      <div>
                        {/* Image wrapper */}
                        <div className="h-44 bg-gray-50 relative flex items-center justify-center overflow-hidden border-b border-gray-100">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Gift className="h-8 w-8 text-gray-250 mx-auto mb-1" />
                              <span className="text-[10px] text-gray-400">No product image added</span>
                            </div>
                          )}

                          {/* Priority badges */}
                          <span className={`absolute top-3 left-3 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            item.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-150' :
                            item.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                            'bg-green-50 text-green-700 border border-green-150'
                          }`}>
                            {item.priority} Priority
                          </span>

                          {/* Lock statuses */}
                          {isReserved && (
                            <span className="absolute inset-0 bg-gray-900/60 backdrop-blur-[1px] flex items-center justify-center text-center p-4">
                              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold leading-none ${
                                reservedByMe 
                                  ? 'bg-purple-600 text-white shadow-md' 
                                  : 'bg-red-650 text-white bg-red-600'
                              }`}>
                                {reservedByMe ? "🔒 Selected by You" : "🚫 Selected by Others"}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Title text */}
                        <div className="p-4">
                          <h4 className="font-extrabold text-sm text-gray-900 line-clamp-2 leading-tight">{item.name}</h4>
                        </div>
                      </div>

                      {/* Footer lock buttons with touch target metrics */}
                      <div className="p-4 pt-0 border-t border-gray-50 flex flex-col gap-2 pt-3">
                        {item.productLink && (
                          <a
                            href={item.productLink}
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[36px] bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100/80 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 uppercase tracking-wide cursor-pointer"
                          >
                            <span>View Product details</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        {!isReserved && (
                          <button
                            onClick={() => handleSelectGift(item)}
                            className="min-h-[40px] w-full px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                          >
                            Select Gift
                          </button>
                        )}

                        {reservedByMe && (
                          <button
                            onClick={() => handleDeselectGift(item)}
                            className="min-h-[40px] w-full px-4 border border-red-200 text-red-500 hover:bg-red-50 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                          >
                            Deselect Gift
                          </button>
                        )}

                        {isReserved && !reservedByMe && (
                          <button
                            disabled
                            className="min-h-[40px] w-full px-4 bg-gray-100 text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed cursor-pointer"
                          >
                            Selected by Others
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Gift className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs">This celebration hasn't published any gift wishes yet.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
