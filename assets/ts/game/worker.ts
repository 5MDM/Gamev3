import RenderWorker from "../../../render?worker";
import { WorkerMessageInterface, WorkerMessageType } from "./worker-enum";

if(window.Worker) {
    init();
} else {
    alert(
        "Web workers aren't supported in this browser. This means the game can't run on multiple CPU threads. "
      + "Please update the device and browser in order to play the game."
    );

    throw new Error("Web workers aren't supported");
}

export var worker: Worker;
function init() {
    worker = new RenderWorker();
    worker.onerror = e => console.error(e);
    worker.onmessageerror = e => console.error(e);
    worker.onmessage = function(e: MessageEvent<WorkerMessageInterface>) {
        if(e.data.type == WorkerMessageType.log) {
            console.log(e.data.payload);
        }
    }
}