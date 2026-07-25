/**
 * Single source of truth for the member agreement and the AI disclaimer.
 *
 * NOT LAWYER-DRAFTED. This is a plain-language starting template covering the
 * usual bases for an online fitness membership. Have a Florida attorney review
 * it before you take real money — waiver enforceability is state-specific and a
 * fitness business carries real injury exposure.
 *
 * When you change the terms, BUMP AGREEMENT_VERSION. Anyone whose stored
 * agreed_version no longer matches gets re-prompted on their next login, and the
 * old consent stays on record with the version they actually saw.
 */
export const AGREEMENT_VERSION = '2026-07-25';

export const AI_DISCLAIMER_SHORT =
  'Suggestions only — not medical advice. Stop if something hurts and message Lyla.';

export const AI_DISCLAIMER_LONG =
  'The in-workout coach is an AI assistant. It offers general movement suggestions based on the workout Lyla wrote and what you told us about yourself. It is not a doctor, physical therapist, or licensed professional, and nothing it says is medical advice, diagnosis, or treatment. Stop any movement that causes pain and talk to a qualified healthcare provider.';

export type AgreementSection = { heading: string; body: string };

export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    heading: 'This is fitness coaching, not healthcare',
    body: 'The Progress Club provides general fitness and nutrition information for healthy adults. Lyla Schilling is a fitness coach, not a physician, physical therapist, registered dietitian, or licensed medical professional. Nothing in this membership — workouts, coaching notes, messages, or the AI assistant — is medical advice, diagnosis, or treatment, and none of it replaces care from a qualified healthcare provider.',
  },
  {
    heading: 'Talk to your doctor first',
    body: 'You confirm you are at least 18 years old and physically able to take part in strength and conditioning exercise. You agree to get clearance from your doctor before starting, especially if you are pregnant or postpartum, are recovering from injury or surgery, take prescription medication, or have any heart, joint, blood pressure, respiratory, or other medical condition.',
  },
  {
    heading: 'The AI assistant is a suggestion engine',
    body: 'The in-workout coach is powered by AI. It can be wrong, and it does not know your full medical history. It offers scaled versions of the movements Lyla programmed based on the information you provide. Treat its output as a starting suggestion, never as a clinical recommendation. If a suggestion feels wrong for your body, do not do it.',
  },
  {
    heading: 'You know your body — stop when it hurts',
    body: 'You are responsible for choosing weights, modifying movements, and stopping when something feels wrong. Discomfort from effort is normal; sharp, sudden, or joint pain is not. Stop immediately, and message Lyla so she can adjust your plan.',
  },
  {
    heading: 'Assumption of risk and release',
    body: 'Exercise carries an inherent risk of injury, including serious injury. By joining, you knowingly and voluntarily assume that risk. To the fullest extent permitted by law, you release and hold harmless Lyla Schilling and The Progress Club from any claim, liability, or expense arising out of your participation, except for injury caused by gross negligence or willful misconduct. This does not limit any right you cannot waive under applicable law.',
  },
  {
    heading: 'What you tell us, and where it goes',
    body: 'The answers you give at sign-up — including anything you share about injuries or limitations — are stored so Lyla can coach you and so the AI assistant can suggest appropriate modifications. Your answers are sent to our AI provider to generate those suggestions. They are visible to Lyla and are not sold or shared with anyone else. You can update or clear your answers any time from your Account page, or ask Lyla to delete them.',
  },
  {
    heading: 'No guaranteed results',
    body: 'Fitness and body-composition outcomes depend on genetics, effort, consistency, sleep, nutrition, and factors outside anyone’s control. No specific result is promised or guaranteed.',
  },
  {
    heading: 'Membership, billing, and your content',
    body: 'Membership is month to month and you can cancel any time by messaging Lyla — no forms, no hoops. Workouts, videos, and written programming are Lyla’s original work, provided for your personal use; please do not redistribute or resell them.',
  },
];

export const AGREEMENT_ACCEPT_LABEL =
  'I have read and agree to the above. I confirm I am 18 or older, I am participating at my own risk, and I understand the AI assistant does not give medical advice.';
