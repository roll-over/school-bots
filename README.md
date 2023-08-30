# OWS Events Afisha Writer

OWS Events Afisha Writer is a TypeScript project designed to automate the publication of events on various messengers and social platforms.

## Installation

1. Make sure you have Node.js (version 20 and above) and npm (Node Package Manager) installed.

2. Clone the repository:

```bash
git clone https://github.com/your-username/ows-events-afisha-writer.git
cd ows-events-afisha-writer
```

3. Install the dependencies:

```bash
npm install
```

## Configuration

1. Create a `.env` file in the root directory of the project and fill it with the necessary environment variables:

```env
DISCORD_TOKEN=your_Discord_token
TELEGRAM_TOKEN=your_Telegram_token
MONGO_DB_URL=your_MongoDB_database_URL
```

2. Configure the `tsconfig.json` and `package.json` files according to your needs (e.g., ECMAScript version and dependencies).

3. If needed, adjust the `tsconfig.json` for more specific TypeScript compilation settings.

## Running the Application

1. Start the MongoDB container:

```bash
docker-compose up -d mongo
```

2. Launch MongoDB Express (web client for MongoDB):

```bash
docker-compose up -d mongo-express
```

3. Run your application:

```bash
docker-compose up -d mock-interview
```

## Maintenance

- To add new events and publish them on messengers, modify the code in the `src` directory of your project.

- If you need to update dependencies, use the command:

```bash
npm update
```

## Contribution

Feel free to contribute to the project's development. You can create pull requests or ask questions related to the project in the "Issues" section.

## License

This project is distributed under the ISC License. Additional information can be found in the `LICENSE` file.

---

# OWS Events Afisha Writer

OWS Events Afisha Writer - это проект на TypeScript, предназначенный для автоматизации публикации событий на различных мессенджерах и социальных платформах.

## Установка

1. Убедитесь, что у вас установлен Node.js (версия 20 и выше) и npm (Node Package Manager).

2. Клонируйте репозиторий:

```bash
git clone https://github.com/ваш-логин/ows-events-afisha-writer.git
cd ows-events-afisha-writer
```

3. Установите зависимости:

```bash
npm install
```

## Настройка

1. Создайте файл `.env` в корневой директории проекта и заполните его необходимыми переменными окружения:

```env
DISCORD_TOKEN=ваш_токен_Discord
TELEGRAM_TOKEN=ваш_токен_Telegram
MONGO_DB_URL=URL_вашей_MongoDB_базы_данных
```

2. Настройте файлы `tsconfig.json` и `package.json` согласно вашим потребностям (например, версию ECMAScript и зависимости).

3. При необходимости настройте `tsconfig.json` для более специфических параметров компиляции TypeScript.

## Запуск приложения

1. Запустите контейнер MongoDB:

```bash
docker-compose up -d mongo
```

2. Запустите MongoDB Express (веб-клиент для MongoDB):

```bash
docker-compose up -d mongo-express
```

3. Запустите ваше приложение:

```bash
docker-compose up -d mock-interview
```

## Обслуживание

- Чтобы добавить новые события и опубликовать их в мессенджерах, измените код в директории `src` вашего проекта.

- Если необходимо обновить зависимости, используйте команду:

```bash
npm update
```

## Вклад

Не стесняйтесь вносить свой вклад в развитие проекта. Вы можете создавать pull-запросы или задавать вопросы, связанные с проектом, в разделе "Issues".

## Лицензия

Этот проект распространяется под лицензией ISC. Дополнительную информацию можно найти в файле `LICENSE`.
