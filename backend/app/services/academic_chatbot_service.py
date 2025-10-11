from typing import Any, Dict, List, Optional
from openai import OpenAI
from app.core.config import supabase_, Config
import unicodedata
import re

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=Config.OPENROUTER_API_KEY,
)


def clean_text(text: str) -> str:
    """Normaliza acentos y elimina caracteres no imprimibles"""
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"[^\x00-\x7F¡-ÿ\u00f1\u00d1\s\w.,;:!?()¿¡-]", "", text)
    return text.strip()


def get_knowledge_entries() -> List[Dict[str, Any]]:
    """
    Obtener los registros de la tabla knowledge_base desde Supabase.
    Esta es la base de conocimiento académico e institucional.
    """
    response = (
        supabase_.table("knowledge_base")
        .select("id, category, question, answer, keywords")
        .execute()
    )
    return response.data or []


def get_faqs_entries() -> List[Dict[str, Any]]:
    """
    Obtener las preguntas frecuentes desde la tabla faqs.
    """
    response = supabase_.table("faqs").select("id, question, answer").execute()
    return response.data or []


def build_combined_knowledge_base() -> tuple[str, List[Dict[str, Any]]]:
    """
    Combina knowledge_base y faqs en una sola base de conocimiento.
    Retorna el texto formateado y la lista completa de entradas.
    """
    knowledge_entries = get_knowledge_entries()
    faqs_entries = get_faqs_entries()

    # Combinar ambas fuentes
    all_entries = []

    # Agregar knowledge_base
    for entry in knowledge_entries:
        all_entries.append(
            {
                "source": "knowledge_base",
                "id": entry["id"],
                "question": entry["question"],
                "answer": entry["answer"],
                "category": entry.get("category", "General"),
            }
        )

    # Agregar FAQs
    for entry in faqs_entries:
        all_entries.append(
            {
                "source": "faqs",
                "id": entry["id"],
                "question": entry["question"],
                "answer": entry["answer"],
                "category": "FAQ",
            }
        )

    # Construir texto formateado para el prompt
    knowledge_text = "\n\n".join(
        [
            f"[ENTRADA {i+1}]\nPregunta: {clean_text(entry['question'])}\nRespuesta: {clean_text(entry['answer'])}"
            for i, entry in enumerate(all_entries)
        ]
    )

    return knowledge_text, all_entries


def find_exact_match(
    user_question: str, all_entries: List[Dict[str, Any]]
) -> Optional[str]:
    """
    Busca coincidencias exactas o muy cercanas en la base de conocimiento.
    Retorna la respuesta directamente si encuentra una coincidencia.
    """
    user_question_clean = clean_text(user_question.lower())

    for entry in all_entries:
        question_clean = clean_text(entry["question"].lower())

        # Coincidencia exacta
        if user_question_clean == question_clean:
            return entry["answer"]

        # Coincidencia parcial (la pregunta del usuario contiene la pregunta de la BD)
        if (
            question_clean in user_question_clean
            or user_question_clean in question_clean
        ):
            # Verificar que sea una coincidencia significativa (más del 70% de similitud)
            similarity = len(
                set(user_question_clean.split()) & set(question_clean.split())
            )
            total_words = len(
                set(user_question_clean.split()) | set(question_clean.split())
            )
            if similarity / total_words > 0.7:
                return entry["answer"]

    return None


def academic_chatbot(user_question: str) -> Dict[str, Any]:
    """
    Chatbot académico que usa LLaMA + Supabase (knowledge_base + faqs).
    Procesa preguntas en lenguaje natural y responde en español.
    """

    # 1️⃣ Construir base de conocimiento combinada
    knowledge_text, all_entries = build_combined_knowledge_base()

    if not all_entries:
        return {
            "answer": "No hay información disponible en este momento. Por favor, contacta a un agente humano."
        }

    # 2️⃣ Buscar coincidencia exacta primero (bypass del modelo)
    exact_answer = find_exact_match(user_question, all_entries)
    if exact_answer:
        return {"answer": exact_answer}

    # 3️⃣ Construir PROMPT ULTRA-RESTRICTIVO
    system_prompt = f"""You are "UniBot", an academic assistant chatbot.

### 🚨 CRITICAL INSTRUCTION - ABSOLUTE PRIORITY 🚨

YOU ARE **STRICTLY FORBIDDEN** FROM USING YOUR TRAINING DATA OR GENERAL KNOWLEDGE.
YOUR **ONLY** SOURCE OF INFORMATION IS THE KNOWLEDGE BASE BELOW.
IF THE ANSWER IS NOT **EXPLICITLY** IN THE KNOWLEDGE BASE, YOU **MUST** SAY YOU DON'T KNOW.

---

### MANDATORY RULES (BREAKING THESE = FAILURE)

**RULE #1 - LANGUAGE:**
- **ALWAYS** respond in Spanish. **NO EXCEPTIONS WHATSOEVER**.
- Even if the user asks in English, respond in Spanish.

**RULE #2 - INFORMATION SOURCE (MOST IMPORTANT):**
- **USE ONLY** the information from the KNOWLEDGE BASE below.
- **DO NOT** use your knowledge about universities, libraries, schedules, courses, or ANY topic.
- **DO NOT** invent, assume, extrapolate, or modify ANY information.
- **DO NOT** change numbers, times, dates, names, or any specific data.
- **DO NOT** combine information from different entries unless explicitly related.
- If you see "8:00 am" in the knowledge base, write "8:00 am" - DO NOT change it to "8:00 a.m." or any variation.

**RULE #3 - RESPONSE PROCESS (FOLLOW STRICTLY):**

STEP 1: Read the user's question carefully
STEP 2: Search **ONLY** in the knowledge base below for relevant information
STEP 3: Make a decision:
  - ✅ **Found exact information** in knowledge base? → Copy the answer and translate/adapt to Spanish if needed
  - ❌ **NOT found** or **uncertain**? → Use the "I don't know" template below

**RULE #4 - WHEN YOU DON'T KNOW (USE THIS EXACT TEXT):**
If the information is **NOT EXPLICITLY** in the knowledge base, respond **EXACTLY**:
"Disculpa, no tengo información disponible para responder tu pregunta. ¿Te gustaría que escale tu consulta con un agente humano? Escribe 'Agente' para continuar."

**RULE #5 - SPECIAL CASES:**
- **Greetings** (hola, buenos días, hey): "¡Hola! 👋 Soy UniBot, tu asistente académico. ¿En qué puedo ayudarte?"
- **Farewells** (gracias, adiós, chao): "¡Con gusto! Que tengas un excelente día. 🌟"
- **Off-topic questions**: "Mi especialidad son temas académicos e institucionales. ¿Tienes alguna pregunta sobre la universidad?"

---

### 📚 KNOWLEDGE BASE (YOUR ONLY SOURCE OF TRUTH)

{knowledge_text}

---

### ⚠️ VERIFICATION CHECKLIST (CHECK BEFORE RESPONDING) ⚠️

Before you send your answer, verify:
□ Is my answer based **ONLY** on the knowledge base above?
□ Did I copy the **EXACT** numbers, times, dates, and names from the knowledge base?
□ Did I avoid adding **ANY** information not in the knowledge base?
□ Am I responding in **Spanish**?
□ If I'm uncertain, did I use the "I don't know" response?

If **ANY** answer is NO, use the "I don't know" response instead.

---

### 🚨 FINAL WARNING 🚨

- Using information **NOT** in the knowledge base = **FAILURE**
- Inventing schedules, dates, or numbers = **FAILURE**
- Adding context not in the knowledge base = **FAILURE**
- When in doubt = **SAY YOU DON'T KNOW**
- **ACCURACY > HELPFULNESS** - Better to admit ignorance than give wrong information

**NOW ANSWER THE USER'S QUESTION FOLLOWING THESE RULES STRICTLY.**
"""

    # 4️⃣ Enviar pregunta del usuario al modelo
    try:
        completion = client.chat.completions.create(
            model="meituan/longcat-flash-chat:free",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_question},
            ],
            temperature=0.25,  # Temperatura baja para respuestas más determinísticas
            max_tokens=500,
        )

        model_answer = completion.choices[0].message.content.strip()

        # 5️⃣ Validación post-respuesta (detectar si inventó información)
        # Si la respuesta contiene números/horarios, verificar que estén en la base de conocimiento
        if any(char.isdigit() for char in model_answer):
            # Extraer números de la respuesta
            import re

            numbers_in_answer = re.findall(r"\d+:\d+|\d+", model_answer)

            # Verificar si esos números están en la base de conocimiento
            knowledge_has_numbers = any(
                any(num in entry["answer"] for num in numbers_in_answer)
                for entry in all_entries
            )

            # Si la respuesta tiene números que no están en la BD, rechazar
            if numbers_in_answer and not knowledge_has_numbers:
                return {
                    "answer": "Disculpa, no tengo información disponible para responder tu pregunta. ¿Te gustaría que escale tu consulta con un agente humano? Escribe 'Agente' para continuar."
                }

        return {"answer": model_answer}

    except Exception as e:
        print(f"Error en academic_chatbot: {str(e)}")
        return {
            "answer": "Ha ocurrido un error al procesar tu pregunta. Por favor, intenta nuevamente o escribe 'Agente' para hablar con un humano."
        }
