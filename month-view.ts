import {Property} from "tns-core-modules/ui/core/properties";
import {CellData} from "~/components/calendar/models";
import {GridLayout} from "tns-core-modules/ui/layouts/grid-layout";
import {Template, View} from "tns-core-modules/ui/core/view";
import * as builder from "tns-core-modules/ui/builder";

const ITEMS_PROPERTY = "items";
const itemsProperty = new Property<MonthView, CellData[]>({
    name: ITEMS_PROPERTY,
    affectsLayout: true,
    valueChanged: (target) => {
        target.refresh()
    }
});
export class MonthView extends GridLayout {
    rows: string;
    columns: string;
    items: CellData[];
    itemTemplate: Template;
    events: View[] = [];
    cells: View[][] = [];

    constructor() {
        super();

        this.rows = "auto, auto, auto, auto, auto, auto";
        this.columns = "*, *, *, *, *, *, *";

        this.itemTemplate = () => builder.parse('<Label text="{{ $value.value }}" />');
    }

    public refresh() {
        if (this.getChildrenCount() > 0) {
            this.clearEvents();

            for (const item of this.items) {
                const {isEvent, renderer} = item;
                if (isEvent) {
                    const tpl = (renderer || this.itemTemplate);
                    this.insertItem(tpl, item)
                } else {
                    const {row, col} = item;
                    this.cells[row][col].bindingContext = item
                }
            }
        } else {
            for (const item of this.items) {
                const {isEvent, renderer} = item;
                const tpl = isEvent ? (renderer || this.itemTemplate) :
                    this.itemTemplate;

                this.insertItem(tpl, item)
            }
        }
    }

    private clearEvents() {
        for (const view of this.events) {
            this.removeChild(view)
        }
        this.events = []
    }

    private insertItem(tpl: Template, item: CellData): void {
        const view = tpl();
        const {row, col, colSpan, isEvent} = item;
        view.bindingContext = item;
        view.row = row;
        view.col = col;
        if (colSpan) {
            view.colSpan = colSpan
        }

        if (isEvent) {
            this.insertChild(
                view,
                0
            );
        } else {
            this.addChild(view)
        }

        if (isEvent) {
            this.events.push(view)
        } else {
            if (typeof this.cells[row] == "undefined") {
                this.cells[row] = []
            }
            this.cells[row][col] = view
        }
    }
}
itemsProperty.register(MonthView);