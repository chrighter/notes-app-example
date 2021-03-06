'use strict';

// Удобно разделять зависимости на три группы
// В первой – встроенные модули Node.js в алфавитном порядке
const path = require('path')

// Во второй – сторонние модули
const bodyParser = require('body-parser');
const config = require('config');
const express = require('express');
const hbs = require('hbs');
const morgan = require('morgan');

// В третьей – собственные модули
const Note = require('./models/note');
const notes = require('./mocks/notes');
const routes = require('./routes');

// Заполняем модели данными, заготовленными в JSON формате
for (const note of notes) {
    new Note(note).save();
}

// Создаём экземпляр приложения
const app = express();

// Определяем директорию для хранения шаблонов.
// Для работы с директориями всегда используем модуль «path»
// и преобразуем относительные пути в абсолютные
const viewsDir = path.join(__dirname, 'views');

// Определяем директорию для хранения отдельных частей шаблонов
const partialsDir = path.join(viewsDir, 'partials');

// Определяем директорию для статичных файлов (изображений, стилей и скриптов)
const publicDir = path.join(__dirname, 'public');

// Подключаем шаблонизатор
app.set('view engine', 'hbs');

// Подключаем директорию с шаблонами
app.set('views', viewsDir);

// Логируем запросы к приложению в debug-режиме
if (config.get('debug')) {
    app.use(morgan('dev'));
}

// Отдаём статичные файлы из соответствующей директории
app.use(express.static(publicDir));

// Разбираем тело POST запроса, чтобы сохранить заметку
// Запрос приходит в JSON формате, поэтому используем json-парсер
app.use(bodyParser.json());

// Выводим ошибку, если не смогли разобрать POST запрос, и продолжаем работу
app.use((err, req, res, next) => {
    console.error(err.stack);

    next();
});

// Собираем общие данные для всех страниц приложения
app.use((req, res, next) => {
    // Хранение в res.locals – рекомендованный способ
    // Не перезаписываем, а дополняем объект
    res.locals.meta = {
        charset: 'utf-8',
        description: 'Awesome notes'
    };

    res.locals.title = 'Awesome notes';

    next();
});

// Подключаем маршруты
routes(app);

// Фиксируем фатальную ошибку и отправляем ответ с кодом 500
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.sendStatus(500);
});

// Подключаем директорию с отдельными частями шаблонов
// Этот метод асинхронный и мы запускаем сервер только после того,
// как все частичные шаблоны будут прочитаны
hbs.registerPartials(partialsDir, () => {
    // Запускаем сервер на порту 8080
    app.listen(8080, () => {
        console.info('Open http://localhost:8080/notes');
    });
})
