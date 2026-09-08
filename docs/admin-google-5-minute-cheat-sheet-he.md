# Queen Match — Cheat Sheet להצגה (5 דקות)

## טקסט דיבור לפי זמן

### 0:00–0:30 | פתיחה

**"אני אתמקד בצד של האדמין ובתשתיות ההתחברות והפגישות שבניתי. המטרה הייתה ליצור מערכת שבה האדמין מקבלת תמונת מצב תפעולית מלאה, ובמקביל להפוך את הכניסה וקביעת הפגישה לתהליך קצר ובטוח — כולל Google Sign-In, Google Calendar, Google Meet ושחזור סיסמה."**

### 0:30–1:40 | אזור האדמין — UI ו־UX

- ה־Dashboard נותן **overview מהיר**: מספר משתמשות, מנטוריות פעילות, פגישות פעילות והתראות פתוחות.
- יש אזורים ייעודיים ל־**משתמשות, פגישות, לוח שנה והתראות**, כדי שהאדמין תוכל גם לזהות בעיה וגם לפעול עליה.
- במסך המשתמשות אפשר לחפש ולסנן, לצפות בפרטים, לעדכן פרופיל והרשאת admin, ולשלוט בנראות של מנטוריות.
- במסך הפגישות אפשר לסנן לפי סטטוס ותאריכים, לפתוח פרטי פגישה, לשנות מועד או סטטוס ולבטל.
- מסך ההתראות מציף מקרים שדורשים טיפול, למשל פגישה שעברה ללא עדכון או משוב חסר, וניתן להקצות, לתעד ולסגור טיפול.
- לוח האדמין נבנה עם **FullCalendar**, והוא מציג את הפגישות ששמורות אצלנו ב־database. חשוב: זו תצוגה פנימית, לא היומן האישי של Google.
- העיצוב מבוסס **Material UI**: היררכיה ברורה, cards ל־KPI, badges לסטטוסים, מצבי loading/error/empty ופעולות עם confirmation כשצריך.
- הממשק responsive ותומך בעברית, אנגלית וערבית, כולל **RTL/LTR**. הצבעוניות מבוססת על שפת המותג של QueenB — ורוד, סגול ורקע בהיר.

**משפט מסכם:** "החלטת ה־UX המרכזית הייתה לבנות לאדמין cockpit תפעולי: קודם להבין מה דורש תשומת לב, ואז להגיע לפעולה הרלוונטית במעט קליקים." 

### 1:40–2:40 | Google Calendar ו־Google Meet

- רק מנטורית יכולה לחבר Google Calendar; זו החלטת הרשאות כי היא ה־organizer של הפגישה.
- החיבור מתבצע ב־**OAuth 2.0** עם scope מצומצם: `calendar.events` בלבד.
- לאחר אישור Google מתקבל `refresh token`. הוא לא נשמר כטקסט גלוי אלא מוצפן ב־**AES-256-GCM** ב־PostgreSQL, עם connection נפרד לכל מנטורית.
- כשה־mentee בוחרת slot, השרת יוצר קודם את הפגישה המקומית בתוך transaction, ואז קורא ל־**Google Calendar API**.
- האירוע כולל את זמני הפגישה, ה־mentee כ־attendee ובקשה ל־conference; Google יוצר את קישור ה־Meet.
- אנחנו שומרים ב־Meeting את `googleCalendarEventId`, קישור האירוע וקישור ה־Meet, ומציגים כפתור הצטרפות במסכי הפגישות.
- אם יצירת האירוע החיצוני נכשלת, הפגישה המקומית לא נמחקת: הכשל נרשם בלוג והמערכת נשארת עקבית. זו גישת **best effort**, אבל בגרסת production הייתי מוסיפה retry/queue והתראה לאדמין.

**משפט מסכם:** "ה־database שלנו הוא source of truth, ו־Google הוא integration חיצוני שמעשיר את הפגישה ולא מנהל את הלוגיקה העסקית." 

### 2:40–3:35 | התחברות עם Google

- זהו flow נפרד מחיבור Calendar, עם scopes של `openid`, `email`, `profile` בלבד.
- השרת יוצר `state` אקראי וקצר־חיים להגנה על ה־OAuth flow, מקבל authorization code ומוודא מול Google את ה־ID token, כולל issuer, audience ו־`email_verified`.
- אם האימייל כבר קיים, החשבון מחובר ל־Google בלי ליצור משתמשת כפולה.
- משתמשת חדשה עוברת onboarding קצר ובוחרת mentee או mentor; למנטורית נאספים גם פרטי המנטורינג הנדרשים.
- רק לאחר האימות השרת מנפיק **JWT** של האפליקציה. ה־frontend שולח אותו כ־Bearer token לכל REST request.

**אם שואלים:** Google Sign-In מאמת זהות; Google Calendar נותן הרשאה ליומן. אלה credentials, scopes ו־callbacks נפרדים בכוונה.

### 3:35–4:15 | שכחתי סיסמה

- המשתמשת מזינה אימייל ומקבלת תמיד תשובה כללית — גם אם החשבון לא קיים — כדי למנוע **user enumeration**.
- לחשבון עם סיסמה נוצר token קריפטוגרפי חד־פעמי. ב־database נשמר רק **SHA-256 hash** שלו, לא ה־token הגולמי.
- הקישור נשלח דרך **Nodemailer ו־Gmail SMTP**, וברירת המחדל היא תוקף של 30 דקות.
- במסך האיפוס יש בדיקת חוזק ואימות סיסמה. לאחר שימוש, ה־token מסומן כמשומש ולא ניתן למחזר אותו, והסיסמה נשמרת כ־`bcrypt hash`.
- חשבון Google-only לא מקבל קישור איפוס מקומי, כי אין לו סיסמה מקומית.

### 4:15–4:50 | Architecture ו־Stack

**"המערכת היא full-stack בשלוש שכבות: React בצד הלקוח, Express REST API בצד השרת, ו־PostgreSQL דרך Prisma."**

- Frontend: React 18, React Router, Material UI/Emotion, Axios, FullCalendar ו־Day.js.
- Backend: Node.js + Express; routes דקים, services ללוגיקה העסקית ו־middleware ל־authentication/authorization.
- Data: Prisma ORM, schema יחסי ו־migrations מול PostgreSQL.
- Internal APIs: `/api/admin`, `/api/auth`, `/api/google-calendar`, `/api/meetings`.
- External APIs/services: Google OAuth/OpenID, Google Calendar API שיוצר גם Meet, ו־Gmail SMTP.
- אבטחת admin קיימת בשתי שכבות: route guard ב־UI, ובשרת `requireAuth` ואז `requireAdmin`. השרת הוא האכיפה האמיתית.

### 4:50–5:00 | סיום

**"החלק שבניתי מחבר בין חוויית משתמש פשוטה לבין תשתית מלאה מאחוריה: האדמין רואה ומנהלת את התהליך, המשתמשת נכנסת בצורה נוחה, והמנטורית יכולה להפוך התאמה לפגישת Calendar ו־Meet אמיתית. הצעד הבא שלי ל־production היה להעביר state זמני ו־sessions לאחסון עמיד, להוסיף queue ו־retry לאינטגרציות, ולהקשיח את שמירת ה־JWT."**

## שאלות צפויות — תשובות של משפט אחד

- **למה לא ליצור Meet ישירות?** Google Meet נוצר דרך `conferenceData` של אירוע Calendar, כך שהאירוע והקישור נשארים מחוברים.
- **מי מחבר Calendar?** המנטורית בלבד, כי היא מארגנת האירוע; ה־mentee מוזמנת כ־attendee.
- **מה נשמר מ־Google?** בהתחברות נשמר `googleSubject`; ב־Calendar נשמר refresh token מוצפן; בפגישה נשמרים מזהה האירוע והקישורים.
- **מה קורה אם Google נופל?** הפגישה המקומית נשארת קיימת; כרגע נרשם log, ובהמשך נכון להוסיף retry והתראה.
- **איך האדמין מוגנת?** JWT מאמת משתמשת ו־middleware נוסף בודק `isAdmin`; ה־frontend guard הוא רק שכבת UX.
- **האם סיסמאות מוצפנות?** הן עוברות hashing חד־כיווני ב־bcrypt; לא ניתן ולא צריך לפענח אותן.
- **למה token איפוס נשמר כ־hash?** כדי שגם במקרה של דליפת database אי אפשר יהיה להשתמש ישירות בקישורי האיפוס.
- **מה ההבדל בין לוח האדמין ל־Google Calendar?** לוח האדמין קורא פגישות מה־database לצורכי ניהול; Google Calendar הוא אירוע חיצוני ביומן המנטורית.
- **מהו ה־source of truth?** PostgreSQL; האינטגרציות החיצוניות הן side effects של הפעולה העסקית.
- **פשרת MVP חשובה?** ה־JWT נשמר ב־localStorage ו־OAuth state/handoff נשמרים בזיכרון השרת; ב־production עדיף HttpOnly cookie ואחסון משותף כמו Redis.

## מילות מפתח לזכור

`React` · `MUI` · `responsive` · `RTL/i18n` · `Express REST` · `Prisma/PostgreSQL` · `JWT` · `role-based access` · `OAuth 2.0` · `scopes` · `state` · `refresh token encryption` · `Google Calendar API` · `conferenceData / Meet` · `bcrypt` · `single-use reset token` · `source of truth` · `best effort`
