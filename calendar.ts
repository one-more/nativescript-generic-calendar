import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import * as builder from 'tns-core-modules/ui/builder';
import { Repeater } from 'tns-core-modules/ui/repeater';
import { Property } from 'tns-core-modules/ui/core/properties';
import {
    EventData,
    LayoutBase,
    Template,
    View,
} from 'tns-core-modules/ui/layouts/layout-base';
import { AbsoluteLayout } from 'tns-core-modules/ui/layouts/absolute-layout';
import { Animation } from 'tns-core-modules/ui/animation';
import { minusMonth, plusMonth, yearMonthData } from './utils';
import { CalendarEventData, CellData } from './models';
import { screen } from 'tns-core-modules/platform';
import { MonthView } from '~/components/calendar/month-view';

const HEADER_LAYOUT_PROPERTY = 'headerLayout';
const HEADER_ITEM_LAYOUT_PROPERTY = 'headerItemLayout';
const ITEM_LAYOUT_PROPERTY = 'itemLayout';
const DAY_NAMES_PROPERTY = 'dayNames';
const EVENTS_PROPERTY = 'events';
const NEXT = 'next';
const CURRENT = 'current';
const PREV = 'prev';

export const eventsProperty = new Property<
    Calendar,
    EventData[]
>({
    name: EVENTS_PROPERTY,
    affectsLayout: true,
    defaultValue: [],
    valueChanged: (target): void => {
        target.onEventsChange();
    },
});
export const dayNamesProperty = new Property<Calendar, string[]>(
    {
        name: DAY_NAMES_PROPERTY,
        affectsLayout: true,
        defaultValue: [
            'mon',
            'tue',
            'wed',
            'thu',
            'fri',
            'sat',
            'sun',
        ],
    },
);
export const headerLayoutProperty = new Property<
    Calendar,
    View | typeof LayoutBase
>({
    name: HEADER_LAYOUT_PROPERTY,
    affectsLayout: true,
    valueChanged: (target): void => {
        target.onHeaderLayoutChange();
    },
});
export const headerItemLayoutProperty = new Property<
    Calendar,
    View | Template
>({
    name: HEADER_ITEM_LAYOUT_PROPERTY,
    affectsLayout: true,
    valueChanged: (target): void => {
        target.onHeaderItemTemplateChange();
    },
});
export const itemLayoutProperty = new Property<
    Calendar,
    View | Template
>({
    name: ITEM_LAYOUT_PROPERTY,
    affectsLayout: true,
    valueChanged: (target): void => {
        target.onItemTemplateChange();
    },
});

export const knownTemplates = {
    [HEADER_LAYOUT_PROPERTY]: HEADER_LAYOUT_PROPERTY,
    [HEADER_ITEM_LAYOUT_PROPERTY]: HEADER_ITEM_LAYOUT_PROPERTY,
    [ITEM_LAYOUT_PROPERTY]: ITEM_LAYOUT_PROPERTY,
};

function getWidthDIPs(): number {
    return screen.mainScreen.widthDIPs;
}

export class Calendar extends StackLayout {
    public headerLayout: LayoutBase;
    public headerItemLayout: View | Template;
    public itemLayout: View | Template;
    public date: Date = new Date();
    public events: CalendarEventData[] = [];

    private headerRepeater: Repeater;
    private monthLayout: AbsoluteLayout;
    private animationPromise: Promise<void> = Promise.resolve();
    private monthViewWidth: number = getWidthDIPs();

    public constructor() {
        super();

        this.addChild(
            builder.parse(
                `
                    <Repeater
                        items="{{ dayNames }}"
                        loaded="onHeaderRepeaterLoaded"
                    />
                `,
                this,
            ),
        );
        this.addChild(
            builder.parse(
                `
                    <AbsoluteLayout
                        loaded="onMonthLayoutLoaded"
                    />
                `,
                this,
            ),
        );
    }

    private onMonthLayoutLoaded = (args: EventData): void => {
        this.monthLayout = args.object as AbsoluteLayout;

        if (this.monthLayout.getChildrenCount() > 0) {
            this.monthLayout.removeChildren();
        }

        this.monthLayout.addChild(this.createPrevMonthView());
        this.monthLayout.addChild(this.createCurrentMonthView());
        this.monthLayout.addChild(this.createNextMonthView());
    };

    private createPrevMonthView(): View {
        const prevDate = minusMonth(this.date);
        return this.createMonthView(
            this.monthViewData(prevDate),
            PREV,
        );
    }

    private createCurrentMonthView(): View {
        return this.createMonthView(
            this.monthViewData(this.date),
            CURRENT,
        );
    }

    private createNextMonthView(): View {
        const nextDate = plusMonth(this.date);
        return this.createMonthView(
            this.monthViewData(nextDate),
            NEXT,
        );
    }

    private applyItemTemplate(
        repeater: Repeater,
        itemLayout,
    ): void {
        repeater.itemTemplate = this.getTemplateFromItemLayout(
            itemLayout,
        );
    }

    private onHeaderRepeaterLoaded = (args: EventData): void => {
        const repeater = (this.headerRepeater = args.object as Repeater);
        this.applyHeaderLayout(repeater);
        this.applyItemTemplate(repeater, this.headerItemLayout);
    };

    private applyHeaderLayout(repeater: Repeater): void {
        if (this.headerLayout) {
            if (typeof this.headerLayout == 'function') {
                repeater.itemsLayout = new (this
                    .headerLayout as typeof LayoutBase)();
            } else {
                repeater.itemsLayout = this
                    .headerLayout as LayoutBase;
            }
        } else {
            repeater.itemsLayout = builder.parse(
                '<FlexboxLayout justifyContent="space-around" />',
            ) as LayoutBase;
        }
    }

    private createMonthView(
        items: CellData[],
        pos: typeof PREV | typeof CURRENT | typeof NEXT,
    ): View {
        const view = new MonthView();
        this.applyMonthItemTemplate(view);
        view.items = items;
        view.width = this.monthViewWidth;
        view.left = 0;
        view.top = 0;

        if (pos == PREV) {
            view.translateX = this.monthViewWidth;
        }
        if (pos == CURRENT) {
            view.translateX = 0;
        }
        if (pos == NEXT) {
            view.translateX = this.monthViewWidth;
        }

        return view;
    }

    private applyMonthItemTemplate(view: MonthView): void {
        view.itemTemplate = this.getTemplateFromItemLayout(
            this.itemLayout,
        );
    }

    private getMonthViews(): {
        prev: MonthView;
        current: MonthView;
        next: MonthView;
    } {
        return {
            prev: this.monthLayout.getChildAt(0) as MonthView,
            current: this.monthLayout.getChildAt(1) as MonthView,
            next: this.monthLayout.getChildAt(2) as MonthView,
        };
    }

    private monthViewData(date: Date): CellData[] {
        return this.yearMonthData(
            date.getMonth(),
            date.getFullYear(),
        );
    }

    private yearMonthData(
        month: number,
        year: number,
    ): CellData[] {
        return yearMonthData(month, year, this.events);
    }

    public getTemplateFromItemLayout(
        itemLayout: View | Template,
    ): Template {
        if (itemLayout) {
            if (typeof itemLayout == 'function') {
                return itemLayout as Template;
            } else {
                return (): View => itemLayout as View;
            }
        } else {
            return (): View =>
                builder.parse(
                    `
                    <Label 
                        text="{{ $value.value }}"
                        width="24"
                        textAlignment="center"
                        row="{{ $value.row }}"
                        col="{{ $value.col }}"
                    />
                `,
                );
        }
    }

    public onItemTemplateChange(): void {
        if (this.monthLayout) {
            this.monthLayout.eachChild(
                (child: MonthView): boolean => {
                    this.applyMonthItemTemplate(child);
                    child.refresh();
                    return true;
                },
            );
        }
    }

    public onHeaderItemTemplateChange(): void {
        if (this.headerRepeater) {
            this.applyItemTemplate(
                this.headerRepeater,
                this.headerItemLayout,
            );
        }
    }

    public onHeaderLayoutChange(): void {
        if (this.headerRepeater) {
            this.applyHeaderLayout(this.headerRepeater);
        }
    }

    public onEventsChange(): void {
        if (this.monthLayout) {
            const { prev, current, next } = this.getMonthViews();

            prev.items = this.monthViewData(
                minusMonth(this.date),
            );
            current.items = this.monthViewData(this.date);
            next.items = this.monthViewData(
                plusMonth(this.date),
            );
        }
    }

    private prevMonthAnimation(
        prev: MonthView,
        current: MonthView,
    ): Promise<void> {
        const definitions = [];

        definitions.push(
            {
                target: prev,
                translate: {
                    x: 0,
                    y: 0,
                },
            },
            {
                target: current,
                translate: {
                    x: this.monthViewWidth,
                    y: 0,
                },
            },
        );
        const animationSet = new Animation(definitions);

        return animationSet.play();
    }

    public prevMonth(): void {
        this.date = minusMonth(this.date);

        this.animationPromise = this.animationPromise.then(
            (): Promise<void> => {
                const {
                    prev,
                    current,
                    next,
                } = this.getMonthViews();

                prev.translateX = -this.monthViewWidth;
                const animationPromise = this.prevMonthAnimation(
                    prev,
                    current,
                );

                return animationPromise
                    .then((): void => {
                        this.monthLayout.removeChild(next);
                        this.monthLayout.insertChild(
                            this.createPrevMonthView(),
                            0,
                        );
                    })
                    .then(
                        (): Promise<void> => {
                            return new Promise(
                                (resolve): void => {
                                    setTimeout(resolve, 300);
                                },
                            );
                        },
                    );
            },
        );
    }

    public nextMonth(): void {
        this.date = plusMonth(this.date);

        this.animationPromise = this.animationPromise.then(
            (): Promise<void> => {
                const {
                    prev,
                    current,
                    next,
                } = this.getMonthViews();
                const definitions = [];

                definitions.push(
                    {
                        target: current,
                        translate: {
                            x: -this.monthViewWidth,
                            y: 0,
                        },
                    },
                    {
                        target: next,
                        translate: {
                            x: 0,
                            y: 0,
                        },
                    },
                );
                const animationSet = new Animation(definitions);
                return animationSet.play().then((): void => {
                    this.monthLayout.removeChild(prev);
                    this.monthLayout.insertChild(
                        this.createNextMonthView(),
                        2,
                    );
                });
            },
        );
    }

    public exports = {
        onMonthLayoutLoaded: this.onMonthLayoutLoaded,
        onHeaderRepeaterLoaded: this.onHeaderRepeaterLoaded,
    };
}
dayNamesProperty.register(Calendar);
headerLayoutProperty.register(Calendar);
headerItemLayoutProperty.register(Calendar);
itemLayoutProperty.register(Calendar);
eventsProperty.register(Calendar);

export * from './models';
