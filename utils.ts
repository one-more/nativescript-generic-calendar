import {
    CalendarEventData,
    CellData,
    NormalizedEvents,
} from '~/components/calendar/models';

export function daysInMonth(
    monthNum: number,
    yearNum: number,
): number {
    return 32 - new Date(yearNum, monthNum, 32).getDate();
}

export function getFirstDay(
    month: number,
    year: number,
): number {
    return new Date(year, month).getDay();
}

export function minusMonth(date: Date): Date {
    const newDate = new Date(date);
    newDate.setDate(0);
    return newDate;
}

export function plusMonth(date: Date): Date {
    const newDate = new Date(date);
    newDate.setDate(32);
    return newDate;
}

export function getPrevMonth(
    month: number,
    year: number,
): number {
    const date = new Date(year, month);
    return minusMonth(date).getMonth();
}

export function filterEvents(
    month: number,
    year: number,
    events: CalendarEventData[],
): CalendarEventData[] {
    return events.filter((event): boolean => {
        if (event.isRecurrent) {
            return true;
        }
        if (event.date) {
            const { date } = event;
            const dateMonth = date.getMonth(),
                dateYear = date.getFullYear();
            return dateYear == year && dateMonth == month;
        }
        if (event.start && event.end) {
            const { start, end } = event;
            const startMonth = start.getMonth(),
                endMonth = end.getMonth(),
                startYear = start.getFullYear(),
                endYear = end.getFullYear();
            return (
                startMonth <= month &&
                startYear <= year &&
                (endMonth >= month && endYear >= year)
            );
        }
        return false;
    });
}

export function generateMonthGrid(
    maxDate: number,
    firstDay: number,
    daysInPrev: number,
    normalizedEvents: NormalizedEvents,
): CellData[][] {
    const grid: CellData[][] = [];
    const dayIndices = [1, 2, 3, 4, 5, 6, 0];
    let date = 1,
        nextDate = 1;

    for (let row = 0; row < 6; row++) {
        if (date > maxDate) {
            break;
        }
        for (let col = 0; col < dayIndices.length; col++) {
            const day = dayIndices[col];

            const cell: CellData = {
                value: '',
                row,
                col,
                isCurrentMonth: false,
                isEvent: false,
                withEvent: false,
            };
            if (row === 0 && (firstDay == 0 && day > 0)) {
                cell.value = String(daysInPrev - 7 + day + 1);
            } else if (
                row === 0 &&
                (day > 0 && firstDay > day)
            ) {
                cell.value = String(
                    daysInPrev - firstDay + day + 1,
                );
            } else if (date > maxDate) {
                cell.value = String(nextDate);
                nextDate++;
            } else {
                cell.value = String(date);
                cell.isCurrentMonth = true;
                cell.withEvent = Boolean(
                    normalizedEvents.recurrent[day] ||
                        normalizedEvents.dates[date],
                );

                date++;
            }

            if (typeof grid[row] == 'undefined') {
                grid[row] = [];
            }
            grid[row][col] = cell;
        }
    }

    return grid;
}

const dayNumToColMap = {
    1: 0,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    0: 6,
};

export function eventCellsData(
    filteredEvents: CalendarEventData[],
    grid: CellData[][],
    firstDay: number,
    maxDay: number,
    month: number,
): CellData[] {
    const cells: CellData[] = [];
    const recurrentEvents = filteredEvents.filter(
        (el): boolean => el.isRecurrent,
    );
    const notRecurrentEvents = filteredEvents.filter(
        (el): boolean => !el.isRecurrent,
    );

    recurrentEvents.sort(function(
        a: CalendarEventData,
        b: CalendarEventData,
    ): number {
        return (
            dayNumToColMap[(a.date || a.start).getDay()] -
            dayNumToColMap[(b.date || b.start).getDay()]
        );
    });
    notRecurrentEvents.sort(function(
        a: CalendarEventData,
        b: CalendarEventData,
    ): number {
        return (
            (a.date || a.start).getDate() -
            (b.date || b.start).getDate()
        );
    });

    function push(
        row: number,
        col: number,
        colSpan: number,
        event,
    ): void {
        let cell = grid[row][col];
        if (cell.isCurrentMonth) {
            cells.push({
                ...cell,
                ...event,
                colSpan,
                isEvent: true,
                withEvent: false,
            });
        }
    }

    for (let row = 0; row < grid.length; row++) {
        for (const event of recurrentEvents) {
            let col,
                colSpan = 1;
            const { date, start, end } = event;

            if (date) {
                col = dayNumToColMap[date.getDay()];
            }
            if (start && end) {
                col = dayNumToColMap[start.getDay()];
                const maxCol = dayNumToColMap[end.getDay()];

                while (
                    grid[row][col] &&
                    !grid[row][col].isCurrentMonth &&
                    col < maxCol
                ) {
                    col++;
                }

                for (let i = col; i < maxCol; i++) {
                    const cell = grid[row][i + 1];
                    if (cell.isCurrentMonth) {
                        colSpan++;
                    }
                }
            }

            push(row, col, colSpan, event);
        }
    }

    let event = notRecurrentEvents.shift();
    let pushCandidate = {
        col: 0,
        colSpan: 0,
        event: null,
    };
    const maxCol = grid[0].length - 1;
    for (let row = 0; row < grid.length; row++) {
        if (!event) {
            break;
        }

        for (let col = 0; col < grid[row].length; col++) {
            if (!event) {
                break;
            }

            const cell = grid[row][col];
            const cellValue = Number(cell.value);
            const { date, start, end } = event;

            if (date && date.getDate() == cellValue) {
                push(row, col, 1, event);

                pushCandidate.col = 0;
                pushCandidate.colSpan = 0;
                pushCandidate.event = null;
                event = notRecurrentEvents.shift();
            }
            if (start && end) {
                const maxDate =
                    end.getMonth() == month
                        ? end.getDate()
                        : maxDay;

                if (
                    start.getDate() == cellValue &&
                    start.getMonth() == month
                ) {
                    pushCandidate.col = col;
                    pushCandidate.event = event;
                }
                if (start.getMonth() < month && cellValue == 1) {
                    pushCandidate.col = col;
                    pushCandidate.event = event;
                }

                if (
                    col == maxCol &&
                    cellValue < maxDate &&
                    pushCandidate.event == event
                ) {
                    pushCandidate.colSpan++;
                    push(
                        row,
                        pushCandidate.col,
                        pushCandidate.colSpan,
                        event,
                    );
                    pushCandidate.col = 0;
                    pushCandidate.colSpan = 0;
                }
                if (
                    pushCandidate.event == event &&
                    col < maxCol &&
                    cellValue < maxDate
                ) {
                    pushCandidate.colSpan++;
                }
                if (
                    pushCandidate.event == event &&
                    cellValue == maxDate
                ) {
                    pushCandidate.colSpan++;
                    push(
                        row,
                        pushCandidate.col,
                        pushCandidate.colSpan,
                        event,
                    );

                    pushCandidate.col = 0;
                    pushCandidate.colSpan = 0;
                    pushCandidate.event = null;
                    event = notRecurrentEvents.shift();
                }
            }
        }
    }

    return cells;
}

export function normalizeEvents(
    filteredEvents: CalendarEventData[],
    month: number,
    maxDate: number,
): NormalizedEvents {
    const normalized: NormalizedEvents = {
        recurrent: {},
        dates: {},
    };
    function onRecurrentStartEnd(
        event: CalendarEventData,
    ): void {
        const { start, end } = event;
        const startDay = start.getDay(),
            endDay = end.getDay();
        const minDay = Math.min(startDay, endDay),
            maxDay = Math.max(startDay, endDay);
        for (let i = minDay; i <= maxDay; i++) {
            normalized.recurrent[i] = true;
        }
    }
    function onStartEnd(event: CalendarEventData): void {
        const { start, end } = event;
        let startDate = start.getDate(),
            endDate = end.getDate();

        if (start.getMonth() < month) {
            startDate = 1;
        }
        if (end.getMonth() > month) {
            endDate = maxDate;
        }
        for (let i = startDate; i <= endDate; i++) {
            normalized.dates[i] = true;
        }
    }
    for (const event of filteredEvents) {
        if (event.isRecurrent) {
            if (event.date) {
                normalized.recurrent[event.date.getDay()] = true;
            }
            if (event.start && event.end) {
                onRecurrentStartEnd(event);
            }
        } else {
            if (event.date) {
                normalized.dates[event.date.getDate()] = true;
            }
            if (event.start && event.end) {
                onStartEnd(event);
            }
        }
    }
    return normalized;
}

export function yearMonthData(
    month: number,
    year: number,
    events: CalendarEventData[],
): CellData[] {
    const firstDay = getFirstDay(month, year);
    const filteredEvents = filterEvents(month, year, events);
    const daysInPrev = daysInMonth(
        getPrevMonth(month, year),
        year,
    );
    const maxDate = daysInMonth(month, year);
    const normalizedEvents = normalizeEvents(
        filteredEvents,
        month,
        maxDate,
    );
    const grid: CellData[][] = generateMonthGrid(
        maxDate,
        firstDay,
        daysInPrev,
        normalizedEvents,
    );
    const eventCells = eventCellsData(
        filteredEvents,
        grid,
        firstDay,
        maxDate,
        month,
    );

    return eventCells.concat(
        grid.reduce((acc, row): CellData[] => {
            acc.push(...row);
            return acc;
        }, []),
    );
}
