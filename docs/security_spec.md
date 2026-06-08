# Security Specification: Wafort Forms canal-de-feedback

This document lists the security invariants, test payloads, and rules for the Wafort communication system (critiques, suggestions, and anonymous complaints).

## 1. Data Invariants
- **Anonymous Submission Support**: To encourage high compliance, honesty, and safety, collaborators MUST be able to submit critiques, suggestions, and whistleblower complaints anonymously without being logged in.
- **Access Token Tracking**: Submissions are tracked and retrieved securely via their unique Firestore Document ID, which acts as an unguessable 20-character secret token.
- **Admin Isolation**: Only users authenticated as `brisasofc@gmail.com` (verified) have administrative access to list all feedback, change the state of submissions, write administrative responses, or view internal notes.
- **Admin Notes Protection**: Collaborators and general public cannot write or modify `adminNotes` or `adminResponse` upon creation.
- **Immutability of History**: Once a feedback document is created, its original creation date (`createdAt`) and primary details cannot be altered, even by an administrator.

## 2. The "Dirty Dozen" Non-Compliant Payloads (Pre-Hardening Verification)
The following payloads represents malicious attempts containing security bypasses. The `firestore.rules` will reject these with a `PERMISSION_DENIED` exception.

1. **Self-Elevated Admin Profile Creation**
   Attempting to set role or privilege elements upon feedback creation.
2. **Accessing All Submissions (Blanket Read Command)**
   Anonymous hacker querying the whole list of feedback records.
3. **Ghost Update Attack**
   Attempting to overwrite existing feedback categories by an anonymous reader.
4. **Altering Creation Date (createdAt)**
   Modifying the submission log timestamp after creation.
5. **Unauthorized Responder**
   An unauthorized user posing as Wafort staff answering complaints.
6. **Injecting Poisoned Heavy Payload (DoS/Denial of Wallet)**
   Submitting forms containing over-sized descriptions (e.g., millions of characters).
7. **Bypassing Category Schema**
   Submitting complaints with undefined/invalid categories or malformed types.
8. **Malicious ID Injection (String Poisoning)**
   Creating dynamic feedbacks using oversized, unescaped, or non-alphanumeric IDs (e.g., path traversal or injection keys).
9. **Anonymous State Interception**
   Trying to complete a state change on pending submissions (transitioning directly to `resolvido` or archiving notes without admin rights).
10. **Spoofing Email Address**
    Submitting identified feedback while forging the creator’s identified email.
11. **Admin Email Hijacking (Email Spoofing)**
    Attempting to perform lists queries using an unverified account claiming to be `brisasofc@gmail.com`.
12. **Malicious Delete Actions**
    Wiping out evidence from feedback records by non-admin users.

## 3. Production Security Rules
These rules are formulated to reject all malicious payloads while enabling safe submission and tracked lookup.
