// Slop Detector ruleset.
// Each rule: { id, tier, category, explanation, pattern, type }
// Tier 1 = high-confidence phrases. Tier 2 = single-word vocabulary tells.
// Tier 3 = structural metrics, not highlighted inline (counted in summary).

const SLOP_RULES = [

  // ───────────────────────────────────────────────────────────────────────
  // TIER 1 — PHRASES
  // ───────────────────────────────────────────────────────────────────────

  // The "not just" construction
  {
    id: "not-just-1",
    tier: 1,
    category: "The 'not just' construction",
    explanation: "A signature LLM construction. Almost never appears in pre-2023 writing.",
    pattern: /\bit'?s not just [^.,!?]{1,60}[,—-]+\s*it'?s\b/i,
    type: "phrase"
  },
  {
    id: "not-just-2",
    tier: 1,
    category: "The 'not just' construction",
    explanation: "A signature LLM construction. Almost never appears in pre-2023 writing.",
    pattern: /\bisn'?t just [^.,!?]{1,60}[,—-]+\s*it'?s\b/i,
    type: "phrase"
  },
  {
    id: "not-just-3",
    tier: 1,
    category: "The 'not just' construction",
    explanation: "A signature LLM construction. Almost never appears in pre-2023 writing.",
    pattern: /\bnot just [^.,!?]{1,60} but\b/i,
    type: "phrase"
  },
  {
    id: "not-just-4",
    tier: 1,
    category: "The 'not just' construction",
    explanation: "A signature LLM construction. Almost never appears in pre-2023 writing.",
    pattern: /\bit'?s not about [^.,!?]{1,60}[,—-]+\s*it'?s about\b/i,
    type: "phrase"
  },
  {
    id: "not-just-5",
    tier: 1,
    category: "The 'not just' construction",
    explanation: "A signature LLM construction. Almost never appears in pre-2023 writing.",
    pattern: /\bnot because [^.,!?]{1,60}[,—-]+\s*but because\b/i,
    type: "phrase"
  },
  {
    id: "not-just-6",
    tier: 1,
    category: "The 'not just' construction",
    explanation: "A signature LLM construction. Almost never appears in pre-2023 writing.",
    pattern: /\bmore than just [^.,!?]{1,60}[,—-]+\s*it'?s\b/i,
    type: "phrase"
  },

  // The "actually works" tic
  {
    id: "actually-works",
    tier: 1,
    category: "The 'actually works' tic",
    explanation: "Implies all other things in the category don't. Everywhere on LinkedIn since 2023.",
    pattern: /\b\w+ that actually (works?|helps?|delivers?|matters?|do(es)?)\b/i,
    type: "phrase"
  },

  // The "quietly" tell
  {
    id: "quietly-doing",
    tier: 1,
    category: "The 'quietly' tell",
    explanation: "A Claude favorite. Things rarely 'quietly' do anything in real prose.",
    pattern: /\bquietly (doing|building|transforming|working|shaping|reshaping|changing|killing|winning|reinventing)\b/i,
    type: "phrase"
  },

  // The "this is by design" tic
  {
    id: "by-design",
    tier: 1,
    category: "The 'this is by design' tic",
    explanation: "LLMs love announcing intentionality. Humans usually just do the thing.",
    pattern: /\bthis is (by design|intentional|deliberate(ly)?)\b/i,
    type: "phrase"
  },

  // The fragment-question opener
  {
    id: "fragment-question",
    tier: 1,
    category: "The fragment-question opener",
    explanation: "A short fragment ending in '?' followed by a sentence. Mimics speech rhythm, badly.",
    pattern: /(^|[.!?]\s+)(And |But |Honestly|Turns out)?(The (result|kicker|reason|verdict|best part|catch|twist)|And honestly|And the (result|kicker|reason|verdict|best part)|Honestly)\?\s+[A-Z]/,
    type: "phrase"
  },

  // The ellipsis mic-drop
  {
    id: "ellipsis-mic-drop",
    tier: 1,
    category: "The ellipsis mic-drop",
    explanation: "Artificial dramatic pause where timing would do the work in speech.",
    pattern: /\b(and|but|honestly|turns out|the (result|verdict|kicker|reason))\b[^.!?\n]{0,20}\.\.\.\s*\w[^.!?\n]{0,30}[.!?]/i,
    type: "phrase"
  },

  // LLM disclaimer
  {
    id: "disclaimer-1",
    tier: 1,
    category: "LLM disclaimer",
    explanation: "A meta-phrase almost exclusively produced by language models.",
    pattern: /\bas an? (AI|large language model|language model)\b/i,
    type: "phrase"
  },
  {
    id: "disclaimer-2",
    tier: 1,
    category: "LLM disclaimer",
    explanation: "A meta-phrase almost exclusively produced by language models.",
    pattern: /\bI (don'?t|do not) have (personal )?(opinions|feelings|experiences|preferences)\b/i,
    type: "phrase"
  },
  {
    id: "disclaimer-3",
    tier: 1,
    category: "LLM disclaimer",
    explanation: "A meta-phrase almost exclusively produced by language models.",
    pattern: /\bas of my last (knowledge update|training)\b/i,
    type: "phrase"
  },
  {
    id: "disclaimer-4",
    tier: 1,
    category: "LLM disclaimer",
    explanation: "A meta-phrase almost exclusively produced by language models.",
    pattern: /\bmy training data\b/i,
    type: "phrase"
  },
  {
    id: "disclaimer-5",
    tier: 1,
    category: "LLM disclaimer",
    explanation: "A meta-phrase almost exclusively produced by language models.",
    pattern: /\bI (cannot|can'?t|am unable to) provide\b/i,
    type: "phrase"
  },

  // The closer flourish
  {
    id: "closer-embark",
    tier: 1,
    category: "The closer flourish",
    explanation: "Stock LLM closing imagery. Embarking, unlocking, navigating.",
    pattern: /\bembark on (a|the|this|your) journey\b/i,
    type: "phrase"
  },
  {
    id: "closer-unlock",
    tier: 1,
    category: "The closer flourish",
    explanation: "Stock LLM closing imagery. Embarking, unlocking, navigating.",
    pattern: /\bunlock the (potential|power|secrets|magic|future)\b/i,
    type: "phrase"
  },
  {
    id: "closer-navigate",
    tier: 1,
    category: "The closer flourish",
    explanation: "Stock LLM closing imagery. Embarking, unlocking, navigating.",
    pattern: /\bnavigate the (complexit|landscape|nuance|challeng)/i,
    type: "phrase"
  },

  // The corporate-poetry phrase
  {
    id: "poetry-realm",
    tier: 1,
    category: "The corporate-poetry phrase",
    explanation: "Phrases that sound deep but say very little. LLM comfort food.",
    pattern: /\bin the realm of\b/i,
    type: "phrase"
  },
  {
    id: "poetry-world-of",
    tier: 1,
    category: "The corporate-poetry phrase",
    explanation: "Phrases that sound deep but say very little. LLM comfort food.",
    pattern: /\bin the world of\b/i,
    type: "phrase"
  },
  {
    id: "poetry-heart-of",
    tier: 1,
    category: "The corporate-poetry phrase",
    explanation: "Phrases that sound deep but say very little. LLM comfort food.",
    pattern: /\bat the heart of\b/i,
    type: "phrase"
  },
  {
    id: "poetry-testament",
    tier: 1,
    category: "The corporate-poetry phrase",
    explanation: "Phrases that sound deep but say very little. LLM comfort food.",
    pattern: /\ba testament to\b/i,
    type: "phrase"
  },
  {
    id: "poetry-crucial-role",
    tier: 1,
    category: "The corporate-poetry phrase",
    explanation: "Phrases that sound deep but say very little. LLM comfort food.",
    pattern: /\bplays a (crucial|pivotal|vital|key) role\b/i,
    type: "phrase"
  },
  {
    id: "poetry-test-of-time",
    tier: 1,
    category: "The corporate-poetry phrase",
    explanation: "Phrases that sound deep but say very little. LLM comfort food.",
    pattern: /\bstand the test of time\b/i,
    type: "phrase"
  },

  // The "no fluff" signature
  {
    id: "no-fluff",
    tier: 1,
    category: "The 'no fluff' signature",
    explanation: "The hustle-LinkedIn opener. Often paired with parallel fragments.",
    pattern: /\bno fluff\b/i,
    type: "phrase"
  },

  // ───────────────────────────────────────────────────────────────────────
  // TIER 2 — WORDS
  // ───────────────────────────────────────────────────────────────────────

  // The delve cluster
  {
    id: "word-delve",
    tier: 2,
    category: "The delve cluster",
    explanation: "Frequency rose 1,500% in academic papers between 2022 and 2024.",
    pattern: /\b(delve|delves|delving|delved)\b/i,
    type: "word"
  },
  {
    id: "word-underscore",
    tier: 2,
    category: "The delve cluster",
    explanation: "Frequency rose 1,500% in academic papers between 2022 and 2024.",
    pattern: /\b(underscore|underscores|underscored|underscoring)\b/i,
    type: "word"
  },
  {
    id: "word-intricate",
    tier: 2,
    category: "The delve cluster",
    explanation: "Frequency rose 1,500% in academic papers between 2022 and 2024.",
    pattern: /\b(intricate|intricacies|intricately)\b/i,
    type: "word"
  },
  {
    id: "word-meticulous",
    tier: 2,
    category: "The delve cluster",
    explanation: "Frequency rose 1,500% in academic papers between 2022 and 2024.",
    pattern: /\b(meticulous|meticulously)\b/i,
    type: "word"
  },
  {
    id: "word-commendable",
    tier: 2,
    category: "The delve cluster",
    explanation: "Frequency rose 1,500% in academic papers between 2022 and 2024.",
    pattern: /\bcommendable\b/i,
    type: "word"
  },

  // The corporate-grand cluster
  {
    id: "word-tapestry",
    tier: 2,
    category: "The corporate-grand cluster",
    explanation: "Big-sounding words LLMs reach for to add weight.",
    pattern: /\btapestry\b/i,
    type: "word"
  },
  {
    id: "word-multifaceted",
    tier: 2,
    category: "The corporate-grand cluster",
    explanation: "Big-sounding words LLMs reach for to add weight.",
    pattern: /\bmultifaceted\b/i,
    type: "word"
  },
  {
    id: "word-nuanced",
    tier: 2,
    category: "The corporate-grand cluster",
    explanation: "Big-sounding words LLMs reach for to add weight.",
    pattern: /\bnuanced\b/i,
    type: "word"
  },
  {
    id: "word-holistic",
    tier: 2,
    category: "The corporate-grand cluster",
    explanation: "Big-sounding words LLMs reach for to add weight.",
    pattern: /\bholistic\b/i,
    type: "word"
  },
  {
    id: "word-robust",
    tier: 2,
    category: "The corporate-grand cluster",
    explanation: "Big-sounding words LLMs reach for to add weight.",
    pattern: /\brobust\b/i,
    type: "word"
  },
  {
    id: "word-pivotal",
    tier: 2,
    category: "The corporate-grand cluster",
    explanation: "Big-sounding words LLMs reach for to add weight.",
    pattern: /\bpivotal\b/i,
    type: "word"
  },
  {
    id: "word-paramount",
    tier: 2,
    category: "The corporate-grand cluster",
    explanation: "Big-sounding words LLMs reach for to add weight.",
    pattern: /\bparamount\b/i,
    type: "word"
  },

  // The verb cluster
  {
    id: "word-leverage",
    tier: 2,
    category: "The verb cluster",
    explanation: "Corporate verbs LLMs prefer over plainer alternatives.",
    pattern: /\b(leverage|leveraging|leveraged)\b/i,
    type: "word"
  },
  {
    id: "word-harness",
    tier: 2,
    category: "The verb cluster",
    explanation: "Corporate verbs LLMs prefer over plainer alternatives.",
    pattern: /\b(harness|harnessing|harnessed)\b/i,
    type: "word"
  },
  {
    id: "word-foster",
    tier: 2,
    category: "The verb cluster",
    explanation: "Corporate verbs LLMs prefer over plainer alternatives.",
    pattern: /\b(foster|fostering|fostered)\b/i,
    type: "word"
  },
  {
    id: "word-bolster",
    tier: 2,
    category: "The verb cluster",
    explanation: "Corporate verbs LLMs prefer over plainer alternatives.",
    pattern: /\b(bolster|bolstering|bolstered)\b/i,
    type: "word"
  },
  {
    id: "word-streamline",
    tier: 2,
    category: "The verb cluster",
    explanation: "Corporate verbs LLMs prefer over plainer alternatives.",
    pattern: /\b(streamline|streamlining|streamlined)\b/i,
    type: "word"
  },
  {
    id: "word-showcase",
    tier: 2,
    category: "The verb cluster",
    explanation: "Corporate verbs LLMs prefer over plainer alternatives.",
    pattern: /\b(showcase|showcasing|showcased)\b/i,
    type: "word"
  },
  {
    id: "word-garner",
    tier: 2,
    category: "The verb cluster",
    explanation: "Corporate verbs LLMs prefer over plainer alternatives.",
    pattern: /\b(garner|garnering|garnered)\b/i,
    type: "word"
  },
  {
    id: "word-elucidate",
    tier: 2,
    category: "The verb cluster",
    explanation: "Corporate verbs LLMs prefer over plainer alternatives.",
    pattern: /\b(elucidate|elucidating|elucidated)\b/i,
    type: "word"
  },

  // The adjective-stack cluster
  {
    id: "word-groundbreaking",
    tier: 2,
    category: "The adjective-stack cluster",
    explanation: "Marketing adjectives LLMs use as default emphasis.",
    pattern: /\bgroundbreaking\b/i,
    type: "word"
  },
  {
    id: "word-transformative",
    tier: 2,
    category: "The adjective-stack cluster",
    explanation: "Marketing adjectives LLMs use as default emphasis.",
    pattern: /\btransformative\b/i,
    type: "word"
  },
  {
    id: "word-seamless",
    tier: 2,
    category: "The adjective-stack cluster",
    explanation: "Marketing adjectives LLMs use as default emphasis.",
    pattern: /\b(seamless|seamlessly)\b/i,
    type: "word"
  },
  {
    id: "word-captivating",
    tier: 2,
    category: "The adjective-stack cluster",
    explanation: "Marketing adjectives LLMs use as default emphasis.",
    pattern: /\bcaptivating\b/i,
    type: "word"
  },
  {
    id: "word-compelling",
    tier: 2,
    category: "The adjective-stack cluster",
    explanation: "Marketing adjectives LLMs use as default emphasis.",
    pattern: /\bcompelling\b/i,
    type: "word"
  },

  // The newly-tainted cluster
  {
    id: "word-genuine",
    tier: 2,
    category: "The newly-tainted cluster",
    explanation: "Words with legitimate uses, but their frequency has exploded since 2023.",
    pattern: /\b(genuine|genuinely)\b/i,
    type: "word"
  },
  {
    id: "word-fluff",
    tier: 2,
    category: "The newly-tainted cluster",
    explanation: "Words with legitimate uses, but their frequency has exploded since 2023.",
    pattern: /\bfluff\b/i,
    type: "word"
  },
  {
    id: "word-quietly",
    tier: 2,
    category: "The newly-tainted cluster",
    explanation: "Words with legitimate uses, but their frequency has exploded since 2023.",
    pattern: /\bquietly\b/i,
    type: "word"
  },

  // The hedge phrase
  {
    id: "hedge-important-note",
    tier: 2,
    category: "The hedge phrase",
    explanation: "Throat-clearing transitions LLMs lean on heavily.",
    pattern: /\bit'?s important to note\b/i,
    type: "phrase"
  },
  {
    id: "hedge-worth-noting",
    tier: 2,
    category: "The hedge phrase",
    explanation: "Throat-clearing transitions LLMs lean on heavily.",
    pattern: /\bit'?s worth noting\b/i,
    type: "phrase"
  },
  {
    id: "hedge-essential-to",
    tier: 2,
    category: "The hedge phrase",
    explanation: "Throat-clearing transitions LLMs lean on heavily.",
    pattern: /\bit'?s (essential|crucial) to\b/i,
    type: "phrase"
  },
  {
    id: "hedge-keep-in-mind",
    tier: 2,
    category: "The hedge phrase",
    explanation: "Throat-clearing transitions LLMs lean on heavily.",
    pattern: /\bkeep in mind that\b/i,
    type: "phrase"
  },

  // ───────────────────────────────────────────────────────────────────────
  // TIER 3 — STRUCTURAL (computed in content.js, not regex-matched inline)
  // ───────────────────────────────────────────────────────────────────────

  {
    id: "struct-em-dash",
    tier: 3,
    category: "Em dash density",
    explanation: "Em dashes per 100 words. >2 is suspicious.",
    pattern: null,
    type: "structural"
  },
  {
    id: "struct-three-fragment",
    tier: 3,
    category: "Three-fragment cadence",
    explanation: "Three consecutive short sentences (<40 chars). The 'Bold. Beautiful. Yours.' pattern.",
    pattern: null,
    type: "structural"
  }
];

// Expose for content script.
if (typeof window !== "undefined") {
  window.SLOP_RULES = SLOP_RULES;
}
