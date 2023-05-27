import Excel from 'exceljs';
import path from 'path';

import { statSync } from 'fs';

import { MethodInputData } from '../../types/Methods/MethodInputData';

import { ParseScheduleResponse } from '../../types/Responses/schedule/ParseScheduleResponse';

type ScheduleData = {
  filename: string
  className: string
  isPreview: boolean
}

async function parseSchedule({ req, res }: MethodInputData) {
  if (!req.body) {
    const response: ParseScheduleResponse = {
      status: false,
      error: 'Не введены filename и className',
      isPreview: false,
    };
    return res.json(response);
  }

  const { filename, className, isPreview }: ScheduleData = req.body;
  if (!filename || !className || (!isPreview && typeof isPreview !== 'boolean')) {
    const response: ParseScheduleResponse = {
      status: false,
      error: 'Название файла и имя класса не введены.',
      isPreview,
    };
    return res.json(response);
  }

  try {
    const workbook = new Excel.Workbook();

    const filePath = path.resolve(__dirname, '../../../files/schedule', filename);
    await workbook.xlsx.readFile(filePath);

    let classColumn = 0;

    // поиск столбца класса
    workbook.worksheets[0].columns.map((column, index) => {
      const columnValues = column.values;
      if (!columnValues) return;

      const foundClassColumn = columnValues.find((value) => {
        const stringValue = String(value);

        if (stringValue.toLowerCase() === className.toLowerCase()) return true;
        return false;
      });

      if (foundClassColumn && !classColumn) return classColumn = index;
    });

    // ошибка если класс не найден
    if (!classColumn) {
      console.log('error parseSchedule', 'no class column', filename);

      const response: ParseScheduleResponse = {
        status: false,
        error: `Не удалось найти столбец класса ${className}.\nПри добавлении класса, буква должна быть точно такая же, как и в табличном расписании, т.е. с учётом регистра.\n\nНапример, в расписании указано 9б, значит вы должны указать именно 9б, а не 9Б`,
        filename,
        isPreview,
      };
      return res.json(response);
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

      if (lessonsArr[i] && lesson.toLowerCase() === className.toLowerCase() && !startString) {
        startString = i + 2;
      }
    }

    // сопоставление времени, предмета и кабинета в объект и добавление в массив + понимание когда начинаются уроки
    const preResult = [];
    let startTime = '';
    let room = '';

    for (let i = 0; i < timeArr.length; i++) {
      if (!timeArr[i] && !lessonsArr[i] && !classRoomsArr[i]) continue;
      if (i < startString) continue;
      if (timeArr[i] === 'Время' || lessonsArr[i] === 'Предмет' || classRoomsArr[i] === 'Каб.' || lessonsArr.includes('смена')) continue;
      if (lessonsArr[i] && !startTime.length) {
        const time = timeArr[i] as string;
        startTime = time.split('-')[0];
      }
      if (classRoomsArr[i] && !room) {
        room = String(classRoomsArr[i]!);
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
    let date: string | null;

    try {
      const splittedFilenameBySpaces = filename.split('_').join(' ').split(' ').join(' ');
      const splitted = splittedFilenameBySpaces.split(' ');

      date = splitted.length > 3 ? `${splitted[2]} ${splitted[3]}`.replace('.xlsx', '') : splitted[2].replace('.xlsx', '');
      if (splittedFilenameBySpaces.startsWith('изменения в расписании на')) {
        date = splitted[4];
        if (splitted[5]) date = `${splitted[4]} ${splitted[5]}`;
        date = date.replace('.xlsx', '');
      }
    } catch (error) {
      console.log('ошибка при получении даты расписания ParseSchedule', error, filename);
      date = null;
    }

    const objectedSchedule = schedule.map((scheduleString) => {
      const [time, lesson, room] = scheduleString.split(' - ');
      return { time, lesson: lesson === '-' ? null : lesson, room: room === undefined ? null : room };
    });

    const fileStats = statSync(filePath);

    const returning: ParseScheduleResponse['schedule'] = {
      distant: false,
      schedule,
      objectedSchedule,
      startTime,
      totalLessons,
      date,
      filename,
      room,
      creationTime: Math.floor(fileStats.mtimeMs),
    };

    console.log(`Расписание "${filename}" успешно спарщено.`);

    const response: ParseScheduleResponse = {
      status: true,
      filename,
      schedule: returning,
      isPreview,
    };
    return res.json(response);
  } catch (error) {
    console.log('Ошибка в parseSchedule', error);

    const response: ParseScheduleResponse = {
      status: false,
      filename,
      error: `${error}`,
      isPreview,
    };
    return res.json(response);
  }
}

export default parseSchedule;
