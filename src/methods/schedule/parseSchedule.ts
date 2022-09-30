import Excel from 'exceljs';
import path from 'path';

import {statSync} from 'fs';

import {MethodInputData} from '../../types/methods/MethodInputData';

type ScheduleData = {
  filename: string
  className: string
}

async function parseSchedule({req, res}: MethodInputData) {
  try {
    if (!req.body) {
      res.json({
        status: false,
        message: 'Не введены filename и className',
      });
    }

    const {filename, className}: ScheduleData = req.body;
    if (!filename || !className) {
      return res.json({
        status: false,
        message: 'Название файла и имя класса не введены.',
      });
    }

    const workbook = new Excel.Workbook();

    const filePath = path.resolve(__dirname, '../../files/schedule', filename);
    await workbook.xlsx.readFile(filePath);

    let classColumn = 0;

    // поиск столбца класса
    workbook.worksheets[0].columns.map((column, index) => {
      if (column.values!.find((e) => e === className) && !classColumn) return classColumn = index;
    });

    // ошибка если класс не найден
    if (!classColumn) {
      console.log('error parseSchedule', 'no class column', filename);
      return res.json({
        status: false,
        message: `Не удалось найти столбец класса ${className}.\nПри добавлении класса буква должна быть такая же, как и в табличном расписании, т.е с учётом регистра.`,
        filename,
      });
    }

    // масcивы информации
    let timeArr = workbook.worksheets[0].columns[2].values!;
    let lessonsArr = workbook.worksheets[0].columns[classColumn].values!;
    let classRoomsArr = workbook.worksheets[0].columns[classColumn + 1].values!;

    const firstSchoolShift = timeArr.findIndex((time) => time === '1 смена');
    const secondSchoolShift = workbook.worksheets[0].columns[11].values!.findIndex((time) => time === '2 смена');

    // отделение ненужных элементов до 1 смены
    timeArr = timeArr.slice(firstSchoolShift, secondSchoolShift);
    lessonsArr = lessonsArr.slice(firstSchoolShift, secondSchoolShift);
    classRoomsArr = classRoomsArr.slice(firstSchoolShift, secondSchoolShift);

    // три for для нормального обозначения пустых элементов
    for (let i = 0; i < timeArr.length; i++) {
      if (timeArr[i] === null || timeArr[i] === undefined) {
        // @ts-ignore
        timeArr[i] = null;
      }
    }

    for (let i = 0; i < lessonsArr.length; i++) {
      if (lessonsArr[i] === null || lessonsArr[i] === undefined) {
        // @ts-ignore
        lessonsArr[i] = null;
      }
    }

    for (let i = 0; i < classRoomsArr.length; i++) {
      if (classRoomsArr[i] === null || classRoomsArr[i] === undefined) {
        // @ts-ignore
        classRoomsArr[i] = null;
      }
    }

    // поиск строки где начинается все нужная информация
    let startString = 0;

    for (let i = 0; i < lessonsArr.length; i++) {
      const lesson = lessonsArr[i] as string;

      if (lessonsArr[i] && lesson === className && !startString) {
        startString = i + 2;
      }
    }

    // сопоставление времени, предмета и кабинета в обьект и добавление в массив + понимание когда начинаются уроки
    const preResult = [];
    let startTime = '';
    let room = 0;

    for (let i = 0; i < timeArr.length; i++) {
      if (!timeArr[i] && !lessonsArr[i] && !classRoomsArr[i]) continue;
      if (i < startString) continue;
      if (timeArr[i] === 'Время' || lessonsArr[i] === 'Предмет' || classRoomsArr[i] === 'Каб.' || lessonsArr.includes('смена')) continue;
      if (lessonsArr[i] && !startTime.length) {
        const time = timeArr[i] as string;
        startTime = time.split('-')[0];
      }
      if (classRoomsArr[i] && !room) {
        room = classRoomsArr[i]! as number;
      }
      preResult.push({
        time: timeArr[i],
        lesson: lessonsArr[i],
        room: classRoomsArr[i],
      });
    }

    const formattedResult: string[] = [];
    const checkRepeatingTime: string[] = [];

    preResult.map((res) => {
      const time = res.time as string;

      if (checkRepeatingTime.find((e) => e === time)) return;
      checkRepeatingTime.push(time);

      return formattedResult.push(`${time} - ${res.lesson ? res.lesson : '-'}${res.room && res.room.toString().length <= 10 ? ` - ${res.room}` : ''}`);
    });

    // удаление повторяющихся строк
    const schedule: string[] = [];

    formattedResult.map((r) => {
      const found = schedule.find((e) => e === r);

      if (found) return;
      schedule.push(r);
    });

    // кол-во уроков
    let totalLessons = 0;

    schedule.map((scheduleString) => {
      if (scheduleString.split('-')[2] !== ' ') totalLessons++;
    });

    // получение даты из названия файла
    const splitted = filename.split(' ');
    let date = '';

    try {
      date = splitted.length > 3 ? `${splitted[2]} ${splitted[3]}`.replace('.xlsx', '') : splitted[2].replace('.xlsx', '');
      if (filename.startsWith('изменения в расписании на')) {
        date = splitted[4];
        if (splitted[5]) date = `${splitted[4]} ${splitted[5]}`;
        date = date.replace('.xlsx', '');
      }
    } catch (error) {
      console.log('error parseSchedule', error, filename);
      date = 'неизвестно';
    }

    const objectedSchedule = schedule.map((scheduleString) => {
      const [time, lesson, room] = scheduleString.split(' - ');
      return {time, lesson: lesson === '-' ? null : lesson, room: room === undefined ? null : room};
    });

    const fileStats = statSync(filePath);

    const returning = {
      distant: false,
      schedule,
      objectedSchedule,
      startTime,
      totalLessons,
      date,
      filename,
      room,
      creationTime: Math.floor(fileStats.birthtimeMs),
    };

    console.log(`Расписание "${filename}" успешно спарщено.`);

    res.json({
      status: true,
      message: returning,
    });
  } catch (error) {
    console.log('Ошибка в parseSchedule', error);

    res.json({
      status: false,
      message: `${error}`,
    });
  }
}

export default parseSchedule;