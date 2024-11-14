import { createApp, h } from "../packages/runtime/dist/lai-web.js";

const container = document.getElementById("app");

const app = createApp({
    state: 0,
    reducers: {
        incr: (state) => state + 1,
        decr: (state) => state - 1,
    },
    view: (state, emit) => {
        return h("p", {}, [
            h("button", { on: { click: () => emit("incr") } }, ["+"]),
            h(
                "span",
                {
                    style: {
                        marginInline: "1em",
                    },
                },
                [state],
            ),
            h("button", { on: { click: () => emit("decr") } }, ["-"]),
        ]);
    },
});

app.mount(container);
