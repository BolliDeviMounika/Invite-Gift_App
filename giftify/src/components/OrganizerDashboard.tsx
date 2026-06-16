import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, FileText, Gift, Users, BarChart3, Settings, LogOut, 
  Plus, Edit2, Trash2, CheckCircle2, XCircle, Clock, Copy, Mail, PlusCircle, Trash,
  Upload, HelpCircle, ChevronRight, Sparkles, Search, SlidersHorizontal, Eye, RefreshCw,
  Share, ExternalLink
} from 'lucide-react';
import { Event, EventType, Gift as GiftType, GiftPriority, GuestRSVP } from '../types';

interface OrganizerDashboardProps {
  token: string;
  user: { id: string; name: string; email: string };
  onLogout: () => void;
  inviteQuery?: string | null;
}

export default function OrganizerDashboard({ token, user, onLogout }: OrganizerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'invitations' | 'gifts' | 'responses' | 'analytics' | 'settings'>('dashboard');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load Statuses
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // States inside child tabs
  const [gifts, setGifts] = useState<GiftType[]>([]);
  const [rsvps, setRsvps] = useState<GuestRSVP[]>([]);

  // Selected Event Context
  const activeEvent = events.find(e => e.id === selectedEventId) || events[0] || null;

  // Syncing Event ID on active selection change
  useEffect(() => {
    if (activeEvent) {
      setSelectedEventId(activeEvent.id);
    }
  }, [events]);

  // Fetch all organizer events on mount
  const fetchEvents = async (autoSelectLatest = false) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0) {
          if (autoSelectLatest) {
            setSelectedEventId(data[data.length - 1].id);
          } else if (!selectedEventId) {
            setSelectedEventId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  // Fetch gifts whenever the active event changes
  const fetchGifts = async (eventId: string) => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/events/${eventId}/gifts`);
      if (res.ok) {
        const data = await res.json();
        setGifts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch responses (RSVPs) whenever active event changes
  const fetchRSVPs = async (eventId: string) => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/events/${eventId}/rsvps`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRsvps(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchGifts(selectedEventId);
      fetchRSVPs(selectedEventId);
    } else {
      setGifts([]);
      setRsvps([]);
    }
  }, [selectedEventId]);

  // Handle Event Creation Form
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [evName, setEvName] = useState("");
  const [evType, setEvType] = useState<EventType>("Birthday");
  const [evDate, setEvDate] = useState("");
  const [evVenue, setEvVenue] = useState("");
  const [evFoodTime, setEvFoodTime] = useState("");

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evName || !evType || !evDate || !evVenue) {
      setError("Please fill out all required event parameters.");
      return;
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: evName,
          type: evType,
          date: evDate,
          venue: evVenue,
          foodServingTime: evFoodTime,
          invitationOption: "template",
          templateData: {
            hostName: user.name,
            eventName: evName,
            eventDate: evDate,
            eventVenue: evVenue,
            foodTime: evFoodTime || "TBD",
            specialMessage: "We are excited to celebrate this milestone! Join us."
          }
        })
      });

      if (res.ok) {
        const newEv = await res.json();
        setSuccess(`Event '${evName}' created successfully!`);
        setEvName("");
        setEvDate("");
        setEvVenue("");
        setEvFoodTime("");
        setIsCreatingEvent(false);
        await fetchEvents(true); // reload events and auto-select latest
      } else {
        const data = await res.json();
        setError(data.error || "Event setup failure.");
      }
    } catch (err) {
      setError("Network fault creating event.");
    }
  };

  // Invitation creation module option/template vars
  const [invOption, setInvOption] = useState<'upload' | 'template'>('template');
  const [uploadedBase64, setUploadedBase64] = useState<string>("");
  const [templateType, setTemplateType] = useState<EventType>('Birthday');
  const [tplHost, setTplHost] = useState(user.name);
  const [tplTitle, setTplTitle] = useState("");
  const [tplDate, setTplDate] = useState("");
  const [tplVenue, setTplVenue] = useState("");
  const [tplFoodTime, setTplFoodTime] = useState("");
  const [tplMessage, setTplMessage] = useState("");
  
  // Sync template fields with current event details when loaded
  useEffect(() => {
    if (activeEvent) {
      setInvOption(activeEvent.invitationOption || 'template');
      setTemplateType(activeEvent.type);
      setUploadedBase64(activeEvent.invitationImageUrl || "");
      if (activeEvent.templateData) {
        setTplHost(activeEvent.templateData.hostName || user.name);
        setTplTitle(activeEvent.templateData.eventName || activeEvent.name);
        setTplDate(activeEvent.templateData.eventDate || activeEvent.date);
        setTplVenue(activeEvent.templateData.eventVenue || activeEvent.venue);
        setTplFoodTime(activeEvent.templateData.foodTime || activeEvent.foodServingTime);
        setTplMessage(activeEvent.templateData.specialMessage || "Join our special celebration!");
      } else {
        setTplHost(user.name);
        setTplTitle(activeEvent.name);
        setTplDate(activeEvent.date);
        setTplVenue(activeEvent.venue);
        setTplFoodTime(activeEvent.foodServingTime || "6:00 PM");
        setTplMessage("We look forward to celebrating together.");
      }
    }
  }, [activeEvent]);

  // Simulate or convert image files to base64 DataURL
  const handleInvitationImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateInvitation = async () => {
    if (!activeEvent) return;
    setError(null);
    setSuccess(null);

    const dataPayloadObj: any = {
      invitationOption: invOption,
    };

    if (invOption === 'upload') {
      if (!uploadedBase64) {
        setError("Please choose or upload active Invitation Image first.");
        return;
      }
      dataPayloadObj.invitationImageUrl = uploadedBase64;
    } else {
      dataPayloadObj.templateData = {
        hostName: tplHost,
        eventName: tplTitle,
        eventDate: tplDate,
        eventVenue: tplVenue,
        foodTime: tplFoodTime,
        specialMessage: tplMessage
      };
      // For templates, write pre-configured placeholder template graphic text representation in image
      dataPayloadObj.invitationImageUrl = ""; // clear upload
    }

    try {
      const res = await fetch(`/api/events/${activeEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataPayloadObj)
      });

      if (res.ok) {
        setSuccess("Invitation Card and settings stored successfully!");
        fetchEvents();
      } else {
        setError("Error saving invitation config.");
      }
    } catch (e) {
      setError("Network failed to upload invitation parameters.");
    }
  };

  // Gift states
  const [giftName, setGiftName] = useState("");
  const [giftLink, setGiftLink] = useState("");
  const [giftImg, setGiftImg] = useState("");
  const [giftPriority, setGiftPriority] = useState<GiftPriority>("Medium");
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);

  const handleSaveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) {
      setError("Please create and select active event first.");
      return;
    }
    if (!giftName) {
      setError("Gift Name is required.");
      return;
    }

    try {
      if (editingGiftId) {
        // Edit
        const res = await fetch(`/api/gifts/${editingGiftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: giftName,
            productLink: giftLink,
            productImage: giftImg,
            priority: giftPriority
          })
        });

        if (res.ok) {
          setSuccess("Gift edited successfully.");
          setGiftName("");
          setGiftLink("");
          setGiftImg("");
          setGiftPriority("Medium");
          setEditingGiftId(null);
          fetchGifts(activeEvent.id);
        }
      } else {
        // Create
        const res = await fetch(`/api/events/${activeEvent.id}/gifts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: giftName,
            productLink: giftLink,
            productImage: giftImg,
            priority: giftPriority
          })
        });

        if (res.ok) {
          setSuccess("Gift added successfully.");
          setGiftName("");
          setGiftLink("");
          setGiftImg("");
          setGiftPriority("Medium");
          fetchGifts(activeEvent.id);
        }
      }
    } catch (err) {
      setError("Failed to transmit gift parameters.");
    }
  };

  const handleEditGiftClick = (gift: GiftType) => {
    setEditingGiftId(gift.id);
    setGiftName(gift.name);
    setGiftLink(gift.productLink);
    setGiftImg(gift.productImage || "");
    setGiftPriority(gift.priority);
  };

  const handleDeleteGift = async (giftId: string) => {
    if (!confirm("Are you sure you want to remove this gift option from the catalog?")) return;
    try {
      const res = await fetch(`/api/gifts/${giftId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess("Gift option deleted.");
        if (activeEvent) fetchGifts(activeEvent.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Invitation link generation module
  const [isMailDispatched, setIsMailDispatched] = useState(false);
  const [generatedLinkUrl, setGeneratedLinkUrl] = useState("");
  const [copySuccessText, setCopySuccessText] = useState("");
  const [isShareSupported, setIsShareSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setIsShareSupported(true);
    }
  }, []);

  const handleGenerateLink = () => {
    if (!activeEvent) return;
    const origin = window.location.origin;
    const shareLink = `${origin}/?invite=${activeEvent.id}`;
    setGeneratedLinkUrl(shareLink);
    setIsMailDispatched(true);

    // Mock send to organizer email
    console.log(`\n--- MOCK EMAIL SINK DISPATCH ---`);
    console.log(`To: ${user.email}`);
    console.log(`Subject: Giftify Invitation link ready: '${activeEvent.name}'`);
    console.log(`Invitation Link: ${shareLink}`);
    console.log(`-------------------------------\n`);
  };

  const copyToClipboard = () => {
    if (generatedLinkUrl) {
      navigator.clipboard.writeText(generatedLinkUrl);
      setCopySuccessText("Copied!");
      setTimeout(() => setCopySuccessText(""), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!activeEvent || !generatedLinkUrl) return;
    try {
      await navigator.share({
        title: `You're Invited to ${activeEvent.name}!`,
        text: `Please join us for our celebration. You can RSVP and choose from our gift wishlist here:`,
        url: generatedLinkUrl
      });
    } catch (err) {
      console.log("Native share failed or dismissed", err);
    }
  };

  // Guest Responses Search/Filters
  const [rsvpSearch, setRsvpSearch] = useState("");
  const [rsvpFilterStatus, setRsvpFilterStatus] = useState<'All' | 'accepted' | 'declined'>('All');

  const filteredRsvps = rsvps.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(rsvpSearch.toLowerCase()) || 
                          r.email.toLowerCase().includes(rsvpSearch.toLowerCase()) ||
                          (r.phone && r.phone.includes(rsvpSearch));
    const matchesStatus = rsvpFilterStatus === 'All' || r.attendanceStatus === rsvpFilterStatus;
    return matchesSearch && matchesStatus;
  });

  // Settings states
  const [settingsName, setSettingsName] = useState(user.name);
  const [settingsEmail, setSettingsEmail] = useState(user.email);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row font-sans">
      
      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-white border-b border-gray-100 flex items-center justify-between px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-purple-600 text-white flex items-center">
            <Gift className="h-4 w-4" />
          </div>
          <span className="font-bold text-base text-gray-900">Giftify Dashboard</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 text-gray-500 hover:text-purple-600 focus:outline-none"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 p-4 space-y-2 absolute top-14 left-0 w-full z-45 shadow-lg animate-slide-in">
          {[
            { id: 'dashboard', label: 'Dashboard Home', icon: LayoutDashboard },
            { id: 'events', label: 'Event Setup', icon: Calendar },
            { id: 'invitations', label: 'Invitations Module', icon: FileText },
            { id: 'gifts', label: 'Gift Directory', icon: Gift },
            { id: 'responses', label: 'RSVP Guest Logs', icon: Users },
            { id: 'analytics', label: 'Analytics Panel', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-left ${
                  activeTab === item.id
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="border-t border-gray-100 pt-2 px-4 flex justify-between items-center">
            <span className="text-xs text-gray-500">Alex Morgan</span>
            <button onClick={onLogout} className="text-xs font-bold text-red-600 flex items-center space-x-1 py-1">
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-150 py-6 px-4 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Dashboard Header Brand */}
          <div className="flex items-center space-x-2 px-2">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-sm flex items-center justify-center">
              <Gift className="h-5 w-5" />
            </div>
            <span className="font-sans font-bold text-lg tracking-tight text-gray-900">
              Giftify <span className="text-purple-650 font-extrabold text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 ml-1">Admin</span>
            </span>
          </div>

          {/* Core Menu Options */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard Home', icon: LayoutDashboard },
              { id: 'events', label: 'Event Setup', icon: Calendar },
              { id: 'invitations', label: 'Invitations Card', icon: FileText },
              { id: 'gifts', label: 'Gift Directory', icon: Gift },
              { id: 'responses', label: 'RSVP Guest Logs', icon: Users },
              { id: 'analytics', label: 'Analytics Panel', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50/50'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout bottom */}
        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center space-x-3 px-2 mb-4">
            <div className="p-2 rounded-full bg-amber-100 text-amber-805 h-8 w-8 flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-gray-400 text-[10px] truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Developer Logout</span>
          </button>
        </div>
      </aside>

      {/* CORE CONTENT REGION */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl overflow-y-auto">
        
        {/* Banner Alert Manager */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between font-medium text-xs">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500">&times;</button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center justify-between font-semibold text-xs animate-slide-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-500">&times;</button>
          </div>
        )}

        {/* Global Action Banner: Active celebration selector dropdown */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Active Celebration Panel</h1>
            <p className="text-xs text-gray-500">Configure parameters, invitations, and registries for this exact target event.</p>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-450 whitespace-nowrap">Choose Event:</label>
            {events.length > 0 ? (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold text-purple-750 bg-purple-50 hover:bg-purple-100 border border-purple-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name} ({ev.type})</option>
                ))}
              </select>
            ) : (
              <span className="text-xs bg-red-50 text-red-750 border border-red-250 px-3 py-1 rounded-xl font-bold">No celebrations created yet</span>
            )}

            <button
              onClick={() => {
                setActiveTab('events');
                setIsCreatingEvent(true);
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1 cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>


        {/* TAB 1: DASHBOARD HOME */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Events", value: events.length, color: "bg-purple-50 border-purple-100 text-purple-700" },
                { label: "Guests Invited", value: rsvps.reduce((acc, r) => acc + (r.familyMembers || 1), 0), color: "bg-blue-50 border-blue-100 text-blue-700" },
                { label: "Accepted RSVPs", value: rsvps.filter(r => r.attendanceStatus === 'accepted').length, color: "bg-green-50 border-green-150 text-green-700" },
                { label: "Declined RSVPs", value: rsvps.filter(r => r.attendanceStatus === 'declined').length, color: "bg-red-50 border-red-150 text-red-700" },
                { label: "Gifts Reserved", value: gifts.filter(g => g.reservedByGuestId).length, color: "bg-amber-50 border-amber-100 text-amber-700" },
                { label: "Gifts Available", value: gifts.filter(g => !g.reservedByGuestId).length, color: "bg-sky-50 border-sky-100 text-sky-700" },
              ].map((card, i) => (
                <div key={i} className={`p-4 rounded-2xl border flex flex-col justify-between ${card.color} shadow-sm`}>
                  <span className="text-[10px] sm:text-xs font-bold leading-tight uppercase opacity-80">{card.label}</span>
                  <span className="text-2xl sm:text-3xl font-black mt-2 leading-none">{card.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event Summary Card */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Active Celebration Summary</span>
                {activeEvent ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                      <span className="text-sm font-semibold text-gray-500">Event Name:</span>
                      <span className="text-sm font-bold text-gray-800">{activeEvent.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                      <span className="text-sm font-semibold text-gray-500">Venue Location:</span>
                      <span className="text-sm font-bold text-gray-800">{activeEvent.venue}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                      <span className="text-sm font-semibold text-gray-500">Event Date:</span>
                      <span className="text-sm font-bold text-gray-800">{activeEvent.date}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-3">
                      <span className="text-sm font-semibold text-gray-500">Dinner Server Time:</span>
                      <span className="text-sm font-bold text-gray-800">{activeEvent.foodServingTime || "Not Specified"}</span>
                    </div>
                    
                    {/* Unique invitation link generator shortcut */}
                    <div className="mt-6 pt-4 border-t border-purple-50">
                      <h4 className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-2">Public Invitation Link</h4>
                      <p className="text-xs text-gray-400 mb-3">Guests use this link to check the card, submit RSVPs, and lock gifts in real-time.</p>
                      
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={handleGenerateLink}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm shrink-0 min-h-[44px]"
                          >
                            Generate & Sync Link
                          </button>
                        </div>

                        {generatedLinkUrl && (
                          <div className="space-y-2">
                            <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 pl-3 pr-1.5 py-1.5 justify-between max-w-md overflow-hidden">
                              <span className="text-xs font-mono text-gray-600 truncate mr-2">{generatedLinkUrl}</span>
                              <button
                                onClick={copyToClipboard}
                                className="p-1.5 bg-white border border-gray-150 hover:bg-gray-100 rounded-lg text-gray-650 hover:text-purple-600 flex items-center space-x-1 transition-all shrink-0 min-h-[32px]"
                                title="Copy details"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold text-purple-600">{copySuccessText || "Copy"}</span>
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1 max-w-md">
                              <a
                                href={generatedLinkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 min-h-[44px] sm:min-h-[36px] bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer border border-purple-100 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Open Invite Link</span>
                              </a>

                              {isShareSupported && (
                                <button
                                  onClick={handleNativeShare}
                                  className="flex-1 min-h-[44px] sm:min-h-[36px] bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                                >
                                  <Share className="h-3.5 w-3.5" />
                                  <span>Share Link</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {isMailDispatched && (
                        <p className="mt-2 text-[10px] font-semibold text-green-600 bg-green-50 inline-block px-3 py-1 rounded-lg">
                          Simulating email callback link notification dispatched to {user.email}!
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-12 text-center py-10">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">No target celebrations active. Click the setup tab to launch one.</p>
                  </div>
                )}
              </div>

              {/* Recent Active Log Feed */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-600">Simulated Activity Logs</span>
                  <div className="mt-4 space-y-4">
                    {rsvps.slice(0, 3).map((r, i) => (
                      <div key={i} className="flex items-start space-x-3 text-xs border-b border-gray-50 pb-3">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          r.attendanceStatus === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          <Users className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{r.name} RSVP'd {r.attendanceStatus === 'accepted' ? 'Yes' : 'No'}</p>
                          <p className="text-gray-400 text-[10px]">{new Date(r.submittedAt).toLocaleDateString()} • {r.familyMembers} member(s)</p>
                        </div>
                      </div>
                    ))}

                    {gifts.filter(g => g.reservedByGuestId).slice(0, 2).map((g, i) => (
                      <div key={i} className="flex items-start space-x-3 text-xs border-b border-gray-50 pb-3">
                        <div className="p-1.5 rounded-lg shrink-0 bg-amber-100 text-amber-700">
                          <Gift className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">Gift reserved: {g.name}</p>
                          <p className="text-gray-400 text-[10px]">Reserved by {g.reservedByGuestName || "Guest"}</p>
                        </div>
                      </div>
                    ))}

                    {rsvps.length === 0 && gifts.filter(g => g.reservedByGuestId).length === 0 && (
                      <div className="text-center py-10 text-gray-400">
                        <Clock className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs">No interaction records found. Link the guests to accumulate RSVP tracking logs.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 text-center border-t border-gray-50">
                  <button
                    onClick={() => setActiveTab('responses')}
                    className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                  >
                    View entire attendee index →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* TAB 2: EVENT MANAGEMENT */}
        {activeTab === 'events' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Celebration Setup Profile</h2>
              </div>

              {!isCreatingEvent ? (
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm mb-6 max-w-md">
                    To start, selecting an active celebration dynamically updates the rest of our dashboards (invitation presets, gift panels, analytics registries).
                  </p>
                  
                  {events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {events.map((ev) => (
                        <div
                          key={ev.id}
                          className={`p-5 rounded-2xl border transition-all relative group shadow-sm ${
                            selectedEventId === ev.id
                              ? 'border-purple-500 bg-purple-50/20'
                              : 'border-gray-100 bg-white hover:border-purple-200'
                          }`}
                        >
                          <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md ${
                            ev.type === 'Wedding' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            ev.type === 'Birthday' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            ev.type === 'Baby Shower' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {ev.type}
                          </span>

                          <h3 className="font-bold text-gray-900 mt-2 mb-1">{ev.name}</h3>
                          <p className="text-gray-500 text-xs mb-4">Venue: {ev.venue} • {ev.date}</p>

                          <div className="flex items-center space-x-2 pt-2 border-t border-gray-55">
                            <button
                              onClick={() => setSelectedEventId(ev.id)}
                              className={`px-3 py-1 bg-white border text-xs font-bold rounded-lg cursor-pointer ${
                                selectedEventId === ev.id
                                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {selectedEventId === ev.id ? 'Selected' : 'Select'}
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Remove event '${ev.name}'? This removes associated gifts and RSVPs.`)) {
                                  try {
                                    const res = await fetch(`/api/events/${ev.id}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                      setSuccess("Event deleted.");
                                      fetchEvents();
                                    }
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }
                              }}
                              className="px-2 py-1 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-bold rounded-lg hover:text-red-600"
                              title="Delete Event"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl">
                      <p className="text-gray-500 text-xs mb-3">You don't have any celebrations setup.</p>
                      <button
                        onClick={() => setIsCreatingEvent(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl"
                      >
                        Create Your First Event
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCreateEvent} className="space-y-4 max-w-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Event Name *</label>
                      <input
                        type="text"
                        required
                        value={evName}
                        onChange={(e) => setEvName(e.target.value)}
                        placeholder="e.g., Mia & Ryan's Wedding Ceremony"
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Event Type *</label>
                      <select
                        value={evType}
                        onChange={(e) => setEvType(e.target.value as any)}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="Birthday">Birthday</option>
                        <option value="Wedding">Wedding</option>
                        <option value="Baby Shower">Baby Shower</option>
                        <option value="Anniversary">Anniversary</option>
                        <option value="Housewarming">Housewarming</option>
                        <option value="Graduation">Graduation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Event Date *</label>
                      <input
                        type="date"
                        required
                        value={evDate}
                        onChange={(e) => setEvDate(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Event Venue *</label>
                      <input
                        type="text"
                        required
                        value={evVenue}
                        onChange={(e) => setEvVenue(e.target.value)}
                        placeholder="e.g., Grand Palace Hotel Ballroom"
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Food Serving Time (Optional)</label>
                    <input
                      type="text"
                      value={evFoodTime}
                      onChange={(e) => setEvFoodTime(e.target.value)}
                      placeholder="e.g., 7:30 PM (or Buffet all night!)"
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingEvent(false);
                        setEvName("");
                        setEvDate("");
                        setEvVenue("");
                        setEvFoodTime("");
                      }}
                      className="px-4 py-2 border border-gray-205 text-gray-600 rounded-xl text-xs sm:text-sm hover:bg-gray-50"
                    >
                      Clear & Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer shadow-sm"
                    >
                      Save Event
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}


        {/* TAB 3: INVITATION CARD CREATION */}
        {activeTab === 'invitations' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Invitation Creation Hub</h2>
              </div>

              {!activeEvent ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl">
                  <p className="text-gray-500 text-xs">Please configure an active celebration from the Setup Events tab first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Option controls */}
                  <div className="lg:col-span-5 space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Design Path</label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 border border-gray-200 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setInvOption('template')}
                          className={`py-2 text-xs font-bold rounded-lg cursor-pointer ${
                            invOption === 'template' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-purple-650'
                          }`}
                        >
                          Generate Template
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvOption('upload')}
                          className={`py-2 text-xs font-bold rounded-lg cursor-pointer ${
                            invOption === 'upload' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-purple-650'
                          }`}
                        >
                          Upload Custom Image
                        </button>
                      </div>
                    </div>

                    {invOption === 'upload' ? (
                      <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-750 mb-2">Upload Invitation Card Image</label>
                        <p className="text-gray-400 text-[10px] mb-4 leading-normal">Allowed formats: PNG, JPG, WEBP. Max size: 10MB.</p>
                        
                        <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-200 rounded-2xl bg-white hover:bg-purple-50/20 transition-all">
                          <Upload className="h-8 w-8 text-purple-400 mb-2" />
                          <span className="text-xs font-bold text-purple-700">Choose file or drag here</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleInvitationImageChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>

                        {uploadedBase64 && (
                          <div className="mt-4 p-2 bg-emerald-50 text-emerald-700 text-[10px] rounded-lg font-bold flex items-center justify-between">
                            <span>File attachment captured and pre-rendered below!</span>
                            <button onClick={() => setUploadedBase64("")} className="text-xs">&times;</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Host Name</label>
                            <input
                              type="text"
                              value={tplHost}
                              onChange={(e) => setTplHost(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title Celebration</label>
                            <input
                              type="text"
                              value={tplTitle}
                              onChange={(e) => setTplTitle(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Event Date</label>
                            <input
                              type="text"
                              value={tplDate}
                              onChange={(e) => setTplDate(e.target.value)}
                              placeholder="e.g., Saturday, Aug 12th"
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Venue Address</label>
                            <input
                              type="text"
                              value={tplVenue}
                              onChange={(e) => setTplVenue(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Food Serving Time</label>
                          <input
                            type="text"
                            value={tplFoodTime}
                            onChange={(e) => setTplFoodTime(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Special Message / Quote</label>
                          <textarea
                            rows={3}
                            value={tplMessage}
                            onChange={(e) => setTplMessage(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-50">
                      <button
                        onClick={handleUpdateInvitation}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl cursor-pointer shadow-sm hover:shadow"
                      >
                        {invOption === 'template' ? "Generate Invitation Card" : "Apply Custom Upload Parameters"}
                      </button>
                    </div>
                  </div>

                  {/* Pre-designer Live Viewer box */}
                  <div className="lg:col-span-7 flex flex-col justify-between">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-650 mb-3">Invitation Card Live Preview</span>
                      
                      {/* Premium Pre-designed SVG Invitation template layout depending on categories */}
                      {invOption === 'template' ? (
                        <div className="relative rounded-3xl overflow-hidden shadow-md border-4 border-amber-300 bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 p-6 sm:p-10 text-white min-h-[440px] flex flex-col justify-between items-center text-center">
                          {/* Royal visual rings */}
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-dashed border-amber-300/40 rounded-2xl pointer-events-none" />

                          <div className="space-y-2 z-10 w-full">
                            <span className="text-amber-400 text-xs font-black uppercase tracking-widest block bg-white/5 border border-white/10 px-3 py-1 rounded-full w-max mx-auto">
                              YOU ARE CORDIALLY INVITED TO
                            </span>
                            <h3 className="font-serif font-extrabold text-2xl sm:text-3xl text-amber-300 tracking-tight leading-none pt-4">
                              {tplTitle || "Special Milestone Day"}
                            </h3>
                          </div>

                          <div className="space-y-3 z-10 my-4 text-center max-w-sm">
                            <p className="font-sans text-[11px] sm:text-xs text-purple-200 leading-relaxed font-light">
                              Host: <strong className="text-white font-bold">{tplHost}</strong>
                            </p>
                            <p className="font-sans italic text-sm sm:text-base text-gray-100 font-medium my-3">
                              "{tplMessage || "We await your warm presence and participation."}"
                            </p>

                            <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl">
                              <div>
                                <span className="block text-[9px] text-amber-300 uppercase tracking-widest font-black">Event Date</span>
                                <span className="text-xs font-bold">{tplDate || "Saturday, TBA"}</span>
                              </div>
                              <div>
                                <span className="block text-[9px] text-amber-300 uppercase tracking-widest font-black">Food Service</span>
                                <span className="text-xs font-bold">{tplFoodTime || "TBD"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="z-10 w-full mt-2">
                            <span className="block text-[9px] text-gray-300 uppercase tracking-widest font-semibold mb-1">Venue Destination</span>
                            <span className="text-xs font-semibold block underline decoration-amber-400 decoration-2">{tplVenue || "Ballroom Lounge, Grand Central"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-3xl border border-gray-100 bg-gray-100/50 flex items-center justify-center overflow-hidden min-h-[440px]">
                          {uploadedBase64 ? (
                            <img
                              src={uploadedBase64}
                              alt="Custom Invitation"
                              referrerPolicy="no-referrer"
                              className="w-full h-full max-h-[460px] object-contain rounded-2xl shadow-sm"
                            />
                          ) : (
                            <div className="text-center py-6">
                              <Upload className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                              <span className="text-xs text-gray-500">No Image Selected. Choose your custom JPEG/PNG to see preview.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}


        {/* TAB 4: GIFT MANAGEMENT */}
        {activeTab === 'gifts' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <Gift className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  {editingGiftId ? "Edit Registry Item" : "Add Registry Gift Option"}
                </h2>
              </div>

              {!activeEvent ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl">
                  <p className="text-gray-500 text-xs text-red-500">Please establish your target event celebration before adding wishes.</p>
                </div>
              ) : (
                <form onSubmit={handleSaveGift} className="space-y-4 max-w-lg mb-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-750 mb-1">Gift Name *</label>
                      <input
                        type="text"
                        required
                        value={giftName}
                        onChange={(e) => setGiftName(e.target.value)}
                        placeholder="e.g., Sony WH-1000XM4 Headphones"
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-750 mb-1">Priority Level *</label>
                      <select
                        value={giftPriority}
                        onChange={(e) => setGiftPriority(e.target.value as any)}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="High">🔴 High Priority (Registry Essential)</option>
                        <option value="Medium">🟡 Medium Priority</option>
                        <option value="Low">🟢 Low Priority</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-750 mb-1">E-Commerce URL / Search Link</label>
                      <input
                        type="url"
                        value={giftLink}
                        onChange={(e) => setGiftLink(e.target.value)}
                        placeholder="e.g., https://amazon.com/dp/ABCDEF"
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-750 mb-1">Product Illustration Image URL (Optional)</label>
                      <input
                        type="url"
                        value={giftImg}
                        onChange={(e) => setGiftImg(e.target.value)}
                        placeholder="e.g., https://unsplash.com/photos/your-image-url"
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    {editingGiftId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGiftId(null);
                          setGiftName("");
                          setGiftLink("");
                          setGiftImg("");
                          setGiftPriority("Medium");
                        }}
                        className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs hover:bg-gray-55"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                    >
                      {editingGiftId ? "Apply Changes" : "Add Gift to Catalog"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Display list of catalog gifts */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-950 mb-4 flex items-center justify-between">
                <span>Active Registry Items Addressed (${gifts.length})</span>
                <span className="text-xs text-gray-400 font-normal">Organizers delete and modify entries freely.</span>
              </h3>

              {gifts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gifts.map((gift) => (
                    <div key={gift.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
                      <div>
                        {/* Header or Image */}
                        <div className="h-40 bg-gray-50 relative flex items-center justify-center overflow-hidden border-b border-gray-100">
                          {gift.productImage ? (
                            <img
                              src={gift.productImage}
                              alt={gift.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Gift className="h-10 w-10 text-gray-200 mx-auto mb-1" />
                              <span className="text-[10px] text-gray-400">No Image Registered</span>
                            </div>
                          )}
                          <span className={`absolute top-3 left-3 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            gift.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-150' :
                            gift.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                            'bg-green-50 text-green-700 border border-green-150'
                          }`}>
                            {gift.priority} Priority
                          </span>

                          <span className={`absolute bottom-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-md ${
                            gift.reservedByGuestId 
                              ? 'bg-amber-500 text-amber-950 border border-amber-400' 
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {gift.reservedByGuestId ? `Reserved by: ${gift.reservedByGuestName}` : "Available"}
                          </span>
                        </div>

                        <div className="p-4">
                          <h4 className="font-extrabold text-sm text-gray-900 line-clamp-2">{gift.name}</h4>
                          {gift.productLink && (
                            <a
                              href={gift.productLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-semibold text-purple-600 mt-2 block hover:underline"
                            >
                              Explore Product URL →
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-gray-50 flex items-center justify-end space-x-1.5 pt-3">
                        <button
                          onClick={() => handleEditGiftClick(gift)}
                          className="p-1 px-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg flex items-center"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteGift(gift.id)}
                          className="p-1 px-2 text-red-500 bg-red-50 hover:bg-red-150 border border-red-200 text-[10px] font-bold rounded-lg hover:text-red-650"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Gift className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs">Your registry wishlist is empty. Insert items using the form above.</p>
                </div>
              )}
            </div>
          </div>
        )}


        {/* TAB 5: ORGANIZER GUEST RESPONSES */}
        {activeTab === 'responses' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                    <Users className="h-5 w-5 text-purple-600 mr-2" />
                    <span>RSVP Guest Responses</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-normal">Index of submitted invitations and selected items.</p>
                </div>

                {/* Response control filters */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search guests..."
                      value={rsvpSearch}
                      onChange={(e) => setRsvpSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs border border-gray-205 rounded-xl bg-gray-50/50"
                    />
                  </div>
                  
                  <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                    {['All', 'accepted', 'declined'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setRsvpFilterStatus(status as any)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                          rsvpFilterStatus === status
                            ? 'bg-white text-purple-700 shadow-sm'
                            : 'text-gray-500'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredRsvps.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-105">
                  <table className="min-w-full divide-y divide-gray-100 text-left text-xs text-gray-600 font-sans">
                    <thead className="bg-gray-50 font-bold uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Guest Name</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3 text-center">RSVP</th>
                        <th className="px-4 py-3 text-center">Pax Status</th>
                        <th className="px-4 py-3 text-center">Meals Prefer.</th>
                        <th className="px-4 py-3">Selected Wish Item</th>
                        <th className="px-4 py-3 text-right">Registered On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredRsvps.map((rsvp) => {
                        // Find if this guest reserved any gift
                        const giftReserved = gifts.find(g => g.reservedByGuestId === rsvp.id);

                        return (
                          <tr key={rsvp.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3.5 font-bold text-gray-800">{rsvp.name}</td>
                            <td className="px-4 py-3.5 font-medium">
                              <span className="block text-gray-800">{rsvp.email}</span>
                              <span className="text-[10px] text-gray-400">{rsvp.phone || "No phone"}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                rsvp.attendanceStatus === 'accepted' 
                                  ? 'bg-green-105 text-green-700 bg-green-50 border border-green-150' 
                                  : 'bg-red-155 text-red-700 bg-red-50 border border-red-150'
                              }`}>
                                {rsvp.attendanceStatus === 'accepted' ? 'Attending' : 'Declined'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-gray-900">
                              {rsvp.attendanceStatus === 'accepted' ? rsvp.familyMembers : '0'}
                            </td>
                            <td className="px-4 py-3 text-center font-medium">
                              {rsvp.attendanceStatus === 'accepted' ? (
                                <div className="space-y-0.5 text-[10px]">
                                  <span className="block text-emerald-600 font-semibold">{rsvp.vegCount} Veg</span>
                                  <span className="block text-amber-700 font-semibold">{rsvp.nonVegCount} Non-Veg</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {giftReserved ? (
                                <span className="px-2 py-1 rounded-lg bg-purple-50 border border-purple-150 text-purple-750 font-bold block max-w-[150px] truncate text-[10px]">
                                  🎁 {giftReserved.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">No gift selected</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-gray-400">
                              {new Date(rsvp.submittedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs">No active guest records discovered. Refine query filter or distribute your URL.</p>
                </div>
              )}
            </div>
          </div>
        )}


        {/* TAB 6: ANALYTICS DASHBOARD */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in font-sans">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Celebration Analytics Dashboard</h2>
              </div>

              {/* Graphical Analysis of RSVP proportions and Meals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                
                {/* Visual Chart 1: Invitation Response Proportions (Custom CSS vector chart) */}
                <div className="border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">Attendance Breakdown</h3>
                    {rsvps.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span>Accepted RSVPs</span>
                          <span className="text-green-600">{rsvps.filter(r => r.attendanceStatus === 'accepted').length} guests</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-green-500 h-full" 
                            style={{ width: `${(rsvps.filter(r => r.attendanceStatus === 'accepted').length / rsvps.length) * 100}%` }}
                          />
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${(rsvps.filter(r => r.attendanceStatus === 'declined').length / rsvps.length) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold pt-2">
                          <span>Declined RSVPs</span>
                          <span className="text-red-600">{rsvps.filter(r => r.attendanceStatus === 'declined').length} guests</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400 text-xs">Awaiting RSVP registers.</div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-50 mt-4 text-[10px] text-gray-400">
                    Calculated for events relative to Guest lists.
                  </div>
                </div>

                {/* Visual Chart 2: Meal Preferences Breakdown */}
                <div className="border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">Dinner Culinary Tally</h3>
                    {rsvps.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span>Vegetarian (Veg)</span>
                          <span className="text-emerald-650">{rsvps.reduce((acc, r) => acc + (r.vegCount || 0), 0)} plates</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                          {(() => {
                            const totalVeg = rsvps.reduce((acc, r) => acc + (r.vegCount || 0), 0);
                            const totalNonVeg = rsvps.reduce((acc, r) => acc + (r.nonVegCount || 0), 0);
                            const totalPlates = totalVeg + totalNonVeg || 1;
                            return (
                              <>
                                <div className="bg-emerald-500 h-full" style={{ width: `${(totalVeg / totalPlates) * 100}%` }} />
                                <div className="bg-amber-500 h-full" style={{ width: `${(totalNonVeg / totalPlates) * 100}%` }} />
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold pt-2">
                          <span>Non-Vegetarian</span>
                          <span className="text-amber-600">{rsvps.reduce((acc, r) => acc + (r.nonVegCount || 0), 0)} plates</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400 text-xs">No catering registers yet.</div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-50 mt-4 text-[10px] text-gray-400">
                    Catering totals compiled automatically.
                  </div>
                </div>

                {/* Visual Chart 3: Gifting Allocations */}
                <div className="border border-gray-100 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">Gift Registry Lock Ratio</h3>
                    {gifts.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span>Reserved Gifts</span>
                          <span className="text-purple-600">{gifts.filter(g => g.reservedByGuestId).length} locked</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-purple-600 h-full" 
                            style={{ width: `${(gifts.filter(g => g.reservedByGuestId).length / gifts.length) * 100}%` }}
                          />
                          <div 
                            className="bg-sky-400 h-full" 
                            style={{ width: `${(gifts.filter(g => !g.reservedByGuestId).length / gifts.length) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold pt-2">
                          <span>Available Registry Items</span>
                          <span className="text-sky-500">{gifts.filter(g => !g.reservedByGuestId).length} free</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-400 text-xs">No registry items identified.</div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-50 mt-4 text-[10px] text-gray-400">
                    Locks prevent double gifting.
                  </div>
                </div>

              </div>

              {/* Large summary metrics for printing/export logs */}
              <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                <h3 className="text-sm font-bold text-purple-950 mb-3">Total Attending Family Members Tallied</h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-black text-purple-700">
                    {rsvps.filter(r => r.attendanceStatus === 'accepted').reduce((acc, r) => acc + (r.familyMembers || 1), 0)}
                  </span>
                  <span className="text-sm font-semibold text-purple-900">Family members aggregate including lead guests</span>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* TAB 7: SETTINGS MODULE */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Coordinator settings</h2>
              </div>

              {settingsSaved && (
                <div className="mb-4 text-xs font-bold text-green-700 bg-green-50 p-3 rounded-xl">
                  Profile metadata stored successfully on sandbox server!
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Registered Coordinates Email</label>
                  <input
                    type="email"
                    required
                    value={settingsEmail}
                    onChange={(e) => setSettingsEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Platform Auth Method</label>
                  <input
                    type="text"
                    disabled
                    value="Standalone JWT Authentication Engine"
                    className="w-full px-4 py-2 border border-gray-100 bg-gray-50 rounded-xl text-xs text-gray-400"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
