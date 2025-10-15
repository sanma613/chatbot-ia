"""
🔍 Script de diagnóstico para verificar el escalamiento en tiempo real
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.services.conversation_service import (
    detect_escalation_request,
    escalate_conversation,
)
from supabase import create_client
from app.core.config import SUPABASE_URL, SUPABASE_KEY


def get_supabase_client():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def test_detection():
    """Test básico de detección"""
    print("\n" + "=" * 60)
    print("🧪 TEST 1: DETECCIÓN DE ESCALAMIENTO")
    print("=" * 60)

    test_messages = [
        "hola",
        "agente",
        "necesito un agente",
        "AGENTE",
    ]

    for msg in test_messages:
        result = detect_escalation_request(msg)
        status = "✅" if result else "❌"
        print(f"{status} '{msg}' → {result}")


def check_database():
    """Verificar estado de la base de datos"""
    print("\n" + "=" * 60)
    print("🔍 TEST 2: ESTADO DE LA BASE DE DATOS")
    print("=" * 60)

    try:
        supabase = get_supabase_client()

        # Check recent escalated conversations
        result = (
            supabase.table("conversations")
            .select("id, title, is_escalated, escalated_at, created_at")
            .eq("is_escalated", True)
            .order("escalated_at", desc=True)
            .limit(5)
            .execute()
        )

        if result.data:
            print(f"\n📊 Conversaciones escaladas recientes: {len(result.data)}")
            for conv in result.data:
                print(
                    f"  - ID: {conv['id'][:8]}... | Título: {conv.get('title', 'Sin título')}"
                )
                print(f"    Escalada: {conv['escalated_at']}")
        else:
            print("\n⚠️ No hay conversaciones escaladas en la base de datos")

        # Check agent requests
        result = (
            supabase.table("agent_requests")
            .select("id, conversation_id, status, created_at")
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )

        if result.data:
            print(f"\n📊 Solicitudes de agente recientes: {len(result.data)}")
            for req in result.data:
                print(f"  - ID: {req['id'][:8]}... | Status: {req['status']}")
                print(f"    Creada: {req['created_at']}")
        else:
            print("\n⚠️ No hay solicitudes de agente en la base de datos")

    except Exception as e:
        print(f"\n❌ Error al consultar la base de datos: {e}")


def test_escalation_flow():
    """Test del flujo completo de escalamiento"""
    print("\n" + "=" * 60)
    print("🧪 TEST 3: FLUJO DE ESCALAMIENTO")
    print("=" * 60)

    try:
        supabase = get_supabase_client()

        # Create a test conversation
        print("\n1. Creando conversación de prueba...")
        conv_result = (
            supabase.table("conversations")
            .insert(
                {
                    "user_id": "00000000-0000-0000-0000-000000000000",  # Test UUID
                    "is_escalated": False,
                    "resolved": False,
                    "title": "Test Escalation",
                }
            )
            .execute()
        )

        if not conv_result.data:
            print("❌ No se pudo crear conversación de prueba")
            return

        conv_id = conv_result.data[0]["id"]
        print(f"✅ Conversación creada: {conv_id[:8]}...")

        # Test escalation
        print("\n2. Intentando escalar conversación...")
        success = escalate_conversation(conv_id)

        if success:
            print("✅ Escalamiento exitoso")

            # Verify in database
            print("\n3. Verificando en base de datos...")
            conv = (
                supabase.table("conversations")
                .select("is_escalated")
                .eq("id", conv_id)
                .single()
                .execute()
            )
            agent_req = (
                supabase.table("agent_requests")
                .select("*")
                .eq("conversation_id", conv_id)
                .execute()
            )

            if conv.data and conv.data["is_escalated"]:
                print("✅ Conversación marcada como escalada")
            else:
                print("❌ Conversación NO está marcada como escalada")

            if agent_req.data:
                print(f"✅ Agent request creado: {agent_req.data[0]['id'][:8]}...")
            else:
                print("❌ NO se creó agent request")
        else:
            print("❌ El escalamiento falló")

        # Cleanup
        print("\n4. Limpiando datos de prueba...")
        supabase.table("agent_requests").delete().eq(
            "conversation_id", conv_id
        ).execute()
        supabase.table("conversations").delete().eq("id", conv_id).execute()
        print("✅ Limpieza completada")

    except Exception as e:
        print(f"\n❌ Error en el test de escalamiento: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    print("\n🚀 DIAGNÓSTICO COMPLETO DEL SISTEMA DE ESCALAMIENTO")
    print("=" * 60)

    test_detection()
    check_database()
    test_escalation_flow()

    print("\n" + "=" * 60)
    print("✅ DIAGNÓSTICO COMPLETADO")
    print("=" * 60)
    print("\n💡 PRÓXIMOS PASOS:")
    print("1. Si la detección funciona pero no ves logs en el servidor:")
    print("   → El backend NO está procesando tus mensajes del chat")
    print("   → Verifica que el frontend esté llamando a /chatbot/ask")
    print("\n2. Si el escalamiento falla en el TEST 3:")
    print("   → Hay un problema con la base de datos o permisos")
    print("\n3. Si todo funciona aquí pero no en producción:")
    print("   → El problema está en el frontend o en la conexión")
    print("\n")
