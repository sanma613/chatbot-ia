import { AlertTriangle } from 'lucide-react';
import { currentAdmin } from '@/lib/mockEscalationData';

interface EscalationHeaderProps {
    isDevMode?: boolean;
}

export default function EscalationHeader({ isDevMode = false }: EscalationHeaderProps) {
    return (
        <div className="mb-8">
            {/* Alerta de modo desarrollo */}
            {isDevMode && (
                <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-orange-800">
                                🚀 Modo Desarrollo - Vista de Escalación
                            </p>
                            <p className="text-sm text-orange-700">
                                Esta es una versión de desarrollo sin verificación de permisos de admin
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Título principal */}
            <div className="flex items-center gap-3 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">
                        Panel de Escalación
                    </h1>
                    <p className="text-dark">
                        Gestiona las consultas escaladas por los estudiantes
                    </p>
                </div>
            </div>

            {/* Info del admin */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                    <div>
                        <p className="text-sm text-blue-700">
                            Conectado como: <span className="font-semibold">{currentAdmin.name}</span> ({currentAdmin.department})
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}