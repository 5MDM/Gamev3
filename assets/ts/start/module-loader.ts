(async function () {
    "use strict";
    try {
        await import("./main");
    } catch(err: any) {
        function $(e: string) {
            return <HTMLElement>document.querySelector(e);
        }

        if($("#error-c > #error") == undefined) {
            //alert(err);
            throw(err);
        } else {
            $("#error-c > #error #error-text").textContent = err.message;
            $("#error-c > #error #error-stack").textContent = err.stack;
        }

        /*$("#error-overlay")!.style.display = "flex";
        $("#error-overlay #txt")!.innerText = err;
        $("#error-overlay #stack")!.innerText =
        err.stack || "Stack is undefined";

        $("#copy")
        .addEventListener("pointerup", () => {
            if("clipboard" in navigator) {
                navigator.clipboard.writeText(`${err}\n${err.stack}`)
                .then(() => alert("Copied to clipboard"))
                .catch(() => alert("Couldn't copy"))
            } else {
                alert("Clipboard is unsupported in your browser");
            }
        });*/
    }
})();