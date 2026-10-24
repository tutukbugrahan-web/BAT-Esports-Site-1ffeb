# BAT ESPORTS — Official Website

A responsive, multi-page-style esports website for BAT Esports. Main areas include a landing page, PUBG Mobile roster, team management, announcements, achievements, store, and recruitment form.

## Detailed roster and staff profiles

From the management panel, add or edit a player under **PUBG Kadrosu**. Fields include nickname, real name, PUBG Mobile ID, role, in-game position, age, country, device/FPS, K/D, season rank, competitive experience, achievements, biography, profile image, and social links. Click a roster card on the public site to open its full detail window.

Under **Yönetim & Ekip**, staff profiles support real name, display name, title, department, responsibilities, experience, biography, image, and social links. Staff cards also open a dedicated detail window. Announcement, achievement, and store cards can open detailed records as well.

## Customize the website

Sign in at `/login.html` and open the management panel at `/admin.html`. The **Genel Ayarlar** tab lets you edit the brand name and tagline, upload a logo and hero image, choose the accent color, edit the home headline and descriptions, modify section titles, button text, navigation labels, footer text, and social links.

The **Kaydet ve Yayınla** action saves content through the API. Images selected in the panel are resized and stored with the website content.

## Netlify deployment

1. This deployment is connected to the GitHub repository `tutukbugrahan-web/BAT-Esports-Site-1ffeb`, branch `main`.
2. Netlify environment variables:
   - `BAT_ADMIN_USERNAME`: your chosen management username (defaults to `batadmin` if not set).
   - `BAT_ADMIN_INITIAL_PASSWORD`: your own strong password.
   - `BAT_SESSION_SECRET`: a separate, long random secret.
3. After code commits, check **Deploys** and make sure the production commit follows the latest `main` commit.
4. Test `/api/health`; the expected result is `{"ok":true,"service":"BAT Esports API"}`.

Do not put passwords or secret values in source files or share them in screenshots.
