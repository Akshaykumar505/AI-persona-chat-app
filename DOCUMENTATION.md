# Documentation

This document explains how the two AI personas (Hitesh Choudhary and Piyush Garg) were designed, engineered, and tested.

---

## 1. How Persona Data Was Collected and Prepared

The goal was to capture each educator's **general communication style, tone, and teaching approach** — not to reproduce their exact copyrighted content verbatim.

### Data Sources

- Publicly available YouTube video transcripts (e.g., a video by Hitesh Choudhary discussing programming language choice for DSA, and a video on the 2025 Web Development roadmap)
- Observed patterns from public social media presence and well-known mannerisms associated with each creator
- General knowledge of each creator's teaching philosophy and audience engagement style

### Preparation Process

1. **Transcript review** — Video transcripts were read to identify recurring patterns rather than copied directly.
2. **Pattern extraction** — For each persona, the following were manually noted:
   - Common filler words and greetings (e.g., "haan ji", "chai gang", "alright so")
   - Sentence structure and pacing (short and punchy vs. warm and storytelling)
   - Explanation structure (how they open a topic, how they build an argument, how they close)
   - Recurring teaching philosophies (e.g., "no shortcuts," "build projects, don't just watch tutorials")
3. **Paraphrasing, not copying** — Patterns were abstracted into *behavioral instructions* (e.g., "use short, crisp sentences" rather than quoting a specific line), in line with copyright-safe prompt design.
4. **Iterative refinement** — Draft prompts were tested with sample questions, and responses were compared against the intended persona voice. Mismatches (e.g., responses defaulting to Devanagari script instead of Hinglish in Roman script) were identified and corrected through prompt adjustments.

### Ethical Considerations

- The app includes a visible disclaimer stating it is an AI simulation, not the real person.
- No real photos or copyrighted transcripts are reproduced verbatim in the app or prompts.
- If directly asked "are you the real [persona]?", both personas are instructed to honestly disclose they are AI simulations.

---

## 2. Prompt Engineering Strategy

Each persona is defined by a structured **system prompt** stored in `backend/personas.js`. The prompt is organized into clearly labeled sections so the model can reliably apply each behavioral rule:

| Section | Purpose |
|---|---|
| **Core Linguistic Architecture** | Defines language mix (Hinglish), script (Roman, not Devanagari), and vocabulary preferences |
| **Signature Catchphrases & Vocabulary** | Lists specific recurring phrases to sprinkle naturally into responses |
| **Explanation Method** | A step-by-step structural flow the model follows when answering (e.g., Hook → Analogy → Practical Steps → Reality Check for Piyush; Welcome → Simplify → Roadmap → Encouragement for Hitesh) |
| **Short Reply Style** | Separate guidance for handling short, casual questions vs. deep technical ones |
| **Behavioral Layers** | Empathy-first responses, celebratory tone on user wins, light humor |
| **Response Length Guidance** | Keeps replies conversational (roughly 4–6 sentences) rather than essay-length, matched to question complexity |
| **Training Examples** | One worked example per persona showing the expected tone and structure end-to-end |

### Key Engineering Decisions

- **Explicit script control**: Early testing showed the model defaulting to Devanagari script when Hindi catchphrases were included in the prompt. The instruction was made explicit — *"Always respond in Roman script, never Devanagari"* — which resolved this.
- **Persona-specific vocabulary rules**: Piyush's prompt keeps technical terms in English (e.g., "scalability," "deployment") while Hitesh's prompt favors simpler, warmer phrasing.
- **Reality-check pattern**: Both personas are instructed to end technical answers with a grounded, honest takeaway rather than hype — mirroring their real teaching philosophy of substance over shortcuts.
- **Model selection**: Free-tier models available via OpenRouter were tested iteratively; models producing garbled or mixed-script output were swapped out in favor of more stable ones.

---

## 3. Context Management Approach

- **Full conversation history per session**: The frontend maintains the entire message list (`{ role, content }` pairs) in React state and sends the complete history with every request to `/api/chat`. This allows the model to maintain conversational context (e.g., referring back to earlier questions in the same session).
- **System prompt injection**: On every request, the backend prepends the persona's `systemPrompt` as the first message in the `messages` array sent to the LLM, ensuring persona consistency is enforced on every turn rather than only at the start of a conversation.
- **Token limits**: `max_tokens` is capped (500) to keep responses concise and conversational rather than long-form essays, and `temperature` is set to 0.8 for natural, less robotic phrasing.
- **No persistent chat history (by design)**: Conversations are not currently stored in a database — each session's context lives only in the browser's memory for that visit. This was a deliberate simplicity/privacy trade-off; a database-backed history (e.g., Firestore) could be added as a future enhancement.
- **Session boundaries**: Selecting "Back" or "Clear Chat" resets the message array, starting a fresh context window with the persona.

---

## 4. Sample Conversations

### Hitesh Choudhary Persona

**User:** DSA konsi language se seekhein?

**AI (Hitesh):**
"Hello dosto, kaise hain aap sab? Dekho, yeh ek bahut purana confusion hai — sabke apne-apne pasand hai, koi C++ bolega, koi Python. Lekin asli baat yeh hai ki DSA ka logic language-independent hota hai. Agar aap apni baat pseudocode mein likh sakte ho, toh aap kisi bhi language mein convert kar sakte ho — chahe woh Java ho ya JavaScript. Meri advice: jo language aapko already thodi comfortable lagti hai, wahi pakdo aur usme practice shuru karo. Load bilkul mat lo, consistency matter karti hai, language nahi!"

---

**User:** Web development 2026 mein seekhna chahiye ya AI sab kuch kar dega?

**AI (Hitesh):**
"Dosto, yeh sawaal bahut logon ke mann mein hai! Dekho, yeh concern pehle bhi aaya tha jab WordPress aaya tha, tab bhi laga tha developers ki zarurat khatam ho jayegi — aisa kabhi nahi hua. AI code likh sakta hai, lekin uss code mein bugs bhi hote hain, aur unhe fix karne ke liye strong fundamentals chahiye. Koi shortcut nahi hai — HTML, CSS, JavaScript se shuru karo, projects banao, GitHub pe daalo. AI ko ek tool ki tarah use karo, uske upar completely depend mat raho!"

---

### Piyush Garg Persona

**User:** System design seekhna zaroori hai kya full-stack banne ke liye?

**AI (Piyush):**
"Yaar, yeh kaafi accha question hai! Chalo real world analogy se samjhte hain — maan lo tum ek chhota dhaba chala rahe ho, ek chef sab sambhal leta hai. Lekin agar achanak 10,000 log aa jayein, akela chef nahi sambhal payega — wahan poora system chahiye hoga. System design bhi wahi hai — jab code production mein jaata hai aur traffic scale hota hai, tab kaam aata hai. Mera take: shuruaat mein deep system design mein mat ghuso, pehle scalable apps banao, database indexing samjho, phir system design pe aao. Simple cheez hai, that's it!"

---

**User:** Docker kya hai?

**AI (Piyush):**
"Alright so, Docker basically ek containerization tool hai. Let's take an example of an intern — jab naya intern join karta hai, usko apna laptop setup karne mein 2 din lag jaate hain, sahi versions install karne mein. Docker isko solve karta hai — poora environment ek container mein pack ho jaata hai, jo kahi bhi same tarike se chal jaata hai. It's just a fancy term for 'package your app with everything it needs.' Iske peeche koi rocket science nahi hai — try karo, khud samajh aa jayega. Right?"

---

## Notes on Reproducibility

Responses are AI-generated at inference time and will vary between runs due to the model's temperature setting; the examples above are illustrative of the intended tone and structure, not fixed/hardcoded outputs.