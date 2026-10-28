# Activate Tlahtōlli cloud accounts

The public Tlahtōlli website continues to run on GitHub Pages. Supabase handles email/password authentication and the private per-user study-card database. The site does not store passwords itself.

## One-time setup (site owner only)

1. Visit https://supabase.com/dashboard and create a project.
2. Open **SQL Editor**, paste and run [cloud/setup.sql](setup.sql). It creates `public.tlahtolli_study_cards` and row-level-security policies tied to the authenticated user ID.
3. Under **Authentication → Providers**, leave email sign-in enabled. Decide whether new users must confirm their email (recommended).
4. Under **Authentication → URL Configuration**:
   - Site URL: `https://niftybacon.github.io/tlahtolli/`
   - Add the same URL to the redirect allow list.
5. In project **Connect / API settings**, copy **Project URL** (format `https://PROJECT.supabase.co`) and the **publishable (public) key**.
6. Edit the GitHub file [cloud-config.js](../cloud-config.js) with those two PUBLIC values, leaving the secret/service-role keys out of GitHub entirely. GitHub Pages will publish the updated configuration automatically after deployment.
7. Reload https://niftybacon.github.io/tlahtolli/, open **Momachtia · Study**, sign up and confirm your email if required. Sign in.
8. If the device has earlier local review history, click **Import old local reviews** before studying on another device.
9. On your phone, sign in with the **same email and password**, tap **Sync now**, and verify that due counts and review dates match.

No user passwords or private reviews should ever be stored in public GitHub files. The Supabase publishable key is designed for use in browser apps; the database's RLS policies enforce privacy.

## What syncs / does not sync yet

**Synced:** per-card vocabulary, reverse, and conjugation review history (including card-level FSRS history). **Advanced SRS and FSRS settings now also sync**: daily new/review limits, learning steps, scheduling options, queue order, timer, optional answer reveal, FSRS opt-in, and separate retention targets/scales.

**First-time settings setup:** Sign in on the device with the settings you want to keep. In **Momachtia · Study → Private study account**, click **Save device settings to account** once. Thereafter, saving SRS or FSRS settings automatically queues a cloud update. On a second device, sign in and reload or click **Sync now** to load saved preferences. If two customized devices disagree, the app asks you to choose **Load account settings** or **Save device settings** before replacing anything. Settings are stored in the existing RLS-protected `tlahtolli_study_cards` table under a reserved non-card key; **no SQL migration is needed.**

**Not yet synced:** locally edited dictionaries, reading passages, and annotations. Continue exporting a **full project backup JSON** before changing devices, clearing browser data, or editing accounts.

**Offline:** the existing local schedule and settings work even without cloud access. After reconnecting, **Sync now** can upload newer reviews and saved preferences. Never clear your browser data before unsynced reviews have uploaded.

**Safety:** the first sign-in does not silently upload guest history. Initial preferences are saved only when the account owner selects the save action or later changes a setting while signed in. The explicit import button keeps personal data isolated. Cloud records are merged by last review time; **concurrent edits to the same card and Undo/reset/delete across multiple devices are not fully conflict-resolved yet.** Resetting local reviews is not a cloud deletion; cloud records can reappear. Treat the cloud feature as beta until tested with two devices.

## Test security

With two separate confirmed Supabase accounts, check that account A's card rows aren't visible when signed in as account B. Do not disable RLS. If a policy is edited, retest privacy before inviting other users.

## Troubleshooting

- **Account sync is not configured** — `cloud-config.js` still has placeholder values, or GitHub Pages has not published the new commit yet.
- **Email not confirmed** — check the confirmation link and allowed redirect URL in Supabase.
- **Permission denied** — run `cloud/setup.sql` and verify RLS; never bypass it by exposing a service-role key.
- **Failed to fetch** — check internet access, browser extensions, correct Supabase URL and CDN accessibility.
- **History missing on a new device** — sign in with the same account; tap **Sync now**. On the original device, use **Import old local reviews** if old reviews never reached the cloud.
- **After sign-out** — original guest records are restored locally. Public dictionary and research data remain available.

For security architecture consult: https://supabase.com/docs/guides/auth and https://supabase.com/docs/guides/database/postgres/row-level-security

### Settings-sync limitations

Preferences are saved as one versioned object per account, not merged per individual field. Simultaneous writes from two devices are not transactionally serialized and can still race; avoid editing the same preference on two devices at exactly the same time. Existing due dates are not rewritten merely by loading settings. After publishing, test with a real account in two browsers and verify Supabase RLS is enabled before broad use.
