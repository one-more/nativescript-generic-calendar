import {CalendarEventData, CellData, NormalizedEvents} from "~/components/calendar/models";
import {max} from "moment";

export function daysInMonth(monthNum: number, yearNum: number): number {
    return 32 - new Date(yearNum, monthNum, 32).getDate();
}

export function getFirstDay(month: number, year: number): number {
    return (new Date(year, month)).getDay();
}

export function minusMonth(date: Date): Date {
    const newDate = new Date(date);
    newDate.setDate(0);
    return newDate
}

export function plusMonth(date: Date): Date {
    const newDate = new Date(date);
    newDate.setDate(32);
    return newDate
}

export function getPrevMonth(month: number, year: number): number {
    const date = new Date(year, month);
    return minusMonth(date).getMonth()
}

export function filterEvents(
    month: number,
    year: number,
    events: CalendarEventData[]
): CalendarEventData[] {
    return events.filter(event => {
        if (event.isRecurrent) {
            return true
        }
        if (event.date) {
            const {date} = event;
            const dateMonth = date.getMonth(), dateYear = date.getFullYear();
            return dateYear == year && dateMonth == month
        }
        if (event.start && event.end) {
            const {start, end} = event;
            const startMonth = start.getMonth(), endMonth = end.getMonth(),
                startYear = start.getFullYear(), endYear = end.getFullYear();
            return (startMonth <= month && startYear <= year) &&
                (endMonth >= month && endYear >= year)
        }
        return false
    })
}

export function generateMonthGrid(
    maxDate: number,
    firstDay: number,
    daysInPrev: number,
    normalizedEvents: NormalizedEvents,
): CellData[][] {
    const grid: CellData[][] = [];
    const dayIndices = [1,2,3,4,5,6,0];
    let date = 1, nextDate = 1;

    for (let row = 0; row < 6; row++) {
        if (date > maxDate) {
            break
        }
        for (let col = 0; col < dayIndices.length; col++) {
            const day = dayIndices[col];

            const cell: CellData = {
                value: "",
                row,
                col,
                isCurrentMonth: false,
                isEvent: false,
                withEvent: false,
            };
            if (row === 0 && (firstDay == 0 && day > 0)) {
                cell.value = String(daysInPrev - 7 + day + 1);
            } else if(row === 0 && (day > 0 && firstDay > day)) {
                cell.value = String(daysInPrev - firstDay + day + 1);
            } else if (date > maxDate) {
                cell.value = String(nextDate);
                nextDate++;
            } else {
                cell.value = String(date);
                cell.isCurrentMonth = true;
                cell.withEvent = Boolean(
                    normalizedEvents.recurrent[day] ||
                    normalizedEvents.dates[date]
                );

                date++;
            }

            if (typeof grid[row] == "undefined") {
                grid[row] = []
            }
            grid[row][col] = cell
        }
    }

    return grid
}

export function yearMonthData(
    month: number,
    year: number,
    events: CalendarEventData[]
): CellData[] {
    const firstDay = getFirstDay(month, year);
    const filteredEvents = filterEvents(month, year, events);
    const daysInPrev = daysInMonth(
        getPrevMonth(month, year), year
    );
    const maxDate = daysInMonth(month, year);
    const normalizedEvents = normalizeEvents(filteredEvents, month, maxDate);
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
        grid.reduce(
            (acc, row) => {
                acc.push(...row);
                return acc
            }, []
        )
    )
}

export function getAdditionalDays(firstDay: number): number {
    if (firstDay == 0) {
        return 6
    }
    return firstDay - 1
}

export function getColForDay(day: number): number {
    return day == 0 ? 6 : day - 1;
}

export function getCol(date: Date): number {
    const day = date.getDay();
    return getColForDay(day)
}

export function getCellNum(date: Date, firstDay: number): number {
    return getAdditionalDays(firstDay) + date.getDate();
}

export function getRow(date: Date, firstDay: number): {cellNum: number, row: number} {
    const cellNum = getCellNum(date, firstDay);
    const row = Math.ceil(cellNum / 7) - 1;
    return {cellNum, row}
}

export function getColForStartEnd(
    date: Date,
    row: number,
    firstDay: number
): number {
    const col = getCol(date);
    if (row == 0) {
        if (firstDay == 0 && col > 0) {
            return 6
        }
        if (col < firstDay) {
            return firstDay - 1
        }
    }
    return col
}

export function getColSpan(
    start: Date,
    end: Date,
    firstDay: number,
    maxDate: number,
    row: number,
    col: number,
): number {
    let colSpan;

    if (start.getMonth() == end.getMonth()) {
        colSpan = Math.abs(
            end.getDate() - start.getDate(),
        ) + 1
    }
    if (end.getMonth() > start.getMonth()) {
        colSpan = (daysInMonth(start.getMonth(), start.getFullYear()) - start.getDate())
             + end.getDate()
    }
    if (end.getMonth() < start.getMonth()) {
        throw new Error(
            "end date for event should be greater than start date",
        )
    }

    const additionalDays = getAdditionalDays(firstDay);
    const resultDay = (row * 7) + (col + colSpan);
    const maxResultDay = additionalDays + maxDate;
    const maxCol = end.getDay() == 0 ? 6 : end.getDay() - 1;
    const startCol = getCol(start), endCol = getCol(end);
    const daysDiff = end.getDate() - start.getDate();

    if (resultDay > maxResultDay) {
        return colSpan - (resultDay - maxResultDay)
    }
    if (col + colSpan > 7) {
        colSpan = (7 - col)
    }
    if (endCol > startCol && daysDiff <= 7) {
        if (col + colSpan > maxCol) {
            colSpan = (maxCol - col) + 1
        }
    }

    return colSpan
}

export function eventCellsData(
    filteredEvents: CalendarEventData[],
    grid: CellData[][],
    firstDay: number,
    maxDay: number,
    month: number,
): CellData[] {
    const cells: CellData[] = [];
    const recurrentEvents = filteredEvents.filter(el => el.isRecurrent);
    const notRecurrentEvents = filteredEvents.filter(el => !el.isRecurrent);

    function push(row: number, col: number, colSpan: number, event): void {
        let cell = grid[row][col];
        if (cell.isCurrentMonth) {
            cells.push({
                ...cell,
                ...event,
                colSpan,
                isEvent: true,
                withEvent: false,
            })
        } else {
            for (let i = col; i < (col + colSpan); i++) {
                cell = grid[row][i];
                if (cell.isCurrentMonth) {
                    cells.push({
                        ...cell,
                        ...event,
                        colSpan: colSpan - i,
                        isEvent: true,
                        withEvent: false,
                    });
                    return
                }
            }
        }
    }

    for (let row = 0; row < grid.length; row++) {
        for (const event of recurrentEvents) {
            let col, colSpan = 1;
            const {date, start, end} = event;
            if (date) {
                col = getCol(date)
            }
            if (start && end) {
                col = getColForStartEnd(start, row, firstDay);
                colSpan = getColSpan(start, end, firstDay, maxDay, row, col)
            }

            push(row, col, colSpan, event)
        }
    }

    for (const event of notRecurrentEvents) {
        const {date, start, end} = event;
        let row, col, colSpan;
        if (date) {
            const res = getRow(date, firstDay);
            const cellNum = res.cellNum;
            row = res.row;
            col = (cellNum % 7 || 7) - 1;
        }
        if (start && end) {
            const startMonth = start.getMonth();
            const endMonth = end.getMonth();
            let fromDate: number;

            if (startMonth < month) {
                col = getColForDay(firstDay);
                row = 0;
                fromDate = 1
            } else {
                col = getCol(start);
                const res = getRow(start, firstDay);
                row = res.row;
                fromDate = start.getDate()
            }

            if (endMonth > month) {
                colSpan = (maxDay - fromDate) + 1
            } else {
                colSpan = (end.getDate() - fromDate) + 1
            }

            while (col + colSpan > 7) {
                const tmpColSpan = 7 - col;
                push(
                    row,
                    col,
                    tmpColSpan,
                    event,
                );
                row++;
                col = 0;
                colSpan -= tmpColSpan
            }
        }

        push(row, col, colSpan, event)
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
        dates: {}
    };
    function onRecurrentStartEnd(event: CalendarEventData) {
        const {start, end} = event;
        const startDay = start.getDay(), endDay = end.getDay();
        const minDay = Math.min(startDay, endDay),
            maxDay = Math.max(startDay, endDay);
        for (let i = minDay; i <= maxDay; i++) {
            normalized.recurrent[i] = true
        }
    }
    function onStartEnd(event: CalendarEventData) {
        const {start, end} = event;
        let startDate = start.getDate(),
            endDate = end.getDate();

        if (start.getMonth() < month) {
            startDate = 1
        }
        if (end.getMonth() > month) {
            endDate = maxDate
        }
        for (let i = startDate; i <= endDate; i++) {
            normalized.dates[i] = true
        }
    }
    for (const event of filteredEvents) {
        if (event.isRecurrent) {
            if (event.date) {
                normalized.recurrent[event.date.getDay()] = true
            }
            if (event.start && event.end) {
                onRecurrentStartEnd(event)
            }
        } else {
            if (event.date) {
                normalized.dates[event.date.getDate()] = true
            }
            if (event.start && event.end) {
                onStartEnd(event)
            }
        }
    }
    return normalized
}