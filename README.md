# VelHamster Forum — локальный запуск и публикация

## 1. Запуск на Windows
1. Установите Node.js LTS: https://nodejs.org/
2. Откройте PowerShell в папке проекта.
3. Выполните `npm.cmd install`.
4. Запустите `npm.cmd run dev`.
5. Откройте адрес, который покажет Vite (обычно http://localhost:5173).

Если PowerShell блокирует `npm`, используйте команды с `.cmd` в конце.

## 2. Добавление логотипа
Положите свой JPG-файл в папку `public` и назовите его строго `logo.jpg`.
Путь должен получиться таким: `public/logo.jpg`. Логотип автоматически появится в шапке и окне входа.

## 3. Подключение Firebase
1. Откройте https://console.firebase.google.com/ и создайте проект.
2. В проекте нажмите Add app → Web (значок `</>`), зарегистрируйте приложение.
3. Скопируйте объект `firebaseConfig` из Firebase Console.
4. Откройте `src/main.js` и замените значения-заглушки в объекте `firebaseConfig` на свои значения.
5. Firebase Console → Authentication → Get started → Sign-in method. Включите Google и Email/Password.
6. Для Google проверьте, что выбрано имя проекта и адрес поддержки.
7. Firebase Console → Firestore Database → Create database. Для тестов можно начать в test mode, но перед публикацией обязательно установите безопасные правила из `firestore.rules` и проверьте их.
8. Authentication → Settings → Authorized domains: добавьте `localhost` для локального теста. После публикации добавьте домен сайта.
9. Перезапустите `npm.cmd run dev` после изменения конфигурации.

### Apple ID
Вход через Apple требует настройки Apple Developer (Service ID, Team ID, Key ID и private key) и настройки провайдера Apple в Firebase. Одного нажатия кнопки недостаточно. Не публикуйте private key и другие секреты в GitHub. Сначала рекомендуется проверить Google и Email/Password.

## 4. GitHub и Vercel
1. Создайте репозиторий на https://github.com/.
2. Не загружайте `node_modules`, `.env` или секретные ключи. `.gitignore` уже исключает `node_modules`.
3. Загрузите файлы проекта в репозиторий (можно через GitHub → Add file → Upload files).
4. На https://vercel.com/ выберите Add New → Project и импортируйте репозиторий GitHub.
5. Для Vite обычно используются Build Command `npm run build` и Output Directory `dist`.
6. После публикации добавьте выданный домен Vercel в Firebase Authentication → Authorized domains.

## Примечание
Firebase Web config идентифицирует приложение, но не заменяет правила безопасности. Не добавляйте секретные ключи в клиентский код. Перед реальным запуском проверьте Firestore Security Rules и права доступа.
