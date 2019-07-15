import {Template} from "tns-core-modules/ui/core/view";

export interface CellData {
    value: string,
    row: number,
    col: number,
    colSpan?: number,
    isCurrentMonth: boolean,
    isEvent: boolean,
    withEvent: boolean,
    renderer?: Template,
}

export interface CalendarEventData {
    date?: Date,
    isRecurrent?: boolean,
    start?: Date,
    end?: Date,
}

export interface NormalizedEvents {
    recurrent: {
        [index: number]: boolean,
    },
    dates: {
        [index: number]: boolean,
    }
}