export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  createdAt: string;
}

export type EventType = 'Birthday' | 'Wedding' | 'Baby Shower' | 'Anniversary' | 'Housewarming' | 'Graduation' | 'Other';

export interface EventTemplateData {
  hostName: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  foodTime: string;
  specialMessage: string;
}

export interface Event {
  id: string;
  organizerId: string;
  name: string;
  type: EventType;
  date: string;
  venue: string;
  foodServingTime: string;
  invitationOption: 'upload' | 'template';
  invitationImageUrl?: string; // either uploaded or generated template visual representation
  templateData?: EventTemplateData;
  createdAt: string;
}

export type GiftPriority = 'High' | 'Medium' | 'Low';

export interface Gift {
  id: string;
  eventId: string;
  name: string;
  productLink: string;
  productImage?: string;
  priority: GiftPriority;
  reservedByGuestId?: string | null;
  reservedByGuestName?: string | null;
  createdAt: string;
}

export interface GuestRSVP {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  familyMembers: number;
  vegCount: number;
  nonVegCount: number;
  selectedGiftId?: string | null;
  attendanceStatus: 'accepted' | 'declined';
  submittedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: 'Planning' | 'Gifting' | 'Ideas' | 'Wedding' | 'Birthday' | 'Tips';
  imageUrl: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}
