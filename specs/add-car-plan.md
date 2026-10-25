# Guest adds Audi TT to Garage — план тесту

Джерело навчальної умови: `specs/add-car.md` (не змінюється). Цей файл лише
деталізує її для реалізації та не додає нових очікуваних результатів.

## Перевірена навчальна умова

Після входу через `Guest log in` користувач відкриває форму `Add car`, обирає
Brand `Audi`, Model `TT`, вводить Mileage `12000`, зберігає форму й бачить
автомобіль `Audi TT` у Garage (`specs/add-car.md`).

## Межі

- Один UI-тест у Chromium: `tests/add-car.spec.ts`.
- Старт через `baseURL` із `playwright.config.ts`; HTTP Basic Auth забезпечує
  config. Вміст локального CLI config не читається й не цитується.
- Вхід у гостьовий профіль є підготовкою. Precondition: URL містить
  `/panel/garage` і видно heading `Garage`, як у baseline.
- Головний результат за `specs/add-car.md`: URL Garage та видимий запис
  `Audi TT` після збереження. Інші властивості картки (mileage, фото, дата) не є
  oracle.
- Не додавати registration, API-виклики, credentials, Fuel expenses,
  редагування чи видалення авто, інші пари Brand/Model.
- `tests/guest-garage.spec.ts`, `specs/add-car.md`, config і dependencies не
  змінюються.
- Page Object: класи в `pages/` містять лише локатори й дії, без `expect`.
  Усі `expect` лежать у `tests/add-car.spec.ts`.
- Лише role / label / text локатори, підтверджені CLI snapshot. Без CSS/XPath,
  `waitForTimeout`, `.first()`/`.nth()`/`.last()`.

## Тестові дані

- Brand: `Audi`.
- Model: `TT`.
- Mileage: `12000` (передається у `fill` як рядок `'12000'`).
- Очікуваний запис у Garage: текст `Audi TT`.
- ASSUMPTION: картка показує Brand і Model одним рядком `Audi TT`. Якщо snapshot
  покаже їх в окремих елементах, локатор будується через контейнер картки
  (див. Page Object).

## Відповідність очікувань і assertions

| Очікування | Assertion у spec-файлі | Примітка |
|---|---|---|
| Гостьовий вхід виконано | `expect(page).toHaveURL(/panel\/garage/)` | precondition, як у baseline |
| Відкрито Garage | `expect(garage.heading).toBeVisible()` | FACT-локатор із baseline |
| До збереження `Audi TT` немає | `expect(garage.carEntries('Audi TT')).toHaveCount(0)` | захист від хибного pass на наявних даних |
| Форма `Add car` відкрита | `expect(addCar.root).toBeVisible()` | sync-точка, scope форми |
| Model залежить від Brand | `expect(addCar.modelOption('TT')).toBeAttached()` (native) або `toBeVisible()` (кастомне меню) **після** вибору Audi і **перед** вибором Model | web-first очікування замість timeout |
| Mileage введено | `expect(addCar.mileageInput).toHaveValue('12000')` | перевіряє введення, не правило продукту |
| Форма закрилась після збереження | `expect(addCar.root).toBeHidden()` | ASSUMPTION; лише якщо CLI підтвердить закриття |
| Після збереження — Garage | `expect(page).toHaveURL(/panel\/garage/)` | вимога `specs/add-car.md` |
| `Audi TT` з'явився | `expect(garage.carEntries('Audi TT')).toHaveCount(1)`, потім `toBeVisible()` | головний oracle |

Чому `0 → 1`, а не просто `toBeVisible()`: якщо Garage гостя вже містить
`Audi TT`, `toBeVisible()` пройде навіть тоді, коли збереження не спрацювало.
Перевірка «до — 0, після — рівно 1» ловить і наявні дані, і подвійне
збереження. `await locator.count()` не використовується: він не чекає рендеру.

Не oracle (лише QUESTION / optional): відображення `12000` у картці, текст
toast-повідомлення, вибране значення Brand/Model у формі.

## Кроки тесту (порядок)

1. `home.open()` → `home.loginAsGuest()` → URL + heading Garage.
2. `toHaveCount(0)` для `Audi TT`.
3. `garage.openAddCarForm()` → форма видима.
4. `addCar.selectBrand('Audi')` → очікування опції `TT` → `addCar.selectModel('TT')`.
5. `addCar.fillMileage('12000')` → `toHaveValue('12000')`.
6. `addCar.save()` → форма прихована (якщо підтверджено) → URL Garage →
   `toHaveCount(1)` + `toBeVisible()`.

## Page Object

Кандидати локаторів нижче є ASSUMPTION, доки їх не підтвердять CLI `snapshot` і
`generate-locator`.

`pages/HomePage.ts`:
- `guestLoginButton`: `getByRole('button', { name: /guest log in/i })` — FACT із
  checked-in baseline; у CLI лише звіряється.
- `open()` → `page.goto('/')`; `loginAsGuest()` → click.

`pages/GaragePage.ts`:
- `heading`: `getByRole('heading', { name: /garage/i })` — FACT із baseline.
- `addCarButton`: `getByRole('button', { name: 'Add car', exact: true })`.
- `carEntries(name): Locator`, варіант A: `getByText(name, { exact: true })`,
  якщо snapshot показує `Audi TT` одним текстовим вузлом. Варіант B: контейнер
  картки за role зі snapshot (`listitem` / `article` / `group`) +
  `filter({ hasText: /\bAudi TT\b/ })`.
- Дія: `openAddCarForm()` → click `addCarButton`.

`pages/AddCarModal.ts` — окремий клас, а не частина `GaragePage`:
- форма є окремим контейнером поверх Garage з власним життєвим циклом
  (відкрито → заповнено → закрито);
- усі локатори форми прив'язані до `root`, тож кнопка збереження `Add` не
  конфліктує з `Add car` на сторінці;
- `GaragePage` лишається тонким, а форму можна перевикористати в інших тестах.

Локатори `AddCarModal`:
- `root`: `getByRole('dialog')`; якщо snapshot дає доступне ім'я —
  `getByRole('dialog', { name: <ім'я зі snapshot> })`. Ім'я не вигадується.
- Brand/Model, варіант A (native select): `root.getByLabel('Brand')` /
  `root.getByLabel('Model')` або `root.getByRole('combobox', { name: /brand/i })`.
  Дія: `selectOption({ label })`.
- Brand/Model, варіант B (кастомний dropdown): toggle за role зі snapshot +
  пункт `getByRole('option' | 'menuitem' | 'button', { name, exact: true })`.
- `modelOption(name): Locator` — щоб spec міг дочекатися `TT` після вибору Audi.
- `mileageInput`: `root.getByLabel('Mileage')` — ASSUMPTION: числове поле з
  label; роль `spinbutton` підтверджується snapshot.
- `saveButton`: `root.getByRole('button', { name: 'Add', exact: true })` —
  ASSUMPTION; можливе ім'я `Save`. `exact: true` обов'язковий.
- Дії: `selectBrand()`, `selectModel()`, `fillMileage()`, `save()`.

## Джерела контракту

- Сценарій, дані й очікування: `specs/add-car.md`.
- Правила Brand, Model, Mileage: `specs/add-car.md` посилається на
  `cases/qauto/requirements/add-car.md`. **Цього файлу в проєкті немає.** Тому
  правила валідації невідомі й не перевіряються (див. QUESTION).
- Locator `Guest log in`, URL `/panel/garage`, heading `Garage`:
  `tests/guest-garage.spec.ts`, `specs/guest-garage.md`.
- Ознаки UI-елементів: лише Playwright CLI `snapshot` / `generate-locator` у
  сесії `lecture07` після `APPROVE CLI INSPECTION`. Якщо UI їх не підтверджує,
  агент повертає `ASSUMPTION` + `STOP`.
- Результат запуску: лише фактичний terminal output Playwright Test.

## Blocker-умови (STOP)

- Немає кнопки `Add car`, або вона disabled для гостя.
- `Audi` немає серед Brand або `TT` не з'являється в Model після вибору Audi.
  Дані не змінюються на іншу пару без рішення людини.
- `12000` відхиляється валідацією, кнопка збереження лишається disabled або
  форма показує помилку. Правило не вигадується, бо файл правил відсутній.
- Після збереження `Audi TT` не з'являється, або URL не Garage.
- Precondition `toHaveCount(0)` падає: Garage гостя вже містить `Audi TT`. Тоді
  `STOP` + `QUESTION` (спільні гостьові дані?), без переходу на `.first()`.
- Brand, Model, Mileage, кнопка збереження чи картка не мають стабільної role або
  доступного імені. Тоді `ASSUMPTION` + `STOP` + `QUESTION`, без CSS/XPath.
- Model не оновлюється після вибору Audi (падає web-first assertion). Fixed wait
  не додається; аналізуються trace і report.
- Strict mode violation (дубль `Add`, `Audi TT`, `Garage`): звузити scope через
  `root` або role-контейнер зі snapshot, `.first()` не використовувати.
- `CLI SETUP BLOCKER` або auth/network error.

## ASSUMPTION / RISK / QUESTION

- ASSUMPTION: дані гостя ізольовані в межах browser context; кожен тест (і
  retry) стартує з Garage без `Audi TT`.
- ASSUMPTION: форма — dialog; Brand/Model — native select; Mileage — числове поле
  з label `Mileage`; кнопка збереження — `Add`. Усе підтверджує лише CLI snapshot.
- ASSUMPTION: форма закривається після успішного збереження.
- RISK: Audi/TT можуть бути значеннями за замовчуванням. Тест усе одно обирає їх
  явно, але залежність Model від Brand тоді не буде помітна.
- RISK: CLI-сесія `lecture07` теж додає `Audi TT`. Якщо гостьові дані спільні на
  сервері, тест упаде на precondition `toHaveCount(0)` — це очікуваний сигнал,
  а не дефект тесту.
- RISK: у гостя може бути ліміт кількості авто.
- RISK: `retries: 1` у config може приховати flaky-падіння; статус `flaky`
  фіксується в evidence як є.
- RISK: `getByText('Audi TT', { exact: true })` не знайде запис, якщо Brand і
  Model рендеряться в окремих елементах.
- QUESTION: де взяти `cases/qauto/requirements/add-car.md` (діапазон Mileage,
  обов'язкові поля, список моделей Audi)? Без нього правила не перевіряються.
- QUESTION: чи перевіряти `12000` у картці авто? Наразі ні — цього немає в
  `specs/add-car.md`.
- QUESTION: чи потрібен cleanup (видалення `Audi TT`) після тесту? Наразі ні —
  видалення поза scope.
- PENDING DECISION: додати `"pages/**/*.ts"` до `include` у `tsconfig.json`.
  Потрібен окремий дозвіл людини.
