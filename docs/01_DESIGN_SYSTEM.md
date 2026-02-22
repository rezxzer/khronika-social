# Khronika — Design System (v1)

## 1) ბრენდის იდეა (ვიზუალური ხასიათი)
Khronika = „ქაღალდი და მელანი" — ტრადიციული სითბო + თანამედროვე სისუფთავე.
- სუფთა ფონები, რბილი ჩრდილები, ბარათები
- მკაფიო ჰედლაინები, ბევრი whitespace
- UI არ უნდა იყოს ხმაურიანი/ფერადი; მთავარი ყურადღება — კონტენტზე

---

## 2) Layout სტანდარტი
### Container
- max-width: **1100px**
- გვერდის padding: **px-4 (mobile), px-6 (desktop)**

### App Shell (auth pages არა)
Desktop-ზე 3 სვეტი:
- Left sidebar: navigation + circles shortcuts
- Center: main content (feed / circle / post)
- Right sidebar: notifications / suggestions (placeholder MVP)

Mobile-ზე:
- ყველაფერი ერთ სვეტად (center-only)
- sidebar ელემენტები გადადის Drawer/Dropdown-ში (მოგვიანებით)

---

## 3) Typography
### პრინციპი
- სათაური: მოკლე, დიდი, „მტკიცე"
- ტექსტი: მარტივად წასაკითხი, ხაზებს შორის კარგი სივრცე

### ზომები (Tailwind)
- H1: text-4xl md:text-5xl font-semibold tracking-tight
- H2: text-2xl md:text-3xl font-semibold
- H3: text-xl font-semibold
- Body: text-base leading-7
- Small: text-sm text-muted-foreground

---

## 4) Spacing / Grid წესები
- Section spacing: **py-14 md:py-20**
- Card padding: **p-4 md:p-6**
- Form field gap: **space-y-3**
- Page header gap: **mb-6 md:mb-8**

---

## 5) Shapes / Radius / Shadows
- Cards: rounded-xl
- Buttons/Inputs: rounded-lg
- Pills/Badges: rounded-full
- Hover: shadow-sm → shadow-md (სუბტილურად)
- Border: ყოველთვის თხელი, არა მძიმე

---

## 6) Components (shadcn/ui) სტანდარტები
### Buttons
- Primary: მთავარ CTA-ზე (1 გვერდზე მაქსიმუმ 1 ძლიერი CTA)
- Secondary/Outline: მეორეხარისხოვანი
- Ghost: Navbar/secondary actions

### Cards
- ყველა ძირითადი ბლოკი card-ში უნდა იყოს:
  - Header (title + meta)
  - Body (content)
  - Footer (actions)

### Forms
- Input height: ~44px
- Labels ზემოთ
- Error/Success ყოველთვის Alert კომპონენტით (კონსისტენტურად)

### Avatars
- Navbar: 32–36px
- Profile header: 72–96px
- Placeholder: initials

### Badges
- Private/Public badge: პატარა, მოკლე ტექსტი
- Owner/Mod badge: მკაფიო მაგრამ არ „ყვირის"

### Empty states
- Icon + სათაური + 1 წინადადება + ერთი ღილაკი (თუ შესაძლებელია)

### Loading states
- Skeleton grid (Cards), ფორმებზე spinner არა მუდმივად (მხოლოდ submit-ზე)

---

## 7) გვერდების დიზაინის პატერნები
### Landing (/)
- Hero: დიდი სათაური + მოკლე ტექსტი + 2 CTA
- ქვემოთ: 3 feature cards
- Footer: minimal

### Auth (/login, /register)
- Centered card: max-w-md
- Clear heading + helper text
- Errors/Success Alert

### Feed (/feed)
- Page header: „ფიდი" + create post (მოგვიანებით)
- Post cards: avatar + name + time + content + actions
- Right sidebar: notifications preview

### Circles (/circles)
- Header: „წრეები" + "შექმენი"
- List: card grid, search top

### Circle detail (/c/[slug])
- Header card: name + badges + join/leave
- Tabs (later): Posts / Members / About
- Placeholder: posts section header

### Profile (/u/[username])
- Profile header: avatar + display_name + username + bio
- ქვემოთ: stats placeholder + posts placeholder

### Settings (/settings/profile)
- Form card + avatar uploader
- Save button ყოველთვის ქვემოთ მარჯვნივ (desktop), full-width (mobile)

---

## 8) UI ტექსტების წესები (ქართული)
- მოკლე, პირდაპირი
- 1 მოქმედება = 1 ღილაკი
- შეცდომა: რა მოხდა + რა ქნა იუზერმა

მაგ:
- „ვერ შეიქმნა წრე — სლაგი დაკავებულია"
- „ატვირთვა ვერ მოხერხდა — სცადე სხვა სურათი"

---

## 9) QA Checklist (Design)
- ყველა გვერდს აქვს ერთნაირი container/max-width
- ყველა card ერთნაირი radius/shadow
- ყველა ფორმას აქვს consistent spacing + Alerts
- Mobile-ზე არაფერი "გადმოდის" ეკრანიდან
- Navbar ყველა გვერდზე ერთი და იგივე

---

## 10) Motion & Microinteractions (ინტერაქცია = ხასიათი)
ჩვენი ანიმაციები უნდა იყოს **სუბტილური, სწრაფი, "ელეგანტური"**.
მიზანი: იუზერს დაეხმაროს "გრძნობის" დონეზე — რა არის clickable, რა მოხდა, სად გადავიდა.

### სიჩქარეები (სტანდარტი)
- Fast: 120–160ms (hover, focus)
- Normal: 180–240ms (cards, small transitions)
- Slow (იშვიათად): 280–360ms (modal open/close)

### Easing
- default: ease-out (ყველაზე ხშირად)
- emphasis: ease-in-out (მხოლოდ განსაკუთრებულზე)

### Buttons — წესები
- Hover: ოდნავ "გაიბრწყინოს" + 1px lift (არა დიდი)
- Active/Press: scale(0.98) ან translateY(1px)
- Focus: მკაფიო ring (accessibility)
- Disabled: opacity + cursor-not-allowed

### Cards — წესები
- Hover: shadow-sm → shadow-md + -translate-y-0.5
- Border: ყოველთვის თხელი, hover-ზე ოდნავ გამოკვეთილი
- Clickable card: cursor-pointer + subtle highlight

### Links — წესები
- Navbar active: "pill" ან underline animation
- Hover underline: მოკლე ხაზით "გაჩენა" (არა სტანდარტული underline)

### Inputs — წესები
- Focus: ring + border color (ერთნაირი ყველა ფორმაზე)
- Error: Alert + input border (არ იყოს აგრესიული წითელი)

---

## 11) Page Transitions (გვერდებს შორის გადასვლა)
### პრინციპი
- გადასვლა უნდა იყოს მოკლე: fade + პატარა slide (2–6px)
- არ უნდა "დაგვაგვიანოს" ნავიგაცია

### Reduced Motion
- თუ user-ს აქვს `prefers-reduced-motion`, ანიმაციები უნდა გახდეს მინიმალური/გამორთული.

---

## 12) Navigation Feedback (იუზერს ყოველთვის უნდა იცოდეს რა ხდება)
- Route change-ზე ზედა პატარა progress bar (0.15–0.25 წამი)
- Submit ღილაკზე loading state (spinner) მხოლოდ იმ ღილაკზე
- Success/Error: Alert + Toast (თუ გვექნება)

---

## 13) "Delight" დეტალები (მომხიბლელი ელემენტები)
- Landing background: soft gradient + ძალიან მსუბუქი "grain" ეფექტი
- Iconography: lucide icons, ერთ სტილში
- Empty states: icon + ტექსტი + ერთი CTA (მაგ: "შექმენი წრე")
- Profile header: subtle "stamp" style badge (Khronika seal)

---

## 14) Theme & Accent (ფერების ზომიერება)
- Base: შავი/თეთრი (ink/paper)
- Accent: ერთი თბილი accent (მაგ: "seal" ოქროსფერ-თბილი ტონი) მხოლოდ CTA/ბეჯებზე
- არასდროს: ბევრი ფერი ერთდროულად.

---

## 15) UI ხარისხის Checklist
- ყველა hover/active/focus აქვს
- clickable ელემენტები ვიზუალურად იგრძნობა clickable-ად
- route transitions მუშაობს და არ ანელებს UI-ს
- reduced motion მუშაობს
- mobile-ზე hover effects არ "აწუხებს" (უბრალოდ არ ჩანს)

# End
