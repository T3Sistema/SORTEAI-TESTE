import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Organizer, Event, Raffle, Participant, Company, Collaborator, Prize } from '../types';
import { mockOrganizers, mockEvents, mockRaffles, mockParticipants, mockCompanies, mockCollaborators, mockPrizes } from './mockData';

// Helper to get data from localStorage or fallback to mock data
const useStickyState = <T,>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};


interface DataContextType {
  // Data
  organizers: Organizer[];
  events: Event[];
  companies: Company[];
  participants: Participant[];
  winners: Participant[];
  eventCompanies: Company[];

  // State
  loggedInOrganizer: Organizer | null;
  loggedInCollaborator: Collaborator | null;
  loggedInCollaboratorCompany: Company | null;
  selectedEvent: Event | null;
  selectedRaffle: Raffle | null;
  organizerEvents: Event[];
  selectedEventRaffles: Raffle[];
  isSuperAdmin: boolean;

  // Setters
  setSelectedEventId: (id: string | null) => void;
  setSelectedRaffleId: (id: string | null) => void;
  
  // Auth
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  loginSuperAdmin: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logoutSuperAdmin: () => void;
  viewAsOrganizer: (organizerId: string, eventId: string) => void;
  stopImpersonating: () => void;
  logoutCollaborator: () => void;
  
  // Data mutations
  addParticipant: (participant: Omit<Participant, 'id' | 'isWinner'>) => Promise<{ success: boolean; message: string }>;
  drawWinner: () => Promise<Participant | null>;
  getEligibleParticipantCount: () => number;
  findRaffleByCode: (code: string) => Promise<(Raffle & { event: Event }) | null>;
  createEventWithRaffle: (data: { eventName: string; raffleName: string; raffleQuantity: number; raffleCode: string; }) => Promise<{ success: boolean; message: string }>;
  
  // Admin mutations
  saveOrganizer: (organizerData: Omit<Organizer, 'id'>, id?: string) => Promise<{ success: boolean; message: string }>;
  deleteOrganizer: (id: string) => Promise<{ success: boolean; message: string }>;
  saveEvent: (eventData: any, id?: string) => Promise<{ success: boolean; message: string }>;
  deleteEvent: (id: string) => Promise<{ success: boolean; message: string }>;

  // Company/Collaborator mutations
  saveCompany: (companyData: Omit<Company, 'id' | 'eventId'>, id?: string) => void;
  updateCompanySettings: (companyId: string, settings: Partial<Pick<Company, 'roletaColors'>>) => void;
  deleteCompany: (id: string) => void;
  companyCollaborators: (companyId: string) => Collaborator[];
  addCollaborator: (companyId: string, collaboratorData: Omit<Collaborator, 'id' | 'companyId'>) => void;
  updateCollaborator: (id: string, collaboratorData: Omit<Collaborator, 'id' | 'companyId'>) => void;
  deleteCollaborator: (id: string) => void;
  validateCollaborator: (companyCode: string, personalCode: string) => Promise<{ success: boolean; message: string; collaborator?: Collaborator }>;
  
  // Prize mutations
  companyPrizes: (companyId: string) => Prize[];
  savePrize: (companyId: string, prizeData: Omit<Prize, 'id' | 'companyId'>, id?: string) => void;
  deletePrize: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [organizers, setOrganizers] = useStickyState<Organizer[]>(mockOrganizers, 'sorteio-organizers');
  const [events, setEvents] = useStickyState<Event[]>(mockEvents, 'sorteio-events');
  const [raffles, setRaffles] = useStickyState<Raffle[]>(mockRaffles, 'sorteio-raffles');
  const [participants, setParticipants] = useStickyState<Participant[]>(mockParticipants, 'sorteio-participants');
  const [companies, setCompanies] = useStickyState<Company[]>(mockCompanies, 'sorteio-companies');
  const [collaborators, setCollaborators] = useStickyState<Collaborator[]>(mockCollaborators, 'sorteio-collaborators');
  const [prizes, setPrizes] = useStickyState<Prize[]>(mockPrizes, 'sorteio-prizes');

  const [loggedInOrganizer, setLoggedInOrganizer] = useStickyState<Organizer | null>(null, 'sorteio-organizer');
  const [loggedInCollaborator, setLoggedInCollaborator] = useStickyState<Collaborator | null>(null, 'sorteio-collaborator');
  const [selectedEventId, setSelectedEventId] = useStickyState<string | null>(null, 'sorteio-selectedEventId');
  const [selectedRaffleId, setSelectedRaffleId] = useStickyState<string | null>(null, 'sorteio-selectedRaffleId');
  const [isSuperAdmin, setIsSuperAdmin] = useStickyState<boolean>(false, 'sorteio-isSuperAdmin');
  
  const [impersonatingFromAdmin, setImpersonatingFromAdmin] = useStickyState<boolean>(false, 'sorteio-impersonating');


  // --- Computed State ---
  const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId) ?? null, [events, selectedEventId]);
  
  const loggedInCollaboratorCompany = useMemo(() => {
    if (!loggedInCollaborator) return null;
    return companies.find(c => c.id === loggedInCollaborator.companyId) ?? null;
  }, [loggedInCollaborator, companies]);

  const organizerEvents = useMemo(() => {
    if (!loggedInOrganizer) return [];
    return events.filter(event => event.organizerId === loggedInOrganizer.id)
                 .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, loggedInOrganizer]);

  const selectedEventRaffles = useMemo(() => {
    if (!selectedEvent) return [];
    return raffles.filter(r => r.eventId === selectedEvent.id);
  }, [raffles, selectedEvent]);
  
  const selectedRaffle = useMemo(() => raffles.find(r => r.id === selectedRaffleId) ?? null, [raffles, selectedRaffleId]);

  const eventParticipants = useMemo(() => {
    const eventRaffleIds = selectedEventRaffles.map(r => r.id);
    return participants.filter(p => eventRaffleIds.includes(p.raffleId));
  }, [participants, selectedEventRaffles]);

  const winners = useMemo(() => eventParticipants.filter(p => p.isWinner), [eventParticipants]);

  const eventCompanies = useMemo(() => {
    if (!selectedEvent) return [];
    return companies.filter(c => c.eventId === selectedEvent.id);
  }, [companies, selectedEvent]);

  // --- Effects ---
  useEffect(() => {
    if (loggedInOrganizer && organizerEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(organizerEvents[0].id);
    }
    if (loggedInOrganizer && organizerEvents.length === 0) {
      setSelectedEventId(null);
    }
  }, [loggedInOrganizer, organizerEvents, selectedEventId, setSelectedEventId]);
  
  useEffect(() => {
      if(selectedEvent && selectedEventRaffles.length > 0 && !selectedRaffleId){
          // don't auto select
      }
       if (selectedEvent && selectedEventRaffles.length === 0) {
        setSelectedRaffleId(null);
    }
  }, [selectedEvent, selectedEventRaffles, selectedRaffleId, setSelectedRaffleId]);


  // --- Callbacks / Functions ---
  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    // In a real app, this would be an API call.
    // Here, we'll just check against our mock organizers and a static password '123'.
    const organizer = organizers.find(o => o.email.toLowerCase() === email.toLowerCase());
    if (organizer && pass === '123') {
      setLoggedInOrganizer(organizer);
      const orgEvents = events.filter(e => e.organizerId === organizer.id);
      if(orgEvents.length > 0) {
          setSelectedEventId(orgEvents[0].id);
      } else {
          setSelectedEventId(null);
      }
      return { success: true, message: 'Login bem-sucedido!' };
    }
    return { success: false, message: 'E-mail ou senha inválidos.' };
  }, [organizers, events, setSelectedEventId]);

  const logout = useCallback(() => {
    setLoggedInOrganizer(null);
    setSelectedEventId(null);
    setSelectedRaffleId(null);
  }, [setSelectedEventId, setSelectedRaffleId]);
  
  const loginSuperAdmin = useCallback(async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    if (email === 'triad3@triad3.io' && pass === '123') {
      setIsSuperAdmin(true);
      return { success: true, message: 'Login de admin bem-sucedido!' };
    }
    return { success: false, message: 'Credenciais de admin inválidas.' };
  }, [setIsSuperAdmin]);

  const logoutSuperAdmin = useCallback(() => {
      setIsSuperAdmin(false);
  }, [setIsSuperAdmin]);

  const logoutCollaborator = useCallback(() => {
    setLoggedInCollaborator(null);
    setSelectedRaffleId(null);
  }, [setSelectedRaffleId]);

  const viewAsOrganizer = useCallback((organizerId: string, eventId: string) => {
    const organizer = organizers.find(o => o.id === organizerId);
    if(organizer) {
        setImpersonatingFromAdmin(true);
        setLoggedInOrganizer(organizer);
        setSelectedEventId(eventId);
    }
  }, [organizers, setSelectedEventId]);

  const stopImpersonating = useCallback(() => {
    setImpersonatingFromAdmin(false);
    logout();
  }, [logout]);


  const addParticipant = useCallback(async (participantData: Omit<Participant, 'id' | 'isWinner'>): Promise<{ success: boolean; message: string }> => {
    const raffle = raffles.find(r => r.id === participantData.raffleId);
    if (!raffle) return { success: false, message: 'Sorteio não encontrado.' };

    const existingParticipant = participants.find(p => p.email.toLowerCase() === participantData.email.toLowerCase() && p.raffleId === participantData.raffleId);
    if(existingParticipant) {
        return { success: false, message: 'Este e-mail já está cadastrado neste sorteio.' };
    }

    const winnersForRaffle = participants.filter(p => p.raffleId === participantData.raffleId && p.isWinner);
    if(winnersForRaffle.length >= raffle.quantity) {
        return { success: false, message: `O sorteio para "${raffle.name}" já atingiu o limite de ganhadores.` };
    }

    const newParticipant: Participant = {
      ...participantData,
      id: `p-${Date.now()}`,
      isWinner: false,
    };
    setParticipants(prev => [...prev, newParticipant]);
    return { success: true, message: 'Cadastro realizado com sucesso!' };
  }, [participants, raffles]);

  const getEligibleParticipantCount = useCallback(() => {
    if (!selectedRaffle) return 0;
    return participants.filter(p => p.raffleId === selectedRaffle.id && !p.isWinner).length;
  }, [participants, selectedRaffle]);

  const drawWinner = useCallback(async (): Promise<Participant | null> => {
    if (!selectedRaffle) return null;
    const eligible = participants.filter(p => p.raffleId === selectedRaffle.id && !p.isWinner);
    
    if (eligible.length === 0) return null;
    
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    
    setParticipants(prev => prev.map(p => 
      p.id === winner.id ? { ...p, isWinner: true, drawnAt: new Date().toISOString() } : p
    ));

    return { ...winner, isWinner: true };
  }, [participants, selectedRaffle]);

  const findRaffleByCode = useCallback(async (code: string) => {
    const raffle = raffles.find(r => r.code.toUpperCase() === code.toUpperCase());
    if(!raffle) return null;
    const event = events.find(e => e.id === raffle.eventId);
    if(!event) return null;
    return { ...raffle, event };
  }, [raffles, events]);
  
  const createEventWithRaffle = useCallback(async (data: { eventName: string; raffleName: string; raffleQuantity: number; raffleCode: string; }) => {
    let eventToUse = selectedEvent;

    // Create event if not selected
    if (!eventToUse) {
        if (!loggedInOrganizer) return { success: false, message: 'Organizador não está logado.' };
        const newEvent: Event = {
            id: `event-${Date.now()}`,
            name: data.eventName,
            date: new Date().toISOString(),
            details: '',
            organizerId: loggedInOrganizer.id,
        };
        setEvents(prev => [...prev, newEvent]);
        eventToUse = newEvent;
        setSelectedEventId(newEvent.id);
    }
    
    const fullRaffleCode = `${loggedInOrganizer?.organizerCode || ''}${data.raffleCode}`;

    const existingRaffleCode = raffles.some(r => r.code.toUpperCase() === fullRaffleCode.toUpperCase());
    if(existingRaffleCode){
        return { success: false, message: 'Este código de sorteio já está em uso.' };
    }

    const newRaffle: Raffle = {
        id: `raffle-${Date.now()}`,
        name: data.raffleName,
        quantity: data.raffleQuantity,
        code: fullRaffleCode,
        eventId: eventToUse.id,
    };
    setRaffles(prev => [...prev, newRaffle]);

    return { success: true, message: `Sorteio "${data.raffleName}" adicionado ao evento "${eventToUse.name}"!` };
  }, [selectedEvent, loggedInOrganizer, raffles, setEvents, setRaffles, setSelectedEventId]);

  // Admin functions
  const saveOrganizer = async (organizerData: Omit<Organizer, 'id'>, id?: string): Promise<{ success: boolean; message: string }> => {
      if (id) {
          setOrganizers(prev => prev.map(o => o.id === id ? { ...o, ...organizerData, id } : o));
          return { success: true, message: 'Organizador atualizado com sucesso!' };
      } else {
          const newOrganizer = { ...organizerData, id: `org-${Date.now()}` };
          setOrganizers(prev => [...prev, newOrganizer]);
          return { success: true, message: 'Organizador criado com sucesso!' };
      }
  };

  const deleteOrganizer = async (id: string): Promise<{ success: boolean; message: string }> => {
      setOrganizers(prev => prev.filter(o => o.id !== id));
      // Also delete associated events, raffles, etc.
      const eventsToDelete = events.filter(e => e.organizerId === id).map(e => e.id);
      setEvents(prev => prev.filter(e => e.organizerId !== id));
      setRaffles(prev => prev.filter(r => !eventsToDelete.includes(r.eventId)));
      // You'd continue this cascade for participants, etc. in a real backend.
      return { success: true, message: 'Organizador e seus eventos foram excluídos.' };
  };

  const saveEvent = async (formData: any, id?: string): Promise<{ success: boolean; message: string }> => {
      if(id) { // Editing
          const event: Event = {
              id,
              name: formData.eventName,
              date: formData.eventDate,
              details: formData.eventDetails,
              bannerUrl: formData.eventBannerUrl,
              organizerId: formData.existingOrganizerId
          };
          setEvents(prev => prev.map(e => e.id === id ? event : e));
          return { success: true, message: "Evento atualizado com sucesso!" };
      } else { // Creating
          let organizerId = formData.existingOrganizerId;
          if (formData.organizerType === 'new') {
              const newOrg: Organizer = {
                  id: `org-${Date.now()}`,
                  name: formData.newOrganizerName,
                  responsibleName: formData.newOrganizerResponsible,
                  email: formData.newOrganizerEmail,
                  phone: formData.newOrganizerPhone,
                  photoUrl: formData.newOrganizerPhotoUrl,
                  organizerCode: ``, // You might want a form field for this
              };
              setOrganizers(prev => [...prev, newOrg]);
              organizerId = newOrg.id;
          }
          const newEvent: Event = {
              id: `event-${Date.now()}`,
              name: formData.eventName,
              date: formData.eventDate,
              details: formData.eventDetails,
              bannerUrl: formData.eventBannerUrl,
              organizerId
          };
          setEvents(prev => [...prev, newEvent]);
          return { success: true, message: "Evento criado com sucesso!" };
      }
  };

  const deleteEvent = async (id: string): Promise<{ success: boolean; message: string }> => {
      setEvents(prev => prev.filter(e => e.id !== id));
      setRaffles(prev => prev.filter(r => r.eventId !== id));
      return { success: true, message: 'Evento excluído.' };
  };

  // Expositor functions
  const saveCompany = (companyData: Omit<Company, 'id' | 'eventId'>, id?: string) => {
    if(!selectedEvent) return;
    if(id) {
        setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...companyData, eventId: selectedEvent.id } : c));
    } else {
        const newCompany: Company = { ...companyData, id: `comp-${Date.now()}`, eventId: selectedEvent.id };
        setCompanies(prev => [...prev, newCompany]);
    }
  };

  const updateCompanySettings = (companyId: string, settings: Partial<Pick<Company, 'roletaColors'>>) => {
      setCompanies(prev => prev.map(c => 
          c.id === companyId ? { ...c, ...settings } : c
      ));
  };
  
  const deleteCompany = (id: string) => {
      setCompanies(prev => prev.filter(c => c.id !== id));
      setCollaborators(prev => prev.filter(c => c.companyId !== id)); // Cascade delete
  };
  
  const companyCollaborators = (companyId: string) => collaborators.filter(c => c.companyId === companyId);
  
  const addCollaborator = (companyId: string, collaboratorData: Omit<Collaborator, 'id' | 'companyId'>) => {
    const newCollaborator: Collaborator = { ...collaboratorData, id: `collab-${Date.now()}`, companyId };
    setCollaborators(prev => [...prev, newCollaborator]);
  };

  const updateCollaborator = (id: string, collaboratorData: Omit<Collaborator, 'id' | 'companyId'>) => {
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, ...collaboratorData } : c));
  };

  const deleteCollaborator = (id: string) => {
      setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  const validateCollaborator = useCallback(async (companyCode: string, personalCode: string): Promise<{ success: boolean; message: string; collaborator?: Collaborator }> => {
    const company = companies.find(c => c.code.toUpperCase() === companyCode.toUpperCase());
    if (!company) {
        return { success: false, message: 'Código da Empresa / Estande inválido.' };
    }

    const collaborator = collaborators.find(c => c.companyId === company.id && c.code.toUpperCase() === personalCode.toUpperCase());

    if (collaborator) {
        setLoggedInCollaborator(collaborator);
        // Find the event for the company and set it as selected
        const companyEvent = events.find(e => e.id === company.eventId);
        if (companyEvent) {
          setSelectedEventId(companyEvent.id);
        }
        return { success: true, message: `Check-in realizado com sucesso, ${collaborator.name}!`, collaborator };
    }

    return { success: false, message: 'Seu Código Pessoal é inválido para esta empresa.' };
  }, [companies, collaborators, events, setLoggedInCollaborator, setSelectedEventId]);
  
  // Prize Functions
  const companyPrizes = (companyId: string) => prizes.filter(p => p.companyId === companyId);

  const savePrize = (companyId: string, prizeData: Omit<Prize, 'id' | 'companyId'>, id?: string) => {
    if (id) {
        setPrizes(prev => prev.map(p => p.id === id ? { ...p, ...prizeData } : p));
    } else {
        const newPrize: Prize = { ...prizeData, id: `prize-${Date.now()}`, companyId };
        setPrizes(prev => [...prev, newPrize]);
    }
  };
  
  const deletePrize = (id: string) => {
      setPrizes(prev => prev.filter(p => p.id !== id));
  };

  const value: DataContextType = {
    organizers,
    events,
    companies,
    participants: eventParticipants,
    winners,
    eventCompanies,
    loggedInOrganizer: impersonatingFromAdmin ? loggedInOrganizer : (isSuperAdmin ? null : loggedInOrganizer),
    loggedInCollaborator,
    loggedInCollaboratorCompany,
    selectedEvent,
    selectedRaffle,
    organizerEvents,
    selectedEventRaffles,
    isSuperAdmin,
    setSelectedEventId,
    setSelectedRaffleId,
    login,
    logout,
    loginSuperAdmin,
    logoutSuperAdmin,
    logoutCollaborator,
    viewAsOrganizer,
    stopImpersonating,
    addParticipant,
    drawWinner,
    getEligibleParticipantCount,
    findRaffleByCode,
    createEventWithRaffle,
    saveOrganizer,
    deleteOrganizer,
    saveEvent,
    deleteEvent,
    saveCompany,
    updateCompanySettings,
    deleteCompany,
    companyCollaborators,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    validateCollaborator,
    companyPrizes,
    savePrize,
    deletePrize
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};