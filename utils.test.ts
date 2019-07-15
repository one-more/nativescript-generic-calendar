import {
    daysInMonth, eventCellsData,
    filterEvents, generateMonthGrid,
    getAdditionalDays,
    getCellNum,
    getCol,
    getColForDay,
    getColForStartEnd,
    getColSpan,
    getFirstDay,
    getPrevMonth,
    getRow,
    minusMonth, normalizeEvents,
    plusMonth,
    yearMonthData,
} from "./utils"

describe("calendar logic", () => {
    const months = {
        july: 6,
        september: 8,
        february: 1,
        january: 0,
        may: 4,
        august: 7,
        march: 2,
        june: 5,
        april: 3,
        october: 9,
        november: 10,
    };
    const firstMonth = 0;
    const lastMonth = 0;
    const snapshotWithoutEvents = require("./snapshot.json");
    const year = 2019;

    function withLeadingZeroes(num: number) {
        return ("0" + num).slice(-2)
    }

    function createDate(year: number, month: number, date: number): Date {
        const res = new Date;
        res.setFullYear(year);
        res.setMonth(month);
        res.setDate(date);
        return res
    }

    test("daysInMonth", () => {
        expect(
            daysInMonth(months.july, year)
        ).toBe(31);
        expect(
            daysInMonth(months.september, year)
        ).toBe(30);
        expect(
            daysInMonth(months.february, year)
        ).toBe(28)
    });

    test("getFirstDay", () => {
        expect(
            getFirstDay(
                months.september, year
            )
        ).toBe(0);
        expect(
            getFirstDay(
                months.july, year
            )
        ).toBe(1);
        expect(
            getFirstDay(
                months.january, year
            )
        ).toBe(2);
        expect(
            getFirstDay(
                months.may, year
            )
        ).toBe(3);
        expect(
            getFirstDay(
                months.august, year
            )
        ).toBe(4);
        expect(
            getFirstDay(
                months.march, year
            )
        ).toBe(5);
        expect(
            getFirstDay(
                months.june, year
            )
        ).toBe(6);
    });

    test("minusMonth", () => {
        let date = new Date(year, 11);
        for (let month = 11; month >= 0; month--) {
            expect(
                date.getMonth()
            ).toBe(month);
            date = minusMonth(date)
        }
    });

    test("plusMonth", () => {
        let date = new Date(year, 0);
        for (let month = 0; month < 12; month++) {
            expect(
                date.getMonth()
            ).toBe(month);
            date = plusMonth(date)
        }
    });

    test("getPrevMonth", () => {
        let month = 11;
        for (let i = month; i >= 0; i--) {
            expect(month).toBe(i);
            month = getPrevMonth(month, year)
        }
    });

    test("filterEvents recurrent", () => {
        const month = 6;
        const events = [
            {
                date: new Date(),
                isRecurrent: true,
            },
            {
                start: new Date(year, month, 1),
                end: new Date(year, month, 5),
                isRecurrent: true,
            },
            {
                date: new Date(year - 1, month),
                isRecurrent: true,
            },
            {
                date: new Date(year + 1, month),
                isRecurrent: true,
            },
        ];
        expect(
            filterEvents(month, year, events)
        ).toStrictEqual(events)
    });

    test("filterEvents not recurrent", () => {
        const month = 6;
        const expectedEvents = [
            {
                date: new Date(year, month, 1),
            },
            {
                start: new Date(year, month, 1),
                end: new Date(year, month, 5),
            },
            {
                start: new Date(year, month, 28),
                end: new Date(year, month, 31),
            },
            {
                start: new Date(year, month - 1, 28),
                end: new Date(year, month, 5),
            },
            {
                start: new Date(year, month, 28),
                end: new Date(year, month + 1, 5),
            },
        ];
        const notExpectedEvents = [
            {
                date: new Date(year - 1),
            },
            {
                date: new Date(year + 1),
            },
            {
                start: new Date(year, lastMonth, 30),
                end: new Date(year + 1, firstMonth, 5),
            },
            {
                start: new Date(year - 1, lastMonth, 30),
                end: new Date(year, firstMonth, 5),
            },
            {
                date: new Date(year, firstMonth, 1),
            },
            {
                date: new Date(year, lastMonth, 1),
            },
            {
                start: new Date(year, firstMonth, 1),
                end: new Date(year, firstMonth, 5),
            },
            {
                start: new Date(year, lastMonth, 1),
                end: new Date(year, lastMonth, 5),
            },
            {
                start: new Date(year, firstMonth, 1),
                end: new Date(year, lastMonth, 5),
            },
        ];

        expect(
            filterEvents(
                month,
                year,
                expectedEvents.concat(notExpectedEvents),
            )
        ).toStrictEqual(expectedEvents);
    });

    test("filterEvents mixed", () => {
        const month = 6;
        const expectedEvents = [
            {
                date: new Date(year, month, 1),
            },
            {
                start: new Date(year, month, 1),
                end: new Date(year, month, 5),
            },
            {
                start: new Date(year, month, 28),
                end: new Date(year, month, 31),
            },
            {
                start: new Date(year, month - 1, 28),
                end: new Date(year, month, 5),
            },
            {
                start: new Date(year, month, 28),
                end: new Date(year, month + 1, 5),
            },
            {
                date: new Date(),
                isRecurrent: true,
            },
            {
                start: new Date(year, month, 1),
                end: new Date(year, month, 5),
                isRecurrent: true,
            },
            {
                date: new Date(year - 1, month),
                isRecurrent: true,
            },
            {
                date: new Date(year + 1, month),
                isRecurrent: true,
            },
        ];
        const notExpectedEvents = [
            {
                date: new Date(year - 1),
            },
            {
                date: new Date(year + 1),
            },
            {
                start: new Date(year, lastMonth, 30),
                end: new Date(year + 1, firstMonth, 5),
            },
            {
                start: new Date(year - 1, lastMonth, 30),
                end: new Date(year, firstMonth, 5),
            },
        ];

        expect(
            filterEvents(
                month,
                year,
                expectedEvents.concat(notExpectedEvents),
            )
        ).toStrictEqual(expectedEvents);
    });

    test("filter invalid events", () => {
        const month = months.july;
        const events = [
            {
                date: null,
            },
            {
                start: null,
                end: createDate(month, year, 1)
            },
            {
                start: createDate(month, year, 1),
                end: null,
            }
        ];
        expect(
            filterEvents(month, year, events)
        ).toStrictEqual([])
    });

    test("yearMonthData without events", () => {
        for (let month = 0; month < 12; month++) {
            expect(
                yearMonthData(month, year, [])
            ).toStrictEqual(snapshotWithoutEvents[year][month])
        }
    });

    test("yearMonthData with recurrent events", () => {
        const WHOLE_WEEK = "WHOLE_WEEK", THREE_TIMES = "THREE_TIMES";
        const dateForMonday = new Date(year, months.september, 2);
        const dateForThursday = new Date(year, months.september, 5);
        const dateForSaturday = new Date(year, months.september, 7);
        const dateForSunday = new Date(year, months.september, 1);
        const eventsWholeWeek = [
            {
                start: dateForMonday,
                end: dateForSaturday,
                isRecurrent: true,
            },
            {
                date: dateForSunday,
                isRecurrent: true,
            },
        ];
        const eventsThreeTimes = [
            {
                date: dateForMonday,
                isRecurrent: true,
            },
            {
                date: dateForThursday,
                isRecurrent: true,
            },
            {
                date: dateForSaturday,
                isRecurrent: true,
            },
        ];
        const snapshot = require("./recurrent.snapshot.json");

        expect(
            dateForMonday.getDay()
        ).toBe(1);
        expect(
            dateForThursday.getDay()
        ).toBe(4);
        expect(
            dateForSaturday.getDay()
        ).toBe(6);
        expect(
            dateForSunday.getDay()
        ).toBe(0);

        for (let month = 0; month < 12; month++) {
            expect(
                JSON.parse(
                    JSON.stringify(
                        yearMonthData(
                            month,
                            year,
                            eventsWholeWeek
                        )
                    )
                )
            ).toStrictEqual(
                snapshot[year][WHOLE_WEEK][month]
            );

            expect(
                JSON.parse(
                    JSON.stringify(
                        yearMonthData(
                            month,
                            year,
                            eventsThreeTimes,
                        )
                    )
                )
            ).toStrictEqual(snapshot[year][THREE_TIMES][month])
        }
    });

    test(
        "yearMonthData not recurrent event full february " + year,
        () => {
            const month = months.february;
            const monthData = snapshotWithoutEvents[year][month];
            const events = [
                {
                    start: new Date(year, month, 1),
                    end: new Date(year, month, 28),
                }
            ];
            const expectedEvents = [
                {
                    ...monthData[4],
                    ...events[0],
                    isEvent: true,
                    colSpan: 3,
                },
                {
                    ...monthData[7],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[14],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[21],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[28],
                    ...events[0],
                    isEvent: true,
                    colSpan: 4,
                },
            ];

            expect(
                yearMonthData(month, year, events)
            ).toStrictEqual(
                expectedEvents.concat(
                    monthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth,
                    }))
                )
            )
        }
    );

    test(
        "yearMonthData not recurrent event full september " + year,
        () => {
            const month = months.september;
            const monthData = snapshotWithoutEvents[year][month];
            const events = [
                {
                    start: new Date(year, month, 1),
                    end: new Date(year, month, 30),
                }
            ];

            const expectedEvents = [
                {
                    ...monthData[6],
                    ...events[0],
                    isEvent: true,
                    colSpan: 1,
                },
                {
                    ...monthData[7],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[14],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[21],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[28],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[35],
                    ...events[0],
                    isEvent: true,
                    colSpan: 1,
                },
            ];

            expect(
                yearMonthData(month, year, events)
            ).toStrictEqual(
                expectedEvents.concat(
                    monthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth,
                    }))
                )
            )
        }
    );

    test(
        "yearMonthData not recurrent event full april " + year,
        () => {
            const month = months.april;
            const monthData = snapshotWithoutEvents[year][month];
            const events = [
                {
                    start: new Date(year, month, 1),
                    end: new Date(year, month, 30),
                }
            ];

            const expectedEvents = [
                {
                    ...monthData[0],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[7],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[14],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[21],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...monthData[28],
                    ...events[0],
                    isEvent: true,
                    colSpan: 2,
                },
            ];

            expect(
                yearMonthData(month, year, events)
            ).toStrictEqual(
                expectedEvents.concat(
                    monthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth,
                    }))
                )
            )
        }
    );

    test(
        "yearMonthData not recurrent events each day april " + year,
        () => {
            const month = months.april;
            const events: { date: Date }[] = [];
            const monthData = snapshotWithoutEvents[year][month];
            const expectedEvents = [];

            const monthStr = withLeadingZeroes(month + 1);
            for (let date = 1; date <= 30; date++) {
                events.push({
                    date: new Date(
                        `${year}-${monthStr}-${withLeadingZeroes(date)}`
                    )
                })
            }
            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                expectedEvents.push({
                    ...monthData[i],
                    ...event,
                    isEvent: true,
                    colSpan: undefined,
                })
            }

            expect(
                yearMonthData(month, year, events),
            ).toStrictEqual(
                expectedEvents.concat(
                    monthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth,
                    }))
                )
            )
        }
    );

    test(
        "yearMonthData not recurrent events each day september " + year,
        () => {
            const month = months.september;
            const events: { date: Date }[] = [];
            const monthData = snapshotWithoutEvents[year][month];
            const expectedEvents = [];

            const monthStr = withLeadingZeroes(month + 1);
            for (let date = 1; date <= 30; date++) {
                events.push({
                    date: new Date(
                        `${year}-${monthStr}-${withLeadingZeroes(date)}`
                    )
                })
            }

            const septemberAdditionalDays = 6;
            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                expectedEvents.push({
                    ...monthData[i + septemberAdditionalDays],
                    ...event,
                    isEvent: true,
                    colSpan: undefined,
                })
            }

            expect(
                yearMonthData(month, year, events),
            ).toStrictEqual(
                expectedEvents.concat(
                    monthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth,
                    }))
                )
            )
        }
    );

    test(
        "yearMonthData not recurrent events each day february " + year,
        () => {
            const month = months.february;
            const events: { date: Date }[] = [];
            const monthData = snapshotWithoutEvents[year][month];
            const expectedEvents = [];

            const monthStr = withLeadingZeroes(month + 1);
            for (let date = 1; date <= 28; date++) {
                events.push({
                    date: new Date(
                        `${year}-${monthStr}-${withLeadingZeroes(date)}`
                    )
                })
            }

            const septemberAdditionalDays = 4;
            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                expectedEvents.push({
                    ...monthData[i + septemberAdditionalDays],
                    ...event,
                    isEvent: true,
                    colSpan: undefined,
                })
            }

            expect(
                yearMonthData(month, year, events),
            ).toStrictEqual(
                expectedEvents.concat(
                    monthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth,
                    }))
                )
            )
        }
    );

    test(
        "yearMonthData not recurrent event january - february " + year,
        () => {
            const month = months.february;
            const startDate = createDate(year, month - 1, 25);
            const endDate = createDate(year, month, 10);
            const events = [
                {
                    start: startDate,
                    end: endDate,
                }
            ];
            const februaryMonthData = snapshotWithoutEvents[year][month];
            const januaryMonthData = snapshotWithoutEvents[year][month - 1];
            const expectedFebruaryEvents = [
                {
                    ...februaryMonthData[4],
                    ...events[0],
                    colSpan: 3,
                    isEvent: true,
                },
                {
                    ...februaryMonthData[7],
                    ...events[0],
                    colSpan: 7,
                    isEvent: true,
                },
            ];
            const expectedJanuaryEvents = [
                {
                    ...januaryMonthData[25],
                    ...events[0],
                    colSpan: 3,
                    isEvent: true,
                },
                {
                    ...januaryMonthData[28],
                    ...events[0],
                    colSpan: 4,
                    isEvent: true,
                },
            ];

            expect(
                yearMonthData(month, year, events)
            ).toStrictEqual(
                expectedFebruaryEvents.concat(
                    februaryMonthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth && Number(cell.value) <= 10
                    }))
                )
            );

            expect(
                yearMonthData(month - 1, year, events)
            ).toStrictEqual(
                expectedJanuaryEvents.concat(
                    januaryMonthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth && Number(cell.value) >= 25
                    }))
                )
            );
        }
    );

    test(
        "yearMonthData not recurrent event july - august " + year,
        () => {
            const {august, july} = months;
            const startDate = createDate(year, july, 14);
            const endDate = createDate(year, august, 9);
            const events = [
                {
                    start: startDate,
                    end: endDate,
                }
            ];
            const julyMonthData = snapshotWithoutEvents[year][july];
            const augustMonthData = snapshotWithoutEvents[year][august];
            const julyExpectedEvents = [
                {
                    ...julyMonthData[13],
                    ...events[0],
                    isEvent: true,
                    colSpan: 1,
                },
                {
                    ...julyMonthData[14],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...julyMonthData[21],
                    ...events[0],
                    isEvent: true,
                    colSpan: 7,
                },
                {
                    ...julyMonthData[28],
                    ...events[0],
                    isEvent: true,
                    colSpan: 3,
                },
            ];
            const augustExpectedEvents = [
                {
                    ...augustMonthData[3],
                    ...events[0],
                    isEvent: true,
                    colSpan: 4,
                },
                {
                    ...augustMonthData[7],
                    ...events[0],
                    isEvent: true,
                    colSpan: 5,
                },
            ];

            expect(
                yearMonthData(july, year, events),
            ).toStrictEqual(
                julyExpectedEvents.concat(
                    julyMonthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth && Number(cell.value) >= 14,
                    }))
                )
            );

            expect(
                yearMonthData(august, year, events)
            ).toStrictEqual(
                augustExpectedEvents.concat(
                    augustMonthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth && Number(cell.value) <= 9,
                    }))
                )
            )
        }
    );

    test(
        "yearMonthData not recurrent event june - july " + year,
        () => {
            const {june, july} = months;
            const startDate = createDate(year, june, 24);
            const endDate = createDate(year, july, 24);
            const events = [
                {
                    start: startDate,
                    end: endDate,
                }
            ];
            const juneMonthData = snapshotWithoutEvents[year][june];
            const julyMonthData = snapshotWithoutEvents[year][july];

            const juneExpectedEvents = [
                {
                    ...juneMonthData[28],
                    ...events[0],
                    colSpan: 7,
                    isEvent: true,
                },
            ];
            const julyExpectedEvents = [
                {
                    ...julyMonthData[0],
                    ...events[0],
                    colSpan: 7,
                    isEvent: true,
                },
                {
                    ...julyMonthData[7],
                    ...events[0],
                    colSpan: 7,
                    isEvent: true,
                },
                {
                    ...julyMonthData[14],
                    ...events[0],
                    colSpan: 7,
                    isEvent: true,
                },
                {
                    ...julyMonthData[21],
                    ...events[0],
                    colSpan: 3,
                    isEvent: true,
                },
            ];

            expect(
                yearMonthData(june, year, events),
            ).toStrictEqual(
                juneExpectedEvents.concat(
                    juneMonthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth && Number(cell.value) >= 24,
                    }))
                )
            );

            expect(
                yearMonthData(july, year, events),
            ).toStrictEqual(
                julyExpectedEvents.concat(
                    julyMonthData.map(cell => ({
                        ...cell,
                        withEvent: cell.isCurrentMonth && Number(cell.value) <= 24,
                    }))
                )
            )
        }
    );

    test("getAdditionalDays", () => {
        const cases = [
            {
                input: 0,
                expected: 6,
            },
            {
                input: 1,
                expected: 0,
            },
            {
                input: 2,
                expected: 1,
            },
            {
                input: 3,
                expected: 2,
            },
            {
                input: 4,
                expected: 3,
            },
            {
                input: 5,
                expected: 4,
            },
            {
                input: 6,
                expected: 5,
            },
        ];

        for (const item of cases) {
            expect(
                getAdditionalDays(
                    item.input
                )
            ).toBe(item.expected)
        }
    });

    test("getColForDay", () => {
        const cases = [
            {
                input: 0,
                expected: 6,
            },
            {
                input: 1,
                expected: 0,
            },
            {
                input: 2,
                expected: 1,
            },
            {
                input: 3,
                expected: 2,
            },
            {
                input: 4,
                expected: 3,
            },
            {
                input: 5,
                expected: 4,
            },
            {
                input: 6,
                expected: 5,
            },
        ];
        for (const item of cases) {
            expect(
                getColForDay(
                    item.input
                )
            ).toBe(item.expected)
        }
    });

    test("getCol", () => {
        const {july} = months;
        const date = createDate(year, july, 1);
        for (let day = 1; day < 32; day++) {
            date.setDate(day);
            const expected = day % 7;
            expect(
                getCol(date),
            ).toBe(
                expected == 0 ? 6 : expected - 1
            );
        }
    });

    test("getCellNum with additional days", () => {
        const month = months.june;
        const date = createDate(year, month, 1);
        const firstDay = 6;
        let expected = 6;
        for (let i = 1; i < 31; i++) {
            date.setDate(i);
            expect(
                getCellNum(
                    date,
                    firstDay,
                )
            ).toBe(expected);
            expected++;
        }
    });

    test("getCellNum with no additional days", () => {
        const month = months.july;
        const date = createDate(year, month, 1);
        const firstDay = 1;
        let expected = 1;
        for (let i = 1; i < 32; i++) {
            date.setDate(i);
            expect(
                getCellNum(
                    date,
                    firstDay,
                )
            ).toBe(expected);
            expected++;
        }
    });

    test("getRow", () => {
        const month = months.june;
        const date = createDate(year, month, 1);
        const firstDay = 6;
        let cellNum = 6;
        let row = 0;
        for (let i = 1; i < 31; i++) {
            date.setDate(i);
            expect(
                getRow(date, firstDay)
            ).toStrictEqual({
                row,
                cellNum,
            });
            cellNum++;
            row = Math.ceil(cellNum / 7) - 1;
        }
    });

    test("getColForStartEnd for september " + year, () => {
        const month = months.september;
        const date = createDate(year, month, 1);
        let col = 6, row = 0, firstDay = 0;
        for (let i = 1; i < 31; i++) {
            date.setDate(i);
            expect(
                getColForStartEnd(
                    date,
                    row,
                    firstDay,
                )
            ).toEqual(col);
            if (col == 6) {
                row++;
                col = 0
            } else {
                col++
            }
        }
    });

    test("getColSpan simple case", () => {
        const month = months.september,
            start = createDate(year, month, 2),
            end = createDate(year, month, 5);

        expect(
            getColSpan(
                start,
                end,
                0,
                30,
                1,
                0
            )
        ).toBe(4)
    });

    test("getColSpan 1 september(sunday) " + year, () => {
        const {august, september} = months,
            start = createDate(year, august, 26),
            end = createDate(year, september, 1);

        expect(
            getColSpan(
                start,
                end,
                0,
                30,
                0,
                6
            )
        ).toBe(1)
    });

    test("getColSpan 28 of october - 3 of november " + year, () => {
        const {october, november} = months,
            start = createDate(year, october, 28),
            end = createDate(year, november, 3);

        expect(
            getColSpan(
                start,
                end,
                2,
                31,
                4,
                0
            )
        ).toBe(4)
    });

    test("getColSpan two weeks", () => {
        const month = months.september,
            start = createDate(year, month, 2),
            end = createDate(year, month, 15);

        expect(
            getColSpan(
                start,
                end,
                0,
                30,
                1,
                0
            )
        ).toBe(7)
    });

    test("getColSpan one week", () => {
        const month = months.september,
            start = createDate(year, month, 2),
            end = createDate(year, month, 8);

        expect(
            getColSpan(
                start,
                end,
                0,
                30,
                1,
                0
            )
        ).toBe(7)
    });

    test("getColSpan week overflow with same day num", () => {
        const month = months.september,
            start = createDate(year, month, 5),
            end = createDate(year, month, 12);

        expect(
            getColSpan(
                start,
                end,
                0,
                30,
                1,
                3
            )
        ).toBe(4)
    });

    test(
        "getColSpan week overflow with end day num < start day num",
        () => {
            const month = months.september,
                start = createDate(year, month, 5),
                end = createDate(year, month, 10);

            expect(
                getColSpan(
                    start,
                    end,
                    0,
                    30,
                    1,
                    3
                )
            ).toBe(4)
        }
    );

    test(
        "getColSpan week overflow with end day num > start day num",
        () => {
            const month = months.september,
                start = createDate(year, month, 5),
                end = createDate(year, month, 14);

            expect(
                getColSpan(
                    start,
                    end,
                    0,
                    30,
                    1,
                    3
                )
            ).toBe(4)
        }
    );

    test(
        "getColSpan throw err if end date < start date",
        () => {
            const month = months.september;

            const start = createDate(year, month, 1),
                end = createDate(year, month - 1, 1);

            expect(
                () => getColSpan(
                    start,
                    end,
                    0,
                    30,
                    0,
                    6,
                )
            ).toThrowError("end date for event should be greater than start date",)
        }
    );

    test(
        "eventCellData recurrent mon-wed september " + year,
        () => {
            const month = months.september;
            const start = createDate(year, month, 2),
                end = createDate(year, month, 4);
            const events = [
                {
                    start,
                    end,
                    isRecurrent: true,
                }
            ];

            expect(
                eventCellsData(
                    events,
                    generateMonthGrid(
                        30,
                        0,
                        31,
                        {
                            recurrent: {
                                1: true,
                                2: true,
                                3: true,
                            },
                            dates: {},
                        }
                    ),
                    0,
                    30,
                    month,
                )
            ).toStrictEqual(
                [
                    {
                        value: '2',
                        row: 1,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 3
                    },
                    {
                        value: '9',
                        row: 2,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 3
                    },
                    {
                        value: '16',
                        row: 3,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 3
                    },
                    {
                        value: '23',
                        row: 4,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 3
                    },
                    {
                        value: '30',
                        row: 5,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 1
                    }
                ]
            )
        },
    );

    test(
        "eventCellData recurrent mon-fri september " + year,
        () => {
            const month = months.september;
            const start = createDate(year, month, 2),
                end = createDate(year, month, 6);
            const events = [
                {
                    start,
                    end,
                    isRecurrent: true,
                }
            ];

            expect(
                eventCellsData(
                    events,
                    generateMonthGrid(
                        30,
                        0,
                        31,
                        {
                            recurrent: {
                                1: true,
                                2: true,
                                3: true,
                            },
                            dates: {},
                        }
                    ),
                    0,
                    30,
                    month,
                )
            ).toStrictEqual(
                [
                    {
                        value: '2',
                        row: 1,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 5
                    },
                    {
                        value: '9',
                        row: 2,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 5
                    },
                    {
                        value: '16',
                        row: 3,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 5
                    },
                    {
                        value: '23',
                        row: 4,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 5
                    },
                    {
                        value: '30',
                        row: 5,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 1
                    }
                ]
            )
        },
    );

    test(
        "eventCellData recurrent mon-sat september " + year,
        () => {
            const month = months.september;
            const start = createDate(year, month, 2),
                end = createDate(year, month, 7);
            const events = [
                {
                    start,
                    end,
                    isRecurrent: true,
                }
            ];

            expect(
                eventCellsData(
                    events,
                    generateMonthGrid(
                        30,
                        0,
                        31,
                        {
                            recurrent: {
                                1: true,
                                2: true,
                                3: true,
                            },
                            dates: {},
                        }
                    ),
                    0,
                    30,
                    month,
                )
            ).toStrictEqual(
                [
                    {
                        value: '2',
                        row: 1,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 6
                    },
                    {
                        value: '9',
                        row: 2,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 6
                    },
                    {
                        value: '16',
                        row: 3,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 6
                    },
                    {
                        value: '23',
                        row: 4,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 6
                    },
                    {
                        value: '30',
                        row: 5,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 1
                    }
                ]
            )
        },
    );

    test(
        "eventCellData recurrent mon-sun september " + year,
        () => {
            const month = months.september;
            const start = createDate(year, month, 2),
                end = createDate(year, month, 8);
            const events = [
                {
                    start,
                    end,
                    isRecurrent: true,
                }
            ];

            expect(
                eventCellsData(
                    events,
                    generateMonthGrid(
                        30,
                        0,
                        31,
                        {
                            recurrent: {
                                1: true,
                                2: true,
                                3: true,
                            },
                            dates: {},
                        }
                    ),
                    0,
                    30,
                    month,
                )
            ).toStrictEqual(
                [
                    {
                        value: '1',
                        row: 0,
                        col: 6,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 1
                    },
                    {
                        value: '2',
                        row: 1,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 7
                    },
                    {
                        value: '9',
                        row: 2,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 7
                    },
                    {
                        value: '16',
                        row: 3,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 7
                    },
                    {
                        value: '23',
                        row: 4,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 7
                    },
                    {
                        value: '30',
                        row: 5,
                        col: 0,
                        isCurrentMonth: true,
                        isEvent: true,
                        withEvent: false,
                        start,
                        end,
                        isRecurrent: true,
                        colSpan: 1
                    }
                ]
            )
        },
    );

    test(
        "eventCellData recurrent sundays september " + year,
        () => {
            const month = months.september;
            const date = createDate(year, month, 1);
            const events = [
                {
                    date,
                    isRecurrent: true,
                }
            ];

            expect(
                eventCellsData(
                    events,
                    generateMonthGrid(
                        30,
                        0,
                        31,
                        {
                            recurrent: {
                                1: true,
                                2: true,
                                3: true,
                            },
                            dates: {},
                        }
                    ),
                    0,
                    30,
                    month,
                )
            ).toStrictEqual([
                {
                    value: '1',
                    row: 0,
                    col: 6,
                    isCurrentMonth: true,
                    isEvent: true,
                    withEvent: false,
                    date,
                    isRecurrent: true,
                    colSpan: 1
                },
                {
                    value: '8',
                    row: 1,
                    col: 6,
                    colSpan: 1,
                    isCurrentMonth: true,
                    isEvent: true,
                    withEvent: false,
                    date,
                    isRecurrent: true,
                },
                {
                    value: '15',
                    row: 2,
                    col: 6,
                    colSpan: 1,
                    isCurrentMonth: true,
                    isEvent: true,
                    withEvent: false,
                    date,
                    isRecurrent: true,
                },
                {
                    value: '22',
                    row: 3,
                    col: 6,
                    colSpan: 1,
                    isCurrentMonth: true,
                    isEvent: true,
                    withEvent: false,
                    date,
                    isRecurrent: true,
                },
                {
                    value: '29',
                    row: 4,
                    col: 6,
                    colSpan: 1,
                    isCurrentMonth: true,
                    isEvent: true,
                    withEvent: false,
                    date,
                    isRecurrent: true,
                },
            ])
        }
    );

    test(
        "eventCellData recurrent saturdays september " + year,
        () => {
            const month = months.september;
            const date = createDate(year, month, 7);
            const events = [
                {
                    date,
                    isRecurrent: true,
                }
            ];

            expect(
                eventCellsData(
                    events,
                    generateMonthGrid(
                        30,
                        0,
                        31,
                        {
                            recurrent: {
                                1: true,
                                2: true,
                                3: true,
                            },
                            dates: {},
                        }
                    ),
                    0,
                    30,
                    month,
                )
            ).toStrictEqual([
                {
                    value: '7',
                    row: 1,
                    col: 5,
                    isCurrentMonth: true,
                    isEvent: true,
                    withEvent: false,
                    date,
                    isRecurrent: true,
                    colSpan: 1
                },
                {
                    value: '14',
                    row: 2,
                    col: 5,
                    isCurrentMonth: true,
                    isEvent: true,
                    withEvent: false,
                    date,
                    isRecurrent: true,
                    colSpan: 1
                },
                {
                    value: '21',
                    row: 3,
                    col: 5,
                    isCurrentMonth: true,
                    isEvent: true,
                    withEvent: false,
                    date,
                    isRecurrent: true,
                    colSpan: 1
                },
                {
                    value: '28',
                    row: 4,
                    col: 5,
                    isCurrentMonth: true,
                    isEvent: true,
                    withEvent: false,
                    date,
                    isRecurrent: true,
                    colSpan: 1
                },
            ])
        }
    );

    test(
        "normalizeEvents recurrent",
        () => {
            const month = months.september;
            const events = [
                {
                    date: createDate(year, month, 1),
                    isRecurrent: true,
                },
                {
                    start: createDate(year, month, 2),
                    end: createDate(year, month, 7),
                    isRecurrent: true,
                },
            ];

            expect(
                normalizeEvents(
                    events,
                    month,
                    30,
                )
            ).toStrictEqual(
                {
                    recurrent: {
                        1: true,
                        2: true,
                        3: true,
                        4: true,
                        5: true,
                        6: true,
                        0: true,
                    },
                    dates: {}
                }
            )
        }
    );

    test(
        "normalizeEvents not recurrent",
        () => {
            const month = months.september;
            const expected = {
                recurrent: {},
                dates: {}
            };
            const events = [];

            for (let i = 1; i < 31; i++) {
                expected.dates[i] = true;
                events.push({
                    date: createDate(year, month, i),
                })
            }

            expect(
                normalizeEvents(
                    events,
                    month,
                    30,
                )
            ).toStrictEqual(
                expected,
            )
        }
    )
});