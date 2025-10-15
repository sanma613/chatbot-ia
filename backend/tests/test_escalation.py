"""
Script de prueba para verificar la detección de escalamiento
"""

def detect_escalation_request(message: str) -> bool:
    """
    Detect if the user is requesting to speak with a human agent.
    Supports multiple languages and variations.
    """
    escalation_phrases = [
        # Spanish
        "hablar con un humano",
        "hablar con una persona",
        "quiero hablar con alguien",
        "conectarme con un agente",
        "necesito ayuda humana",
        "transferirme a soporte",
        "hablar con un operador",
        "atención al cliente",
        "representante humano",
        # English
        "speak to a human",
        "talk to a person",
        "connect me with an agent",
        "human help",
        "transfer to support",
        "speak to an operator",
        "customer service",
        "human representative",
        # Common words
        "agente",
        "operador",
        "persona real",
        "real person",
    ]

    message_lower = message.lower()
    is_escalation = any(phrase in message_lower for phrase in escalation_phrases)
    
    return is_escalation


# Pruebas
test_messages = [
    "Hola, ¿cómo estás?",
    "necesito hablar con un agente",
    "quiero un agente",
    "agente",
    "AGENTE",
    "Agente por favor",
    "necesito ayuda",
    "operador",
    "hablar con un humano",
]

print("🧪 PRUEBAS DE DETECCIÓN DE ESCALAMIENTO\n")
print("=" * 60)

for msg in test_messages:
    result = detect_escalation_request(msg)
    emoji = "✅" if result else "❌"
    print(f"{emoji} '{msg}' → {result}")

print("=" * 60)
