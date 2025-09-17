import { Organizer, Event, Raffle, Participant, Company, Collaborator, Prize } from '../types';

export const mockOrganizers: Organizer[] = [
    {
        id: 'org-1',
        name: 'Tech Conference Inc.',
        responsibleName: 'Alice Johnson',
        email: 'alice@techconf.com',
        phone: '(11) 99999-1111',
        photoUrl: 'https://i.pravatar.cc/150?u=alice',
        organizerCode: 'TCI'
    },
    {
        id: 'org-2',
        name: 'Gamer Expo Brasil',
        responsibleName: 'Bob Williams',
        email: 'bob@gamerexpo.com.br',
        phone: '(21) 98888-2222',
        photoUrl: 'https://i.pravatar.cc/150?u=bob',
        organizerCode: 'GEB'
    }
];

export const mockEvents: Event[] = [
    {
        id: 'event-1',
        name: 'Tech Conference 2024',
        date: '2024-10-26',
        details: 'A conferência anual sobre as últimas tendências em tecnologia.',
        bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2069&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        organizerId: 'org-1',
    },
    {
        id: 'event-2',
        name: 'Gamer Expo SP',
        date: '2024-11-15',
        details: 'O maior evento de games da América Latina.',
        bannerUrl: 'https://images.unsplash.com/photo-1542751371-352e401c3366?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        organizerId: 'org-2',
    }
];

export const mockRaffles: Raffle[] = [
    {
        id: 'raffle-1',
        name: 'Monitor Gamer Ultrawide',
        quantity: 1,
        code: 'TCIMONITOR',
        eventId: 'event-1'
    },
    {
        id: 'raffle-2',
        name: 'Cadeira Gamer Pro',
        quantity: 2,
        code: 'TCICADEIRA',
        eventId: 'event-1'
    },
    {
        id: 'raffle-3',
        name: 'Console de Última Geração',
        quantity: 1,
        code: 'GEBCONSOLE',
        eventId: 'event-2'
    }
];

export const mockParticipants: Participant[] = [
    { id: 'p-1', name: 'Carlos Silva', phone: '(11) 91234-5678', email: 'carlos@email.com', raffleId: 'raffle-1', isWinner: false },
    { id: 'p-2', name: 'Bruna Souza', phone: '(11) 98765-4321', email: 'bruna@email.com', raffleId: 'raffle-1', isWinner: false },
    { id: 'p-3', name: 'Felipe Costa', phone: '(21) 95555-1234', email: 'felipe@email.com', raffleId: 'raffle-3', isWinner: false },
    { id: 'p-4', name: 'Juliana Almeida', phone: '(21) 94444-4321', email: 'juliana@email.com', raffleId: 'raffle-3', isWinner: true, drawnAt: new Date().toISOString() },
];

export const mockCompanies: Company[] = [
    {
        id: 'comp-1',
        name: 'Cloud Solutions',
        responsibleName: 'Diana Prince',
        phone: '(11) 93333-1111',
        email: 'diana@cloudsolutions.com',
        logoUrl: 'https://i.pravatar.cc/100?u=diana',
        eventId: 'event-1',
        code: 'CSOL',
        hasSorteio: true,
        hasRoleta: true,
        roletaColors: ['#0052FF', '#E0E0E0'],
    },
    {
        id: 'comp-2',
        name: 'Gaming Hardware Corp',
        responsibleName: 'Clark Kent',
        phone: '(21) 92222-1111',
        email: 'clark@ghc.com',
        logoUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80',
        eventId: 'event-2',
        code: 'GHC',
        hasSorteio: true,
        hasRoleta: true,
        roletaColors: ['#6200EE', '#FFFFFF'],
    }
];

export const mockCollaborators: Collaborator[] = [
    { id: 'collab-1', name: 'Peter Parker', phone: '(11) 91111-2222', email: 'peter@cloudsolutions.com', companyId: 'comp-1', code: 'PP01', photoUrl: 'https://i.pravatar.cc/150?u=peter' },
    { id: 'collab-2', name: 'Mary Jane Watson', phone: '(11) 91111-3333', email: 'mj@cloudsolutions.com', companyId: 'comp-1', code: 'MJ02', photoUrl: 'https://i.pravatar.cc/150?u=mj' },
    { id: 'collab-3', name: 'Bruce Wayne', phone: '(21) 94444-5555', email: 'bruce@ghc.com', companyId: 'comp-2', code: 'BW01', photoUrl: 'https://i.pravatar.cc/150?u=bruce' }
];

export const mockPrizes: Prize[] = [
    { id: 'prize-1', name: 'Headset Gamer Sem Fio', companyId: 'comp-2' },
    { id: 'prize-2', name: 'Mousepad XL', companyId: 'comp-2' },
    { id: 'prize-3', name: 'Teclado Mecânico', companyId: 'comp-2' },
    { id: 'prize-4', name: 'Vale-Presente R$100', companyId: 'comp-2' },
    { id: 'prize-5', name: 'Cadeira Gamer', companyId: 'comp-2' },
];