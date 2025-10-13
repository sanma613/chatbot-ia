"""
Script para probar manualmente el envío de recordatorios
Ejecutar desde backend/: python tests/test_reminder_now.py
O desde tests/: python test_reminder_now.py
"""

import sys
import os
from datetime import datetime, timedelta

# Agregar el directorio backend al path para importar app
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.services.scheduler_service import get_scheduler


def main():
    print("=" * 60)
    print("🧪 PRUEBA MANUAL DE RECORDATORIOS")
    print("=" * 60)
    print()

    # Calcular fecha de mañana
    tomorrow = datetime.now() + timedelta(days=1)
    tomorrow_str = tomorrow.strftime("%Y-%m-%d")
    today_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print(f"📅 Fecha/Hora actual: {today_str}")
    print(f"📅 Buscando actividades para: {tomorrow_str}")
    print()
    print("⚠️  IMPORTANTE:")
    print(f"   Debes tener actividades creadas para {tomorrow_str}")
    print("   Las actividades deben estar marcadas como NO completadas")
    print()

    # Obtener scheduler
    scheduler = get_scheduler()

    print("🚀 Ejecutando verificación de recordatorios...")
    print("-" * 60)

    try:
        # Ejecutar la verificación
        scheduler.check_and_send_reminders()

        print("-" * 60)
        print()
        print("✅ Verificación completada!")
        print()
        print("📋 Revisa los logs arriba para ver:")
        print("   • Cuántas actividades se encontraron")
        print("   • Si se enviaron correos")
        print("   • Cualquier error")
        print()
        print("📬 Si se enviaron correos, revisa tu bandeja de entrada")
        print("   (pueden tardar unos segundos en llegar)")

    except Exception as e:
        print()
        print(f"❌ Error: {str(e)}")
        print()
        print("Posibles causas:")
        print("  1. No hay conexión a Supabase")
        print("  2. Credenciales SMTP incorrectas")
        print("  3. No hay actividades para mañana")


if __name__ == "__main__":
    main()
