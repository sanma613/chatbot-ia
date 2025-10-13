import { EscalatedTicket, AdminUser } from '@/types/escalation';

// Datos mock para administradores
export const mockAdmins: AdminUser[] = [
    {
        id: 'admin-1',
        name: 'Ana García',
        email: 'ana.garcia@universidad.edu',
        role: 'admin',
        department: 'Soporte Académico'
    },
    {
        id: 'admin-2',
        name: 'Carlos López',
        email: 'carlos.lopez@universidad.edu',
        role: 'super_admin',
        department: 'TI'
    },
    {
        id: 'admin-3',
        name: 'María Rodríguez',
        email: 'maria.rodriguez@universidad.edu',
        role: 'admin',
        department: 'Administración'
    }
];

// Datos mock para tickets escalados
export const mockEscalatedTickets: EscalatedTicket[] = [
    {
        id: 'ESC-001',
        studentId: 'student-123',
        studentName: 'Juan Pérez',
        studentEmail: 'juan.perez@estudiante.edu',
        originalQuestion: '¿Cómo puedo recuperar mi contraseña del sistema académico? He intentado con el botón de "Olvidé mi contraseña" pero no me llega el correo de recuperación.',
        chatbotResponse: 'Para recuperar tu contraseña, ve a la página de login y haz clic en "Olvidé mi contraseña". Si no recibes el correo, verifica tu carpeta de spam.',
        category: 'technical',
        status: 'pending',
        priority: 'high',
        escalatedAt: '2025-10-12T09:30:00Z',
        estimatedResolutionTime: '24h'
    },
    {
        id: 'ESC-002',
        studentId: 'student-456',
        studentName: 'María González',
        studentEmail: 'maria.gonzalez@estudiante.edu',
        originalQuestion: '¿Cuál es el proceso para solicitar una beca de excelencia académica? No encuentro información clara en el sitio web.',
        chatbotResponse: 'Las becas de excelencia se solicitan a través del portal estudiantil. Debes cumplir con un promedio mínimo de 8.5.',
        category: 'academic',
        status: 'in_progress',
        priority: 'medium',
        escalatedAt: '2025-10-11T14:15:00Z',
        assignedToAdmin: 'admin-1',
        adminNotes: 'Revisando los requisitos actualizados de becas',
        estimatedResolutionTime: '48h'
    },
    {
        id: 'ESC-003',
        studentId: 'student-789',
        studentName: 'Carlos Ruiz',
        studentEmail: 'carlos.ruiz@estudiante.edu',
        originalQuestion: 'Mi matrícula aparece como "pendiente de pago" pero ya realicé el pago hace una semana. ¿Cómo puedo resolver esto?',
        chatbotResponse: 'Los pagos pueden tardar 3-5 días hábiles en procesarse. Si ha pasado más tiempo, contacta con administración.',
        category: 'administrative',
        status: 'resolved',
        priority: 'high',
        escalatedAt: '2025-10-10T11:45:00Z',
        assignedToAdmin: 'admin-3',
        adminNotes: 'Verificado el pago en el sistema bancario',
        resolution: 'Se verificó el pago en el sistema. El problema era un error en la sincronización con el banco. Se actualizó manualmente el estado de la matrícula y se configuró una alerta para evitar este problema en el futuro.',
        resolvedAt: '2025-10-11T16:30:00Z'
    },
    {
        id: 'ESC-004',
        studentId: 'student-101',
        studentName: 'Ana Martínez',
        studentEmail: 'ana.martinez@estudiante.edu',
        originalQuestion: '¿Cuándo estarán disponibles las notas del parcial de Matemáticas II? Ya pasaron dos semanas desde el examen.',
        chatbotResponse: 'Las notas generalmente se publican 10-15 días después del examen. Puedes consultarlas en el portal estudiantil.',
        category: 'academic',
        status: 'pending',
        priority: 'low',
        escalatedAt: '2025-10-12T08:20:00Z',
        estimatedResolutionTime: '12h'
    },
    {
        id: 'ESC-005',
        studentId: 'student-202',
        studentName: 'Luis Torres',
        studentEmail: 'luis.torres@estudiante.edu',
        originalQuestion: 'El sistema me está dando error 500 cuando trato de inscribir materias para el próximo semestre. Es urgente porque el periodo de inscripción termina mañana.',
        chatbotResponse: 'Si experimentas errores técnicos, intenta limpiar el cache del navegador o usar un navegador diferente.',
        category: 'technical',
        status: 'pending',
        priority: 'urgent',
        escalatedAt: '2025-10-12T16:45:00Z',
        estimatedResolutionTime: '4h'
    },
    {
        id: 'ESC-006',
        studentId: 'student-303',
        studentName: 'Sofia Herrera',
        studentEmail: 'sofia.herrera@estudiante.edu',
        originalQuestion: '¿Cómo puedo cambiar mi carrera? Estoy en Ingeniería Civil pero quiero cambiarme a Arquitectura.',
        chatbotResponse: 'Los cambios de carrera se tramitan en la oficina de admisiones. Debes cumplir con ciertos requisitos académicos.',
        category: 'administrative',
        status: 'in_progress',
        priority: 'medium',
        escalatedAt: '2025-10-11T10:30:00Z',
        assignedToAdmin: 'admin-3',
        adminNotes: 'Consultando con el departamento de admisiones sobre requisitos específicos'
    },
    {
        id: 'ESC-007',
        studentId: 'student-404',
        studentName: 'Diego Morales',
        studentEmail: 'diego.morales@estudiante.edu',
        originalQuestion: '¿Dónde puedo encontrar los horarios de tutorías de Química Orgánica?',
        chatbotResponse: 'Los horarios de tutorías están disponibles en el portal estudiantil, sección "Apoyo Académico".',
        category: 'academic',
        status: 'closed',
        priority: 'low',
        escalatedAt: '2025-10-09T13:15:00Z',
        assignedToAdmin: 'admin-1',
        resolution: 'Se proporcionó la información actualizada de horarios de tutorías y se mejoró la visibilidad de esta información en el portal.',
        resolvedAt: '2025-10-09T15:20:00Z'
    }
];

// Admin actual (simulado)
export const currentAdmin: AdminUser = mockAdmins[0];